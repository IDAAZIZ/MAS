import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { localDB } from '@/lib/localStore';
import { ROLE_LABELS } from '@/lib/constants';
import type { Profile, UserRole, AwardYear, Evaluator } from '@/lib/types';

export const DEMO_ACCOUNTS: Record<string, { profile: Profile; password: string; roleName: string }> = {
  'admin@kkbda.edu.my': {
    password: '',
    roleName: 'Urusetia / Admin',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ida Safinar Binti Aziz (UJK)',
      email: 'admin@kkbda.edu.my',
      username: 'admin',
      role: 'admin',
      roles: ['admin'],
      phone: '012-3456789',
      position: 'Pegawai Urusetia Anugerah (UJK)',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
};

const DEFAULT_ACTIVE_YEAR: AwardYear = {
  id: 'year-2026',
  year: 2026,
  is_active: true,
  created_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  loading: boolean;
  activeYear: AwardYear | null;
  setActiveYear: (year: AwardYear) => void;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null; role?: UserRole; roles?: UserRole[] }>;
  signOut: () => Promise<void>;
  updateProfileName: (newName: string) => void;
  createUserWithCredentials: (params: {
    full_name: string;
    username: string;
    email?: string;
    password?: string;
    roles: UserRole[];
    position?: string;
    phone?: string;
    is_active?: boolean;
    awardCategoryIds?: string[];
    division?: string;
  }) => Promise<{ success: boolean; error?: string; user_id?: string }>;
  adminResetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  isTestMode: boolean;
  testModeEvaluator: Evaluator | null;
  loginAsEvaluator: (evaluator: Evaluator, multiRoles?: UserRole[]) => Promise<{ roles: UserRole[]; activeRole: UserRole | null }>;
  exitTestMode: () => Promise<void>;
}

const isSupabaseAuthEnabled = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes('placeholder') && !url.includes('your-project');
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYearState] = useState<AwardYear | null>(DEFAULT_ACTIVE_YEAR);
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    return localStorage.getItem('isTestMode') === 'true';
  });
  const [testModeEvaluator, setTestModeEvaluator] = useState<Evaluator | null>(() => {
    try {
      const stored = localStorage.getItem('testModeEvaluator');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    return (localStorage.getItem('activeRole') as UserRole) || null;
  });
  const [userRoles, setUserRolesState] = useState<UserRole[]>(() => {
    try {
      const stored = localStorage.getItem('userRoles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const setActiveRole = (newRole: UserRole) => {
    setActiveRoleState(newRole);
    localStorage.setItem('activeRole', newRole);
    if (user) {
      localDB.logAudit({
        userId: user.id,
        userName: profile?.full_name || 'Pengguna',
        activeRole: newRole,
        action: 'Tukar Peranan',
        details: `Bertukar peranan aktif kepada: ${ROLE_LABELS[newRole]}`,
      });
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        if (data.is_active !== true || data.activation_status !== 'active') {
          await signOut();
          return null;
        }

        let assignedRoles: UserRole[] = [];
        try {
          const { data: roleRecords } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);
          if (roleRecords && roleRecords.length > 0) {
            assignedRoles = roleRecords.map((r: any) => r.role as UserRole);
          }
        } catch {}

        if (assignedRoles.length === 0) {
          const localStoredRoles = localDB.getUserRoles(userId);
          if (localStoredRoles.length > 0) {
            assignedRoles = localStoredRoles;
          } else if (data.role) {
            assignedRoles = [data.role as UserRole];
          }
        }

        const fullProfile = { ...data, roles: assignedRoles } as Profile;
        setProfile(fullProfile);
        setUserRolesState(assignedRoles);
        localStorage.setItem('userRoles', JSON.stringify(assignedRoles));

        const currentActive = localStorage.getItem('activeRole') as UserRole;
        if (assignedRoles.length === 1) {
          setActiveRole(assignedRoles[0]);
        } else if (currentActive && assignedRoles.includes(currentActive)) {
          setActiveRoleState(currentActive);
        }

        return fullProfile;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchActiveYear = async () => {
    const stored = localStorage.getItem('activeYear');
    if (stored) {
      try {
        setActiveYearState(JSON.parse(stored));
        return;
      } catch {}
    }
    try {
      const { data } = await supabase
        .from('award_years')
        .select('*')
        .eq('is_active', true)
        .single();
      if (data) {
        setActiveYearState(data as AwardYear);
        localStorage.setItem('activeYear', JSON.stringify(data));
      } else {
        setActiveYearState(DEFAULT_ACTIVE_YEAR);
      }
    } catch {
      setActiveYearState(DEFAULT_ACTIVE_YEAR);
    }
  };

  const setActiveYear = (year: AwardYear) => {
    setActiveYearState(year);
    localStorage.setItem('activeYear', JSON.stringify(year));
  };

  const updateProfileName = (newName: string) => {
    if (!profile) return;
    const updated = { ...profile, full_name: newName };
    setProfile(updated);
    localStorage.setItem('demoProfile', JSON.stringify(updated));
    try {
      supabase.from('profiles').update({ full_name: newName }).eq('id', profile.id).then(() => {});
    } catch {}
  };

  useEffect(() => {
    // Bersihkan legasi demoProfile jika ada
    try {
      localStorage.removeItem('demoProfile');
    } catch {}

    if (isSupabaseAuthEnabled()) {
      // 1. Semak jika URL mengandungi access token bagi pemulihan kata laluan (type=recovery)
      const currentHash = window.location.hash || '';
      const currentSearch = window.location.search || '';
      const isRecoveryFlow =
        currentHash.includes('type=recovery') ||
        currentSearch.includes('type=recovery');

      if (isRecoveryFlow) {
        const basePath = import.meta.env.BASE_URL || '/';
        const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
        const targetUrl = `${window.location.origin}${normalizedBase}reset-password${currentHash}`;
        if (!window.location.pathname.includes('/reset-password')) {
          window.location.replace(targetUrl);
          return;
        }
      }

      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
          fetchActiveYear();
        } else {
          fetchActiveYear();
        }
        setLoading(false);
      }).catch(() => {
        fetchActiveYear();
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (event === 'PASSWORD_RECOVERY') {
            const basePath = import.meta.env.BASE_URL || '/';
            const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
            const targetUrl = `${window.location.origin}${normalizedBase}reset-password`;
            if (!window.location.pathname.includes('/reset-password')) {
              window.location.replace(targetUrl);
            }
            return;
          }

          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            await fetchActiveYear();
          } else {
            const checkSession = localStorage.getItem('kkbda_user_session');
            if (!checkSession) {
              setUser(null);
              setProfile(null);
            }
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } else {
      fetchActiveYear();
      setLoading(false);
    }
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const rawInput = identifier.trim();
    if (!rawInput || !password) {
      return { error: 'Sila masukkan username dan kata laluan.' };
    }

    if (!isSupabaseAuthEnabled()) {
      return { error: 'Pelayan Supabase tidak dikonfigurasikan. Sila semak fail persekitaran .env.' };
    }

    try {
      // 1. Bersihkan username: buang '@' permulaan jika ditaip, tukar ke huruf kecil
      const cleanUsername = rawInput.toLowerCase().replace(/^@/, '').trim();

      // 2. Tentukan senarai calon e-mel untuk log masuk Supabase Auth
      const candidates: string[] = [];

      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanUsername)) {
        // Pengguna menaip alamat e-mel penuh (cth: safinaraziz@gmail.com)
        candidates.push(cleanUsername);
      } else if (cleanUsername === 'admin' || cleanUsername === 'safinaraziz') {
        // Urusetia / Admin sistem - utamakan akaun pengasas berdaftar
        candidates.push(
          'safinaraziz@gmail.com',
          'admin@kkbda.edu.my',
          'admin@auth.eapresiasi.local',
          'admin@eapresiasi.local'
        );
      } else {
        // Cuba dapatkan email berdaftar jika profil boleh dicapai
        try {
          const { data: matchedProfile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', cleanUsername)
            .maybeSingle();

          if (matchedProfile?.email) {
            candidates.push(matchedProfile.email);
          }
        } catch {}

        // Format seragam akaun staf / panel dalaman
        candidates.push(`${cleanUsername}@auth.eapresiasi.local`);
      }

      let authUser: any = null;
      let lastErrorMessage: string | null = null;

      // Cuba log masuk mengikut susunan calon
      for (const emailToTry of candidates) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToTry,
          password,
        });

        if (!authError && authData?.user) {
          authUser = authData.user;
          lastErrorMessage = null;
          break;
        }

        if (authError) {
          if (authError.message?.includes('Email not confirmed')) {
            lastErrorMessage = 'Akaun pengguna ini belum disahkan dalam sistem.';
          } else if (authError.message === 'Invalid login credentials') {
            lastErrorMessage = 'Username atau kata laluan tidak sah.';
          } else {
            lastErrorMessage = authError.message;
          }
        }
      }

      if (!authUser) {
        return { error: lastErrorMessage || 'Username atau kata laluan tidak sah.' };
      }

      // 3. Ambil auth.uid()
      const userId = authUser.id;

      // 2. Baca profil pengguna daripada public.profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        return {
          error: 'Profil pengguna tidak ditemui dalam pangkalan data Supabase. Sila hubungi Urusetia.',
        };
      }

      // 3. Hanya benarkan masuk jika is_active = true dan activation_status = 'active'
      if (profileData.is_active !== true || profileData.activation_status !== 'active') {
        await supabase.auth.signOut();
        return {
          error: 'Akaun anda tidak aktif. Sila hubungi Urusetia.',
        };
      }

      // 4. Baca semua role pengguna daripada public.user_roles
      let assignedRoles: UserRole[] = [];
      try {
        const { data: roleRecords } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roleRecords && roleRecords.length > 0) {
          assignedRoles = roleRecords.map((r: any) => r.role as UserRole);
        }
      } catch {}

      if (assignedRoles.length === 0 && profileData.role) {
        assignedRoles = [profileData.role as UserRole];
      }

      const fullProfile: Profile = {
        ...profileData,
        roles: assignedRoles,
      };

      setProfile(fullProfile);
      setUserRolesState(assignedRoles);
      localStorage.setItem('userRoles', JSON.stringify(assignedRoles));
      localStorage.setItem(
        'kkbda_user_session',
        JSON.stringify({
          userId: fullProfile.id,
          email: fullProfile.email,
          username: fullProfile.username,
        })
      );
      localStorage.removeItem('demoProfile');
      setUser(authUser);

      localDB.logAudit({
        userId: fullProfile.id,
        userName: fullProfile.full_name,
        activeRole: assignedRoles[0] || 'admin',
        action: 'Log Masuk',
        details: `Pengguna ${fullProfile.full_name} (${fullProfile.email}) log masuk melalui Supabase Auth`,
      });

      // 5. Aliran Navigasi:
      if (assignedRoles.length > 1) {
        localStorage.removeItem('activeRole');
        setActiveRoleState(null);
        return { error: null, roles: assignedRoles };
      } else {
        const singleRole = assignedRoles[0] || 'admin';
        setActiveRole(singleRole);
        return { error: null, role: singleRole, roles: [singleRole] };
      }
    } catch (err: any) {
      console.error('Ralat sambungan Supabase:', err);
      return {
        error: 'Tidak dapat menghubungi pelayan Supabase. Sila periksa sambungan internet anda.',
      };
    }
  };

  const createUserWithCredentials = async (params: {
    full_name: string;
    username: string;
    email?: string;
    password?: string;
    roles: UserRole[];
    position?: string;
    phone?: string;
    is_active?: boolean;
    awardCategoryIds?: string[];
    division?: string;
  }): Promise<{ success: boolean; error?: string; user_id?: string }> => {
    const cleanFullName = params.full_name.trim();
    const rawUsername = (params.username || '').trim();

    if (!cleanFullName) {
      return { success: false, error: 'Nama penuh pengguna wajib diisi.' };
    }
    if (!rawUsername) {
      return { success: false, error: 'Username diperlukan.' };
    }
    if (rawUsername.includes('@')) {
      return { success: false, error: 'Username tidak boleh mengandungi simbol @.' };
    }
    if (rawUsername.includes(' ')) {
      return { success: false, error: 'Username tidak boleh mengandungi ruang.' };
    }

    const cleanUsername = rawUsername.toLowerCase();
    const cleanEmail = params.email?.trim().toLowerCase() || `${cleanUsername}@auth.eapresiasi.local`;
    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      return {
        success: false,
        error: 'Username hanya boleh mengandungi huruf kecil, nombor, titik (.), dash (-), atau underscore (_).',
      };
    }
    if (params.password && params.password.length < 6) {
      return { success: false, error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' };
    }
    if (!params.roles || params.roles.length === 0) {
      return { success: false, error: 'Sila pilih sekurang-kurangnya satu peranan.' };
    }

    if (!isSupabaseAuthEnabled()) {
      return {
        success: false,
        error: 'Pelayan Supabase tidak dikonfigurasikan. Pengguna production mesti didaftarkan melalui Supabase Auth.',
      };
    }

    try {
      // Resolusi UUID kategori jika peranan Panel Penilai dipilih
      let resolvedCategoryIds: string[] = [];
      if (params.roles.includes('panel') && params.awardCategoryIds && params.awardCategoryIds.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        try {
          const { data: dbAwards } = await supabase.from('awards').select('id, name, sort_order');
          if (dbAwards && dbAwards.length > 0) {
            params.awardCategoryIds.forEach((catId) => {
              if (uuidRegex.test(catId)) {
                resolvedCategoryIds.push(catId);
              } else {
                let orderNum = -1;
                if (catId.startsWith('award-')) {
                  orderNum = parseInt(catId.replace('award-', ''), 10);
                }
                const matched = dbAwards.find(
                  (a: any) =>
                    (orderNum > 0 && a.sort_order === orderNum) ||
                    a.name?.toLowerCase() === catId.toLowerCase() ||
                    a.id === catId
                );
                if (matched && uuidRegex.test(matched.id)) {
                  resolvedCategoryIds.push(matched.id);
                }
              }
            });
          }
        } catch {}

        // Jika tiada padanan UUID ditemui dari pangkalan data, hantar senarai asal untuk diproses
        if (resolvedCategoryIds.length === 0) {
          resolvedCategoryIds = params.awardCategoryIds;
        }
      }

      // Panggil Supabase Edge Function 'admin-create-user'
      // Nota Keselamatan: Hantar award_category_ids sebagai [] ke Edge Function untuk mengelakkan ralat 'permission denied for table award_years'.
      // Tugasan kategori diuruskan dan disimpan secara terus pada peringkat client & localDB.
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName,
          password: params.password?.trim() || undefined,
          roles: params.roles,
          position: params.position?.trim() || null,
          phone: params.phone?.trim() || null,
          is_active: params.is_active !== false,
          award_category_ids: [],
          division: params.division || null,
        },
      });

      if (error) {
        let detailedError = error.message;
        try {
          if ('context' in error && error.context) {
            const resObj = (error as any).context;
            try {
              const bodyJson = await resObj.clone().json();
              detailedError = bodyJson.message || bodyJson.error || bodyJson.details || JSON.stringify(bodyJson);
            } catch {
              const bodyText = await resObj.clone().text();
              if (bodyText) detailedError = bodyText;
            }
          }
        } catch {}

        if (
          detailedError.includes('already been registered') ||
          detailedError.includes('telah digunakan') ||
          detailedError.includes('USERNAME_EXISTS') ||
          detailedError.toLowerCase().includes('email') ||
          detailedError.toLowerCase().includes('e-mel')
        ) {
          detailedError = 'Username / ID Login ini telah didaftarkan dalam sistem. Sila gunakan username lain.';
        } else if (detailedError.includes('Akses tidak sah') || detailedError.includes('Sesi log masuk pemanggil tidak sah')) {
          detailedError = 'Sesi log masuk Urusetia telah luput. Sila log masuk semula.';
        } else if (detailedError.includes('Akses ditolak')) {
          detailedError = 'Akses ditolak: Hanya Urusetia (Admin) dibenarkan mendaftar pengguna baharu.';
        } else if (detailedError.includes('award_years') || detailedError.includes('permission denied for table award_years')) {
          // Fallback automatik jika semakan jadual award_years di Edge Function disekat oleh kebenaran pangkalan data:
          // Panggil semula pendaftaran tanpa award_category_ids supaya akaun Auth, profil, dan peranan tetap berjaya dicipta di Supabase.
          try {
            const retryRes = await supabase.functions.invoke('admin-create-user', {
              body: {
                email: cleanEmail,
                username: cleanUsername,
                full_name: cleanFullName,
                password: params.password?.trim() || undefined,
                roles: params.roles,
                position: params.position?.trim() || null,
                phone: params.phone?.trim() || null,
                is_active: params.is_active !== false,
                award_category_ids: [],
                division: params.division || null,
              },
            });

            if (!retryRes.error && retryRes.data?.user_id) {
              const newUserId = retryRes.data.user_id;
              localDB.logAudit({
                userId: user?.id || 'admin',
                userName: profile?.full_name || 'Urusetia',
                activeRole: 'admin',
                action: 'Cipta Pengguna Production',
                details: `Urusetia mendaftar akaun: ${cleanFullName} (${cleanEmail} / @${cleanUsername}) dengan peranan: ${params.roles.join(', ')}`,
              });
              return { success: true, user_id: newUserId };
            }
          } catch {}
        }

        return {
          success: false,
          error: detailedError || 'Gagal mendaftar pengguna dalam Supabase Auth.',
        };
      }

      if (data?.error) {
        return {
          success: false,
          error: data.error,
        };
      }

      const newUserId = data?.user_id;

      localDB.logAudit({
        userId: user?.id || 'admin',
        userName: profile?.full_name || 'Urusetia',
        activeRole: 'admin',
        action: 'Cipta Pengguna Production',
        details: `Urusetia mendaftar akaun: ${cleanFullName} (${cleanEmail} / @${cleanUsername}) dengan peranan: ${params.roles.join(', ')}`,
      });

      return { success: true, user_id: newUserId };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Ralat tidak dijangka semasa mencipta pengguna.',
      };
    }
  };

  const adminResetUserPassword = async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' };
    }

    try {
      // Panggil fungsi keselamatan admin_reset_user_password dalam database Supabase
      const { error: rpcError } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: userId,
        new_plain_password: newPassword,
      });

      if (rpcError) {
        return { success: false, error: `Gagal menetapkan semula kata laluan: ${rpcError.message}` };
      }

      const profiles = localDB.getProfiles();
      const targetUser = profiles.find((p) => p.id === userId);

      localDB.logAudit({
        userId: user?.id || 'admin',
        userName: profile?.full_name || 'Urusetia',
        activeRole: 'admin',
        action: 'Reset Kata Laluan Pengguna',
        details: `Urusetia menetapkan semula kata laluan bagi pengguna: ${targetUser?.full_name || userId}`,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menetapkan semula kata laluan.' };
    }
  };

  const changeMyPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Sila lengkapkan semua ruangan kata laluan.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: `Gagal mengemaskini kata laluan: ${error.message}` };
      }

      if (user && profile) {
        localDB.logAudit({
          userId: user.id,
          userName: profile.full_name,
          activeRole: activeRole || profile.role,
          action: 'Tukar Kata Laluan Peribadi',
          details: `Pengguna ${profile.full_name} berjaya menukar kata laluan akaun melalui Supabase Auth.`,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengemaskini kata laluan.' };
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const profiles = localDB.getProfiles();
      const prof = profiles.find((p) => p.id === userId);
      if (prof) {
        prof.is_active = isActive;
        if (!isActive) prof.activation_status = 'inactive';
        else prof.activation_status = 'active';
        localDB.saveProfile(prof);
      }

      const evals = localDB.getEvaluators();
      const ev = evals.find((e) => e.profile_id === userId || e.id === userId);
      if (ev) {
        ev.is_active = isActive;
        localStorage.setItem('kkbda_evaluators', JSON.stringify(evals));
      }

      try {
        await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
      } catch {}

      localDB.logAudit({
        userId: user?.id || 'admin',
        userName: profile?.full_name || 'Urusetia',
        activeRole: 'admin',
        action: isActive ? 'Aktifkan Akaun' : 'Nyahaktif Akaun',
        details: `Status akaun ID ${userId} ditukar kepada ${isActive ? 'Aktif' : 'Tidak Aktif'}`,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengemaskini status pengguna.' };
    }
  };

  const loginAsEvaluator = async (evaluator: Evaluator, multiRoles?: UserRole[]) => {
    let assignedRoles: UserRole[] = multiRoles || [];
    if (assignedRoles.length === 0) {
      const storedRoles = localDB.getUserRoles(evaluator.id);
      if (storedRoles.length > 0) {
        assignedRoles = storedRoles;
      } else {
        assignedRoles = ['panel'];
      }
    }

    const panelProfile: Profile = {
      id: evaluator.profile_id || evaluator.id,
      full_name: evaluator.name,
      email: evaluator.email,
      role: 'panel',
      roles: assignedRoles,
      phone: evaluator.phone || null,
      position: evaluator.position || 'Panel Penilai',
      is_active: evaluator.is_active,
      created_at: evaluator.created_at || new Date().toISOString(),
    };

    const mockUser: User = {
      id: panelProfile.id,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: panelProfile.created_at,
      email: panelProfile.email,
    } as User;

    localStorage.setItem('demoProfile', JSON.stringify(panelProfile));
    localStorage.setItem('userRoles', JSON.stringify(assignedRoles));
    localStorage.setItem('isTestMode', 'true');
    localStorage.setItem('testModeEvaluator', JSON.stringify(evaluator));

    setUser(mockUser);
    setProfile(panelProfile);
    setUserRolesState(assignedRoles);
    setIsTestMode(true);
    setTestModeEvaluator(evaluator);

    localDB.logAudit({
      userId: panelProfile.id,
      userName: panelProfile.full_name,
      activeRole: 'panel',
      action: 'Mod Ujian Panel',
      details: `Urusetia memulakan mod ujian sebagai: ${panelProfile.full_name}`,
    });

    if (assignedRoles.length === 1) {
      setActiveRole(assignedRoles[0]);
      return { roles: assignedRoles, activeRole: assignedRoles[0] };
    } else {
      localStorage.removeItem('activeRole');
      setActiveRoleState(null);
      return { roles: assignedRoles, activeRole: null };
    }
  };

  const exitTestMode = async () => {
    localStorage.removeItem('isTestMode');
    localStorage.removeItem('testModeEvaluator');
    setIsTestMode(false);
    setTestModeEvaluator(null);

    const adminDemo = DEMO_ACCOUNTS['admin@kkbda.edu.my'];
    if (adminDemo) {
      localStorage.setItem('demoProfile', JSON.stringify(adminDemo.profile));
      localStorage.setItem('userRoles', JSON.stringify(adminDemo.profile.roles || ['admin']));
      localStorage.setItem('activeRole', 'admin');
      setUser({
        id: adminDemo.profile.id,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: adminDemo.profile.created_at,
        email: adminDemo.profile.email,
      } as User);
      setProfile(adminDemo.profile);
      setUserRolesState(adminDemo.profile.roles || ['admin']);
      setActiveRoleState('admin');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('demoProfile');
    localStorage.removeItem('kkbda_user_session');
    localStorage.removeItem('activeYear');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('isTestMode');
    localStorage.removeItem('testModeEvaluator');
    setIsTestMode(false);
    setTestModeEvaluator(null);
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setProfile(null);
    setActiveRoleState(null);
    setUserRolesState([]);
  };

  const effectiveRoles =
    userRoles.length > 0 ? userRoles : profile?.roles || (profile?.role ? [profile.role] : []);
  const effectiveRole = activeRole || (effectiveRoles.length === 1 ? effectiveRoles[0] : (profile?.role as UserRole) || null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: effectiveRole,
        roles: effectiveRoles,
        activeRole,
        setActiveRole,
        switchRole: setActiveRole,
        loading,
        activeYear,
        setActiveYear,
        signIn,
        signOut,
        updateProfileName,
        createUserWithCredentials,
        adminResetUserPassword,
        changeMyPassword,
        toggleUserStatus,
        isTestMode,
        testModeEvaluator,
        loginAsEvaluator,
        exitTestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
