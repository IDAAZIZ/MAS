import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import { CheckSquare, Square, Search, Filter, CheckCircle2, ShieldAlert, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { useCandidateAggregates, useManagementSelections } from '@/hooks/useSelections';
import { DIVISIONS } from '@/lib/constants';
import type { CandidateAggregate } from '@/lib/types';
import SecretariatPrintDocument, { type SecretariatPrintItem } from '@/components/report/SecretariatPrintDocument';
import toast from 'react-hot-toast';

export default function ManagementDashboard() {
  const { activeYear, profile } = useAuth();
  const { data: awards = [] } = useAwards();

  // Filters state
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, selected, unselected
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: candidates = [], isLoading } = useCandidateAggregates(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const { data: selections = [], toggle } = useManagementSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );

  // Map of selections by candidate_aggregate_id
  const selectionMap = useMemo(() => {
    return new Map(selections.map((s) => [s.candidate_aggregate_id, s.selected]));
  }, [selections]);

  // Handle auto-save toggle with quota checking
  const handleToggleSelection = async (candidate: CandidateAggregate & { award?: any }) => {
    if (!activeYear) return;

    const isCurrentlySelected = !!selectionMap.get(candidate.id);
    const willBeSelected = !isCurrentlySelected;

    // Check quota for this category if selecting
    if (willBeSelected) {
      const isPdp = candidate.award?.name.toLowerCase().includes('pdp');
      if (isPdp) {
        // For Pengurusan PdP Terbaik, allow 1 candidate per division
        const currentInDivision = candidates.filter(
          (c) => c.award_id === candidate.award_id && c.division === candidate.division && selectionMap.get(c.id)
        ).length;
        if (currentInDivision >= 1) {
          toast.error(`Bagi Pengurusan PdP Terbaik, hanya 1 calon dibenarkan dicadangkan bagi setiap bahagian (${candidate.division}).`);
          return;
        }
      } else {
        const awardLimit = candidate.award?.max_candidates || 1;
        const currentSelectedInCategory = candidates.filter(
          (c) => c.award_id === candidate.award_id && selectionMap.get(c.id)
        ).length;

        if (currentSelectedInCategory >= awardLimit) {
          toast.error(`Kategori "${candidate.award?.name || 'ini'}" hanya membenarkan ${awardLimit} calon dicadangkan.`);
          return;
        }
      }
    }

    await toggle.mutateAsync({
      candidateAggregateId: candidate.id,
      awardId: candidate.award_id,
      yearId: activeYear.id,
      selected: willBeSelected,
    });
  };

  // Filtered and sorted data (default: Purata tertinggi ke terendah)
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Category filter
        if (selectedAwardId && c.award_id !== selectedAwardId) return false;
        // Division filter
        if (selectedDivision && c.division !== selectedDivision) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = c.candidate_name.toLowerCase().includes(q);
          const matchStaff = c.staff_number?.toLowerCase().includes(q);
          const matchAward = c.award?.name.toLowerCase().includes(q);
          if (!matchName && !matchStaff && !matchAward) return false;
        }
        // Status filter
        const isSel = !!selectionMap.get(c.id);
        if (selectedStatus === 'selected' && !isSel) return false;
        if (selectedStatus === 'unselected' && isSel) return false;

        return true;
      })
      .sort((a, b) => Number(b.average_score) - Number(a.average_score));
  }, [candidates, selectedAwardId, selectedDivision, selectedStatus, searchQuery, selectionMap]);

  // Data untuk format cetakan rasmi Urus Setia
  const printItems: SecretariatPrintItem[] = useMemo(() => {
    return filteredCandidates.map((c) => ({
      id: c.id,
      candidate_name: c.candidate_name,
      staff_number: c.staff_number,
      division: c.division,
      average_score: c.average_score,
      category_name: c.award?.name || 'Kategori Anugerah',
      is_mgmt_approved: !!selectionMap.get(c.id),
      is_director_approved: false,
    }));
  }, [filteredCandidates, selectionMap]);

  return (
    <DashboardLayout>
      <div className="screen-only">
        <PageHeader
          title="Semakan & Pengesahan Pengurusan (TPA / TPP)"
          subtitle="Semak senarai semua calon berserta markah purata dan tandakan pengesahan calon untuk pertimbangan Pengarah."
          actions={
            <Button
              variant="gold"
              onClick={() => window.print()}
              className="flex items-center gap-2 shadow-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              Cetak Senarai ke Urus Setia
            </Button>
          }
        />

        {/* Filter and Search Bar */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">CARI CALON</label>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Nama, No. Staf, Kategori..."
              />
            </div>

            <div>
              <label className="label">FILTER KATEGORI</label>
              <select
                value={selectedAwardId}
                onChange={(e) => setSelectedAwardId(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Kategori Anugerah</option>
                {awards.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">FILTER BAHAGIAN</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Bahagian</option>
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">STATUS PENGESAHAN</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">Semua Calon</option>
                <option value="selected">Disahkan (☑)</option>
                <option value="unselected">Belum Disahkan (☐)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Info Alert regarding TPA/TPP Shared Role */}
        <div className="mb-4 p-3.5 bg-navy-50 border border-navy-200/60 rounded-xl text-xs text-navy flex items-center justify-between">
          <span>
            👥 <strong>Peranan Pengurusan Bersama:</strong> TPA dan TPP berkongsi role Pengurusan. Sebarang penandaan pengesahan akan dikongsi secara langsung dengan fungsi Simpan Automatik (Auto Save).
          </span>
          <Badge variant="gold">Auto Save Aktif</Badge>
        </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400">Memuatkan calon anugerah...</div>
      ) : filteredCandidates.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <p>Tiada calon ditemui mengikut tapisan yang dipilih.</p>
        </Card>
      ) : (
        <>
          {/* Desktop Table View - STRICT ORDER:
              1. KATEGORI | 2. CALON | 3. BAHAGIAN | 4. MARKAH | 5. MARKAH PURATA | 6. PILIHAN TPP/TPA
          */}
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0 shadow-md">
              <table className="w-full">
                <thead>
                  <tr className="table-header border-b border-gray-200">
                    <th className="px-5 py-4 text-left">1. KATEGORI</th>
                    <th className="px-5 py-4 text-left">2. CALON</th>
                    <th className="px-5 py-4 text-left">3. BAHAGIAN</th>
                    <th className="px-5 py-4 text-center">4. MARKAH</th>
                    <th className="px-5 py-4 text-center">5. MARKAH PURATA</th>
                    <th className="px-5 py-4 text-center">6. PENGESAHAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCandidates.map((cand) => {
                    const isSelected = !!selectionMap.get(cand.id);

                    return (
                      <tr
                        key={cand.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-gold-50/30 hover:bg-gold-50/50' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {/* 1. KATEGORI */}
                        <td className="px-5 py-4 font-semibold text-navy text-sm">
                          {cand.award?.name || '-'}
                        </td>

                        {/* 2. CALON */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900 text-sm">{cand.candidate_name}</p>
                          {cand.staff_number && (
                            <p className="text-xs font-mono text-gray-400">No. Staf: {cand.staff_number}</p>
                          )}
                        </td>

                        {/* 3. BAHAGIAN */}
                        <td className="px-5 py-4">
                          <Badge variant="neutral">{cand.division}</Badge>
                        </td>

                        {/* 4. MARKAH (e.g. [88] [92]) */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {(cand.individual_scores || []).map((score: number, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy/10 text-navy border border-navy/20"
                              >
                                [{score}]
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 5. MARKAH PURATA (2 decimal places) */}
                        <td className="px-5 py-4 text-center">
                          <span className="font-mono font-bold text-navy text-base">
                            {Number(cand.average_score).toFixed(2)}
                          </span>
                        </td>

                        {/* 6. PENGESAHAN (Checkbox) */}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelection(cand)}
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-100 transition-transform active:scale-95"
                            title="Tandakan untuk pengesahan"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-6 h-6 text-gold fill-gold/10" />
                            ) : (
                              <Square className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Card View (Requirement #50) */}
          <div className="md:hidden space-y-4">
            {filteredCandidates.map((cand) => {
              const isSelected = !!selectionMap.get(cand.id);

              return (
                <Card
                  key={cand.id}
                  className={`p-5 border-2 transition-all ${
                    isSelected ? 'border-gold bg-gold-50/15 shadow-md' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">
                      {cand.award?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelection(cand)}
                      className="p-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-gold" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base mb-1">
                    {cand.candidate_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Bahagian: <strong className="text-gray-700">{cand.division}</strong>
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-1">Markah:</span>
                      <div className="flex items-center gap-1">
                        {(cand.individual_scores || []).map((score: number, idx: number) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded font-mono font-bold bg-navy/10 text-navy text-[11px]"
                          >
                            [{score}]
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block mb-1">Purata:</span>
                      <span className="font-mono font-extrabold text-navy text-base">
                        {Number(cand.average_score).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block mb-1">Pengesahan:</span>
                      <span className="font-bold text-xs">
                        {isSelected ? (
                          <span className="text-gold font-bold">☑ DISAHKAN</span>
                        ) : (
                          <span className="text-gray-400">☐ Tiada</span>
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
      </div>

      {/* Dokumen Cetakan Rasmi Urus Setia */}
      <SecretariatPrintDocument
        title="SENARAI PERAKUAN CALON ANUGERAH APRESIASI STAF (PENGURUSAN TPA/TPP)"
        year={activeYear?.year || 2026}
        items={printItems}
        showDirectorApproval={false}
        managementSigner={profile?.full_name || 'WAN NORHASHIMAH BINTI WAN HUSIN'}
      />
    </DashboardLayout>
  );
}
