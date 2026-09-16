import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_DASHBOARDS, APP_NAME, APP_FULL_NAME, APP_ORG } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import { Award, Users, UserCheck, Shield, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_INFO: Record<
  UserRole,
  {
    title: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
  }
> = {
  admin: {
    title: 'Urusetia / Admin',
    desc: 'Pengurusan keseluruhan anugerah, kategori, panel, data ujian, dan pemantauan status penilaian.',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-400',
  },
  panel: {
    title: 'Panel Penilai',
    desc: 'Menilai calon anugerah, memasukkan calon baharu, dan mengurus calon yang dicadangkan oleh anda sendiri.',
    icon: UserCheck,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200 hover:border-amber-400',
  },
  management: {
    title: 'Pengurusan (TPA / TPP)',
    desc: 'Menyemak markah calon, purata panel, dan membuat pemilihan cadangan peringkat pengurusan.',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400',
  },
  director: {
    title: 'Pengarah Kolej',
    desc: 'Pengesahan dan kelulusan rasmi keputusan akhir pemenang anugerah tahunan.',
    icon: Award,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200 hover:border-emerald-400',
  },
};

export default function SelectRolePage() {
  const { user, profile, roles, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    toast.success(`Peranan aktif: ${ROLE_LABELS[role] || role}`);
    navigate(ROLE_DASHBOARDS[role] || '/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 border border-gold/10 rotate-45 -translate-x-32 -translate-y-32 pointer-events-none rounded-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 border border-gold/5 rotate-12 translate-x-48 translate-y-48 rounded-full pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-gold/30 shadow-lg shadow-gold/10">
            <Award className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gold tracking-wide">{APP_NAME}</h1>
          <p className="text-white/80 text-sm mt-1 font-medium">{APP_FULL_NAME}</p>
          <p className="text-white/50 text-xs">{APP_ORG}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          <div className="text-center mb-6 pb-5 border-b border-gray-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Sesi Pengguna Pelbagai Peranan</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Pilih Peranan Anda</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
              Selamat kembali, <strong className="text-navy">{profile?.full_name || user?.email}</strong>. Anda mempunyai lebih daripada satu peranan. Sila pilih peranan untuk sesi ini.
            </p>
          </div>

          <div className="space-y-3">
            {roles.map((role) => {
              const info = ROLE_INFO[role] || {
                title: ROLE_LABELS[role] || role,
                desc: 'Akses sistem mengikut peranan ini.',
                icon: Users,
                color: 'text-gray-700',
                bg: 'bg-gray-50',
                border: 'border-gray-200 hover:border-gray-400',
              };
              const Icon = info.icon;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left group hover:shadow-md ${info.border} bg-white hover:bg-gray-50/50`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${info.bg} ${info.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-navy transition-colors">
                          {info.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {info.desc}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-navy group-hover:text-white transition-all shrink-0 ml-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Anda boleh menukar peranan pada bila-bila masa di menu pengguna.</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
