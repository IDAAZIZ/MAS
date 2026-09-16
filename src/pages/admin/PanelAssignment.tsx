import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Users, Award, CheckCircle2, UserPlus, Info } from 'lucide-react';
import { useAwards } from '@/hooks/useAwards';
import { useEvaluators, useAssignments } from '@/hooks/useEvaluators';
import { useAuth } from '@/contexts/AuthContext';
import { PDP_DIVISIONS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function PanelAssignment() {
  const { activeYear } = useAuth();
  const { data: awards = [], isLoading: loadingAwards } = useAwards();
  const { data: evaluators = [], isLoading: loadingEvaluators } = useEvaluators();

  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  const activeAwardId = selectedAwardId || (awards[0]?.id ?? '');
  const selectedAward = awards.find((a) => a.id === activeAwardId);
  const isPdpCategory = selectedAward?.name.toLowerCase().includes('pdp');

  const {
    data: assignments = [],
    isLoading: loadingAssignments,
    assign,
    unassign,
    setDivision,
  } = useAssignments(activeAwardId, activeYear?.id || '');

  const assignmentMap = new Map(assignments.map((a) => [a.evaluator_id, a]));
  const assignedEvaluatorIds = new Set(assignments.map((a) => a.evaluator_id));

  const handleToggle = async (evaluatorId: string, isAssigned: boolean) => {
    if (!activeAwardId || !activeYear) {
      toast.error('Sila pilih kategori dan pastikan tahun anugerah aktif.');
      return;
    }

    if (isAssigned) {
      await unassign.mutateAsync(evaluatorId);
    } else {
      await assign.mutateAsync(evaluatorId);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Tugasan Panel Penilai"
        subtitle="Tetapkan seorang atau lebih panel penilai bagi setiap kategori anugerah. Pemarkahan akan dipuratakan jika kategori mempunyai berbilang panel."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Selector on the Left */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              Pilih Kategori Anugerah
            </h3>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {awards.map((award) => {
                const isSelected = award.id === activeAwardId;
                return (
                  <button
                    key={award.id}
                    onClick={() => setSelectedAwardId(award.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-sm ${
                      isSelected
                        ? 'bg-navy text-white font-bold shadow-md shadow-navy/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span>{award.name}</span>
                    {isSelected && <Badge variant="gold">Dipilih</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Evaluators Checklist on the Right */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="text-xs font-semibold text-gold uppercase tracking-wider">Kategori Semasa</span>
                <h3 className="text-lg font-bold text-navy">{selectedAward?.name || 'Pilih Kategori'}</h3>
                <p className="text-xs text-gray-500">
                  {assignments.length} panel ditugaskan pada tahun {activeYear?.year || '-'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={assignments.length > 0 ? 'success' : 'warning'}>
                  {assignments.length > 1
                    ? `${assignments.length} Panel (Auto-Purata)`
                    : assignments.length === 1
                    ? '1 Panel Penilai'
                    : 'Belum Ditugaskan'}
                </Badge>
              </div>
            </div>

            {/* Special PdP Information Banner */}
            {isPdpCategory && (
              <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm block mb-1 text-blue-950">
                    Penetapan Ketua Program (KP) Mengikut Bahagian
                  </span>
                  Bagi anugerah <strong>Pengurusan PdP Terbaik</strong>, sila pilih bahagian ({PDP_DIVISIONS.join(', ')}) bagi setiap panel/KP yang ditugaskan. Setiap bahagian akan melahirkan pemenang masing-masing.
                </div>
              </div>
            )}

            {loadingEvaluators || loadingAssignments ? (
              <div className="py-12 text-center text-gray-400">Memuatkan senarai panel...</div>
            ) : evaluators.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                Tiada panel penilai didaftarkan. Sila daftarkan panel di menu "Senarai Panel" terlebih dahulu.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluators.map((evaluator) => {
                  const isAssigned = assignedEvaluatorIds.has(evaluator.id);
                  const assignment = assignmentMap.get(evaluator.id);
                  const currentDivision = assignment?.division;

                  return (
                    <div
                      key={evaluator.id}
                      onClick={() => handleToggle(evaluator.id, isAssigned)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isAssigned
                          ? 'border-navy bg-navy/5 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => {}} // Handled by container
                                className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy pointer-events-none"
                              />
                              <h5 className="font-bold text-gray-900 text-sm">{evaluator.name}</h5>
                            </div>
                            <p className="text-xs text-gray-500 pl-6">{evaluator.position || 'Penilai'}</p>
                            <p className="text-xs text-gray-400 pl-6">{evaluator.email}</p>
                          </div>

                          {isAssigned && (
                            <CheckCircle2 className="w-5 h-5 text-navy shrink-0" />
                          )}
                        </div>

                        {/* PdP Division Selector */}
                        {isAssigned && isPdpCategory && (
                          <div
                            className="mt-3 pt-3 border-t border-navy/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-navy flex items-center gap-1">
                                <Award className="w-3 h-3 text-gold" />
                                Bahagian Ditugaskan (KP):
                              </span>
                              {currentDivision ? (
                                <Badge variant="gold" className="text-[10px] font-bold uppercase">
                                  {currentDivision}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-semibold italic">
                                  Pilih Bahagian ⬇
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-6 gap-1 mt-1">
                              {PDP_DIVISIONS.map((div) => {
                                const isSelected = currentDivision === div;
                                return (
                                  <button
                                    key={div}
                                    type="button"
                                    onClick={() =>
                                      setDivision.mutate({
                                        evaluatorId: evaluator.id,
                                        division: div,
                                      })
                                    }
                                    className={`py-1 rounded text-[11px] font-bold transition-all text-center ${
                                      isSelected
                                        ? 'bg-navy text-white shadow-sm ring-2 ring-navy/30'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gold/15 hover:border-gold'
                                    }`}
                                  >
                                    {div}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 p-3.5 bg-gold-50/50 border border-gold-200/50 rounded-xl text-xs text-gold-900">
              💡 <strong>Nota Integriti:</strong> Setiap panel yang ditugaskan hanya akan melihat dan menilai calon yang didaftarkan oleh dirinya sendiri. Sistem akan memadankan calon sama secara automatik mengikut Nama + Bahagian dan mengira markah purata secara telus.
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
