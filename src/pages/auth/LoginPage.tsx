import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DASHBOARDS, APP_NAME, APP_FULL_NAME, APP_ORG, APP_TAGLINE } from '@/lib/constants';
import { Award, Eye, EyeOff, Loader2, UserCheck, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { supabase } from '@/lib/supabase';
import type { Evaluator, EvaluatorAssignment, Award as AwardType } from '@/lib/types';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { signIn, loginAsEvaluator } = useAuth();
  const navigate = useNavigate();

  // Semak jika pengguna tiba melalui pautan reset password e-mel Supabase
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      navigate('/reset-password' + hash, { replace: true });
    }
  }, [navigate]);

  // Test Mode: Select Panel State (Khusus untuk pengujian dalaman urusetia)
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [evaluatorsList, setEvaluatorsList] = useState<Evaluator[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<EvaluatorAssignment[]>([]);
  const [awardsList, setAwardsList] = useState<AwardType[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<string>('');
  const [isMultiRoleTest, setIsMultiRoleTest] = useState<boolean>(false);

  const handleLogin = async (loginUser: string, loginPass: string) => {
    const cleanUser = loginUser.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUser || !loginPass) {
      toast.error('Sila masukkan username dan kata laluan.');
      return;
    }
    setLoading(true);
    const { error, role, roles } = await signIn(cleanUser, loginPass);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    if (roles && roles.length > 1) {
      navigate('/select-role');
    } else if (role && ROLE_DASHBOARDS[role]) {
      navigate(ROLE_DASHBOARDS[role]);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(username, password);
  };

  const openPanelSelector = async () => {
    let evals: Evaluator[] = [];
    let asgns: EvaluatorAssignment[] = [];
    let awards: AwardType[] = [];

    if (!isSupabaseConfigured()) {
      evals = localDB.getEvaluators().filter((e) => e.is_active);
      asgns = (localDB as any).getAssignments ? localDB.getAssignments('', 'year-2026') : [];
      awards = localDB.getAwards();
    } else {
      try {
        const [evRes, asgRes, awRes] = await Promise.all([
          supabase.from('evaluators').select('*').eq('is_active', true).order('name'),
          supabase.from('evaluator_assignments').select('*'),
          supabase.from('awards').select('*').eq('is_active', true),
        ]);
        evals = (evRes.data || []) as Evaluator[];
        asgns = (asgRes.data || []) as EvaluatorAssignment[];
        awards = (awRes.data || []) as AwardType[];
      } catch {
        evals = localDB.getEvaluators().filter((e) => e.is_active);
        asgns = (localDB as any).getAssignments ? localDB.getAssignments('', 'year-2026') : [];
        awards = localDB.getAwards();
      }
    }

    setEvaluatorsList(evals);
    setAssignmentsList(asgns);
    setAwardsList(awards);
    if (evals.length > 0) {
      setSelectedEvalId(evals[0].id);
    }
    setPanelModalOpen(true);
  };

  const handleConfirmLoginAsPanel = async () => {
    const selected = evaluatorsList.find((e) => e.id === selectedEvalId);
    if (!selected) {
      toast.error('Sila pilih panel penilai.');
      return;
    }

    const res = await loginAsEvaluator(selected, isMultiRoleTest ? ['panel', 'management'] : ['panel']);
    toast.success(`Memasuki mod ujian sebagai: ${selected.name}`);
    setPanelModalOpen(false);
    if (res.roles.length > 1) {
      navigate('/select-role');
    } else {
      navigate('/panel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 border border-gold/10 rotate-45 -translate-x-32 -translate-y-32 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 border border-gold/5 rotate-12 translate-x-48 translate-y-48 rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-gold/30 rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gold/20 rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-gold/30">
            <Award className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-extrabold text-gold tracking-wide">{APP_NAME}</h1>
          <p className="text-white/80 text-sm mt-1 font-medium">{APP_FULL_NAME}</p>
          <p className="text-white/50 text-xs mt-0.5">{APP_ORG}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label font-bold text-navy">USERNAME / ID LOGIN</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="input-field font-medium"
                placeholder="Masukkan username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div>
              <label className="label font-bold text-navy">KATA LALUAN</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <label className="flex items-center gap-2 text-xs text-navy/80 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-gold focus:ring-gold cursor-pointer"
                />
                <span>Ingat Saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold text-base py-3 flex items-center justify-center gap-2 font-bold shadow-md shadow-gold/20 hover:shadow-lg cursor-pointer tracking-wider"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              LOG MASUK
            </button>
          </form>

          {/* Hubungi Urusetia / Lupa Kata Laluan Link */}
          <div className="text-center mt-5 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-navy/70">
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              className="text-navy/70 hover:text-navy hover:underline font-medium cursor-pointer"
            >
              Lupa Kata Laluan? Hubungi Urusetia
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6 italic">{APP_TAGLINE}</p>
      </div>

      {/* MODAL: BANTUAN LUPA KATA LALUAN */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Lupa Kata Laluan / Masalah Akses"
        size="sm"
      >
        <div className="space-y-3 text-xs text-gray-600">
          <p>
            Akaun e-APRESIASI KKBDA didaftarkan dan diuruskan sepenuhnya oleh Urusetia Anugerah.
          </p>
          <div className="p-3 bg-navy/5 rounded-xl border border-navy/10 space-y-1 text-navy">
            <p className="font-bold">Sila hubungi Pegawai Urusetia Anugerah:</p>
            <p><strong>Urusetia:</strong> Ida Safinar Binti Aziz (UJK)</p>
            <p><strong>E-mel:</strong> admin@kkbda.edu.my</p>
            <p><strong>Unit:</strong> Unit Jaminan Kualiti (UJK) KKBDA</p>
          </div>
          <p className="text-gray-500">
            Urusetia boleh menetapkan semula kata laluan anda melalui menu Pengurusan Pengguna.
          </p>
          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setHelpModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: PILIH PANEL SEBENAR UNTUK UJIAN */}
      <Modal
        isOpen={panelModalOpen}
        onClose={() => setPanelModalOpen(false)}
        title="Uji Sebagai Panel Penilai (Pilih Panel Sebenar)"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gold/10 rounded-xl border border-gold/30 text-xs text-navy flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mod Pengujian Panel Sebenar:</p>
              <p className="mt-0.5 text-gray-600">
                Pilih mana-mana panel penilai yang telah didaftarkan dalam sistem bagi menguji aliran penilaian mengikut kategori yang benar-benar ditugaskan kepada panel tersebut.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Pilih Panel Penilai:</label>
            <select
              value={selectedEvalId}
              onChange={(e) => setSelectedEvalId(e.target.value)}
              className="input-field text-xs py-2"
            >
              {evaluatorsList.map((ev) => {
                const count = assignmentsList.filter((a) => a.evaluator_id === ev.id).length;
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.position ? `(${ev.position})` : ''} - {count} Kategori Ditugaskan
                  </option>
                );
              })}
            </select>
          </div>

          {/* Details of Selected Panel */}
          {(() => {
            const selected = evaluatorsList.find((e) => e.id === selectedEvalId);
            if (!selected) return null;
            const myAsgns = assignmentsList.filter((a) => a.evaluator_id === selected.id);
            const awardMap = new Map(awardsList.map((a) => [a.id, a.name]));

            return (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">{selected.name}</span>
                  {selected.is_dummy ? (
                    <Badge variant="warning">Akaun Ujian Awal</Badge>
                  ) : (
                    <Badge variant="success">Panel Sebenar</Badge>
                  )}
                </div>
                <div className="text-gray-500 text-[11px] space-y-0.5">
                  <p>E-mel: <strong className="text-gray-700">{selected.email}</strong></p>
                  <p>Jawatan: <strong className="text-gray-700">{selected.position || '-'}</strong></p>
                </div>

                <div className="pt-2 border-t border-gray-200/60">
                  <p className="font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Kategori Ditugaskan:</span>
                    <span className="font-mono text-gold font-bold">{myAsgns.length} Kategori</span>
                  </p>
                  {myAsgns.length === 0 ? (
                    <p className="text-[11px] text-amber-700 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Panel ini belum ditugaskan sebarang kategori dalam sistem. (Dashboard akan memaparkan 0 tugasan).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {myAsgns.map((a) => (
                        <span key={a.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/5 text-navy border border-navy/10">
                          {awardMap.get(a.award_id) || a.award_id}
                          {a.division ? ` (${a.division})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMultiRoleTest}
                      onChange={(e) => setIsMultiRoleTest(e.target.checked)}
                      className="rounded border-gray-300 text-gold focus:ring-gold cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      Uji sebagai Dwi-Peranan (Panel Penilai + TPA/TPP)
                    </span>
                  </label>
                  <p className="text-[10px] text-gray-400 ml-5 mt-0.5">
                    Membolehkan anda menguji skrin pemilihan peranan dan beralih antara Panel & TPA/TPP.
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={() => setPanelModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmLoginAsPanel}
              disabled={!selectedEvalId}
              className="flex items-center gap-1.5 bg-gold hover:bg-gold-600 text-navy font-bold cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk Mod Ujian</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
