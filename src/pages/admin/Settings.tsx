import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings as SettingsIcon, Save, Database, Shield, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { APP_NAME, APP_FULL_NAME, APP_ORG, APP_TAGLINE } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function Settings() {
  const [maxCandidatesDefault, setMaxCandidatesDefault] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'default_max_candidates')
        .single();
      if (data && data.value) {
        setMaxCandidatesDefault(data.value.count || 1);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        key: 'default_max_candidates',
        value: { count: maxCandidatesDefault },
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Tetapan sistem berjaya disimpan.');
    } catch (err) {
      toast.error('Ralat menyimpan tetapan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Tetapan Sistem"
        subtitle="Konfigurasi parameter umum, polisi had pencalonan, dan maklumat seni bina sistem e-APRESIASI."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-bold text-navy text-lg mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gold" />
              Parameter Penganugerahan
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="label">Default Bilangan Calon Akhir (Pengarah)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxCandidatesDefault}
                  onChange={(e) => setMaxCandidatesDefault(parseInt(e.target.value) || 1)}
                  className="input-field max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Menentukan bilangan calon yang dibenarkan dipilih oleh Pengarah secara lalai bagi setiap kategori.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button variant="primary" type="submit" loading={loading}>
                  <Save className="w-4 h-4 mr-1" /> Simpan Tetapan
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gold" />
              Maklumat Aplikasi
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">Sistem:</span>
                <p className="font-bold text-gray-800">{APP_NAME}</p>
              </div>
              <div>
                <span className="text-gray-400">Keterangan:</span>
                <p className="text-gray-800">{APP_FULL_NAME}</p>
              </div>
              <div>
                <span className="text-gray-400">Institusi:</span>
                <p className="text-gray-800">{APP_ORG}</p>
              </div>
              <div>
                <span className="text-gray-400">Tagline:</span>
                <p className="italic text-gray-600">"{APP_TAGLINE}"</p>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              Keselamatan & Integriti
            </h4>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Supabase PostgreSQL dengan Row-Level Security (RLS)</li>
              <li>Role-Based Access Control (Admin, Panel, TPA/TPP, Pengarah)</li>
              <li>Penyembunyian identiti panel penilai daripada paparan pihak atasan</li>
              <li>Auto-audit log bagi setiap aksi pemarkahan & keputusan</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
