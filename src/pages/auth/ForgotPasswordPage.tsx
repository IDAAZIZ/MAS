import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Award, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Sila masukkan e-mel.'); return; }
    setLoading(true);
    const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });
    if (error) toast.error(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gold">Lupa Kata Laluan</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">E-mel Dihantar</h3>
              <p className="text-gray-500 text-sm">Sila semak e-mel anda untuk pautan tetapan semula kata laluan.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">E-mel</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="email@kkbda.edu.my" />
              </div>
              <Button variant="gold" loading={loading} type="submit" className="w-full">Hantar Pautan</Button>
            </form>
          )}
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-navy/60 hover:text-navy inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Kembali ke Log Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
