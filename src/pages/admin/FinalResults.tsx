import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Trophy, Award, CheckCircle2, Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { generatePDF } from '@/utils/reportGenerator';
import type { Award as AwardType, CandidateAggregate } from '@/lib/types';

interface FinalWinner {
  award: AwardType;
  candidate: CandidateAggregate | null;
  confirmedAt: string | null;
}

export default function FinalResults() {
  const { activeYear } = useAuth();
  const [winners, setWinners] = useState<FinalWinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinalResults() {
      if (!activeYear) return;
      setLoading(true);

      if (!isSupabaseConfigured()) {
        const awards = localDB.getAwards();
        const aggregates = localDB.getAggregates('', activeYear.id);
        const aggMap = new Map(aggregates.map((a) => [a.award_id, a]));

        const list: FinalWinner[] = [];
        for (const award of awards) {
          if (award.name.toLowerCase().includes('pdp')) {
            const pdpDivisions = ['SKE', 'STS', 'STM', 'SAU', 'DCV', 'AM'];
            const pdpAggs = aggregates.filter((a) => a.award_id === award.id);
            for (const div of pdpDivisions) {
              const bestInDiv = pdpAggs
                .filter((a) => a.division === div)
                .sort((a, b) => Number(b.average_score) - Number(a.average_score))[0];
              list.push({
                award: {
                  ...award,
                  name: `Pengurusan PdP Terbaik - ${div}`,
                },
                candidate: bestInDiv || null,
                confirmedAt: new Date().toISOString(),
              });
            }
          } else {
            list.push({
              award,
              candidate: aggMap.get(award.id) || null,
              confirmedAt: new Date().toISOString(),
            });
          }
        }
        setWinners(list);
        setLoading(false);
        return;
      }
      try {
        const { data: awards } = await supabase
          .from('awards')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        const { data: results } = await supabase
          .from('final_results')
          .select('*, candidate:candidate_aggregates(*)')
          .eq('award_year_id', activeYear.id);

        const resultMap = new Map(results?.map((r) => [r.award_id, r]));

        if (awards) {
          const list: FinalWinner[] = awards.map((award) => {
            const res = resultMap.get(award.id);
            return {
              award,
              candidate: res?.candidate || null,
              confirmedAt: res?.confirmed_at || null,
            };
          });
          setWinners(list);
        }
      } catch (err) {
        console.error('Error loading final results:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFinalResults();
  }, [activeYear]);

  const exportPDF = () => {
    const columns = [
      { key: 'awardName', label: 'Kategori Anugerah' },
      { key: 'winnerName', label: 'Penerima Anugerah' },
      { key: 'staffNo', label: 'No. Staf' },
      { key: 'division', label: 'Bahagian' },
      { key: 'avgScore', label: 'Markah Purata' },
      { key: 'status', label: 'Status' },
    ];

    const data = winners.map((w) => ({
      awardName: w.award.name,
      winnerName: w.candidate?.candidate_name || 'Belum Ditetapkan',
      staffNo: w.candidate?.staff_number || '-',
      division: w.candidate?.division || '-',
      avgScore: w.candidate ? Number(w.candidate.average_score).toFixed(2) : '-',
      status: w.candidate ? 'DISAHKAN PENGARAH' : 'BELUM SELESAI',
    }));

    generatePDF(`Keputusan_Rasmi_Anugerah_Apresiasi_KKBDA_${activeYear?.year || 2026}`, columns, data);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Keputusan Rasmi Anugerah Apresiasi"
        subtitle={`Senarai rasmi penerima Anugerah Apresiasi Staf KKBDA bagi Sesi Tahun ${activeYear?.year || '-'}. Keputusan telah dimuktamadkan oleh Pengarah.`}
        actions={
          <Button variant="gold" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-1" /> Muat Turun Senarai Pemenang (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winners.map(({ award, candidate, confirmedAt }) => (
          <Card key={award.id} className="relative overflow-hidden border-2 border-transparent hover:border-gold/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
                <Trophy className="w-5 h-5" />
              </div>
              {candidate ? (
                <Badge variant="gold">MUKTAMAD</Badge>
              ) : (
                <Badge variant="neutral">DALAM PROSES</Badge>
              )}
            </div>

            <h4 className="font-bold text-navy text-base mb-1">{award.name}</h4>
            <p className="text-xs text-gray-500 mb-4">{award.description || 'Penganugerahan apresiasi kecemerlangan staf'}</p>

            <div className="p-4 rounded-xl bg-surface border border-gray-100">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">
                Penerima Anugerah
              </span>
              {candidate ? (
                <div>
                  <p className="font-bold text-gray-900 text-base">{candidate.candidate_name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Bahagian {candidate.division}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Markah Purata Akhir:</span>
                    <span className="font-mono font-bold text-navy text-sm">
                      {Number(candidate.average_score).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-gray-400">
                  Keputusan muktamad belum disahkan oleh Pengarah.
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
