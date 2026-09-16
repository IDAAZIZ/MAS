import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Award, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ActivateAccountPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if current user is signed in from invite link (Supabase handles invite token via URL hash automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
      }
      setSessionChecked(true);
    }).catch(() => {
      setSessionChecked(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Sila lengkapkan semua ruangan kata laluan.');
      return;
    }
    if (password.length < 8) {
      toast.error('Kata laluan mestilah sekurang-kurangnya 8 aksara.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Kata laluan dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || 'Gagal mengaktifkan akaun.');
      setLoading(false);
      return;
    }

    toast.success('Akaun anda telah berjaya diaktifkan!');
    setActivated(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-gold/30">
            <Award className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-extrabold text-gold tracking-wide">Aktivasi Akaun Pengguna</h1>
          <p className="text-white/80 text-sm mt-1">Sistem Pengurusan Anugerah e-APRESIASI KKBDA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          {activated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-navy">Akaun Berjaya Diaktifkan!</h3>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">
                Kata laluan anda telah berjaya ditetapkan. Anda kini boleh log masuk menggunakan e-mel rasmi dan kata laluan baru anda.
              </p>
              <div className="pt-4">
                <Button
                  variant="gold"
                  className="w-full py-2.5 flex items-center justify-center gap-2 font-bold"
                  onClick={() => navigate('/login')}
                >
                  Pergi ke Halaman Log Masuk
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Selamat Datang ke e-APRESIASI KKBDA</p>
                  <p className="mt-0.5 text-emerald-700">
                    {userEmail
                      ? `Mengaktifkan akaun untuk e-mel: ${userEmail}`
                      : 'Sila tetapkan kata laluan keselamatan peribadi anda bagi mengaktifkan akaun.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Kata Laluan Baru (Minimum 8 Aksara)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Sahkan Kata Laluan Baru</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="gold"
                  loading={loading}
                  type="submit"
                  className="w-full py-3 font-bold text-base shadow-md shadow-gold/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  AKTIFKAN AKAUN SAYA
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-navy/60 hover:text-navy font-medium">
                  Kembali ke Log Masuk
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
