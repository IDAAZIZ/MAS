import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CheckSquare,
  Square,
  Printer,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import {
  useCandidateAggregates,
  useManagementSelections,
  useDirectorSelections
} from '@/hooks/useSelections';
import { DIVISIONS } from '@/lib/constants';
import type { CandidateAggregate } from '@/lib/types';
import SecretariatPrintDocument, { type SecretariatPrintItem } from '@/components/report/SecretariatPrintDocument';
import toast from 'react-hot-toast';

export default function DirectorDashboard() {
  const { activeYear, profile } = useAuth();
  const { data: awards = [] } = useAwards();

  // Filters state
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, approved, unapproved, mgmt
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Candidates
  const { data: candidates = [], isLoading } = useCandidateAggregates(
    selectedAwardId || undefined,
    activeYear?.id
  );

  // Management Selections (TPA/TPP)
  const { data: mgmtSelections = [] } = useManagementSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );
  const mgmtMap = useMemo(() => {
    return new Map(mgmtSelections.map((s) => [s.candidate_aggregate_id, s.selected]));
  }, [mgmtSelections]);

  // Director Selections (Kuasa Muktamad Pengarah)
  const { data: dirSelections = [], toggle } = useDirectorSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );
  const dirMap = useMemo(() => {
    return new Map(dirSelections.map((s) => [s.candidate_aggregate_id, s.selected]));
  }, [dirSelections]);

  // Handle Director Toggle Selection with Quota
  const handleToggleDirectorApproval = async (candidate: CandidateAggregate & { award?: any }) => {
    if (!activeYear) return;

    const isCurrentlyApproved = !!dirMap.get(candidate.id);
    const willBeApproved = !isCurrentlyApproved;

    if (willBeApproved) {
      const isPdp = candidate.award?.name.toLowerCase().includes('pdp');
      if (isPdp) {
        // Bagi Pengurusan PdP Terbaik, benarkan 1 calon bagi setiap bahagian
        const existingApprovedInDivision = candidates.find(
          (c) =>
            c.award_id === candidate.award_id &&
            c.division === candidate.division &&
            c.id !== candidate.id &&
            dirMap.get(c.id)
        );
        if (existingApprovedInDivision) {
          // Gantikan calon bagi bahagian ini
          await toggle.mutateAsync({
            candidateAggregateId: existingApprovedInDivision.id,
            awardId: candidate.award_id,
            yearId: activeYear.id,
            selected: false,
          });
          toast.success(`Kelulusan bahagian ${candidate.division} dikemas kini kepada ${candidate.candidate_name}.`);
        }
      } else {
        const awardLimit = candidate.award?.max_candidates || 1;
        const currentApprovedInCategory = candidates.filter(
          (c) => c.award_id === candidate.award_id && c.id !== candidate.id && dirMap.get(c.id)
        );

        if (awardLimit === 1 && currentApprovedInCategory.length > 0) {
          // Jika kuota 1, gantikan calon sebelumnya secara automatik
          const prevCand = currentApprovedInCategory[0];
          await toggle.mutateAsync({
            candidateAggregateId: prevCand.id,
            awardId: candidate.award_id,
            yearId: activeYear.id,
            selected: false,
          });
          toast.success(`Kelulusan anugerah "${candidate.award?.name}" dikemas kini kepada ${candidate.candidate_name}.`);
        } else if (currentApprovedInCategory.length >= awardLimit) {
          toast.error(`Kategori "${candidate.award?.name || 'ini'}" hanya membenarkan maksimum ${awardLimit} calon akhir diluluskan.`);
          return;
        }
      }
    }

    await toggle.mutateAsync({
      candidateAggregateId: candidate.id,
      awardId: candidate.award_id,
      yearId: activeYear.id,
      selected: willBeApproved,
    });
  };

  // Filtered candidates list
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
        const isApproved = !!dirMap.get(c.id);
        const isMgmt = !!mgmtMap.get(c.id);

        if (selectedStatus === 'approved' && !isApproved) return false;
        if (selectedStatus === 'unapproved' && isApproved) return false;
        if (selectedStatus === 'mgmt' && !isMgmt) return false;

        return true;
      })
      .sort((a, b) => Number(b.average_score) - Number(a.average_score));
  }, [candidates, selectedAwardId, selectedDivision, selectedStatus, searchQuery, dirMap, mgmtMap]);

  // Statistik untuk kad ringkasan Pengarah
  const totalApprovedCount = useMemo(() => {
    return candidates.filter((c) => dirMap.get(c.id)).length;
  }, [candidates, dirMap]);

  const totalMgmtVerifiedCount = useMemo(() => {
    return candidates.filter((c) => mgmtMap.get(c.id)).length;
  }, [candidates, mgmtMap]);

  // Data cetakan rasmi Urus Setia
  const printItems: SecretariatPrintItem[] = useMemo(() => {
    return filteredCandidates.map((c) => ({
      id: c.id,
      candidate_name: c.candidate_name,
      staff_number: c.staff_number,
      division: c.division,
      average_score: c.average_score,
      category_name: c.award?.name || 'Kategori Anugerah',
      is_mgmt_approved: !!mgmtMap.get(c.id),
      is_director_approved: !!dirMap.get(c.id),
    }));
  }, [filteredCandidates, mgmtMap, dirMap]);

  return (
    <DashboardLayout>
      <div className="screen-only">
        <PageHeader
          title="Semakan & Kelulusan Anugerah (Pengarah)"
          subtitle={`Selamat datang, ${profile?.full_name || 'Tuan Pengarah'}. Kuasa pemuktamadan anugerah bagi Sesi Tahun ${activeYear?.year || '-'}.`}
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

        {/* Ringkasan Eksekutif Pengarah */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="JUMLAH KATEGORI"
            value={awards.length}
            icon={Award}
            color="navy"
          />
          <StatCard
            title="DISAHKAN PENGURUSAN (TPA/TPP)"
            value={totalMgmtVerifiedCount}
            icon={Clock}
            color="orange"
            trend="Perakuan Pengurusan"
          />
          <StatCard
            title="TELAH DILULUSKAN PENGARAH"
            value={totalApprovedCount}
            icon={CheckCircle2}
            color="green"
            trend="Keputusan Muktamad"
          />
        </div>

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
              <label className="label">STATUS KELULUSAN</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">Semua Calon</option>
                <option value="approved">Diluluskan Pengarah (☑)</option>
                <option value="unapproved">Belum Diluluskan (☐)</option>
                <option value="mgmt">Disahkan Pengurusan Sahaja</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Info Alert regarding Director Executive Role */}
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              👑 <strong>Kuasa Muktamad Pengarah:</strong> Sila tandakan calon yang diluluskan bagi setiap kategori anugerah. Pilihan anda direkodkan secara langsung (Auto Save) dan boleh dicetak terus untuk tindakan Urus Setia.
            </span>
          </span>
          <Badge variant="success">Auto Save Aktif</Badge>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-400">Memuatkan senarai calon anugerah...</div>
        ) : filteredCandidates.length === 0 ? (
          <Card className="text-center py-16 text-gray-400">
            <p>Tiada calon ditemui mengikut tapisan yang dipilih.</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View - STRICT 7-COLUMN ORDER:
                1. KATEGORI | 2. CALON | 3. BAHAGIAN | 4. MARKAH | 5. MARKAH PURATA | 6. PENGESAHAN | 7. KELULUSAN PENGARAH
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
                      <th className="px-5 py-4 text-center bg-emerald-50/70 text-emerald-900 border-l border-emerald-100">
                        7. KELULUSAN PENGARAH
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCandidates.map((cand) => {
                      const isMgmt = !!mgmtMap.get(cand.id);
                      const isApproved = !!dirMap.get(cand.id);

                      return (
                        <tr
                          key={cand.id}
                          className={`transition-colors ${
                            isApproved
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                              : isMgmt
                              ? 'bg-gold-50/20 hover:bg-gold-50/40'
                              : 'hover:bg-gray-50/50'
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

                          {/* 5. MARKAH PURATA */}
                          <td className="px-5 py-4 text-center">
                            <span className="font-mono font-bold text-navy text-base">
                              {Number(cand.average_score).toFixed(2)}
                            </span>
                          </td>

                          {/* 6. PENGESAHAN (TPA/TPP) */}
                          <td className="px-5 py-4 text-center">
                            {isMgmt ? (
                              <Badge variant="success" className="font-bold gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                DISAHKAN
                              </Badge>
                            ) : (
                              <span className="text-gray-300 font-medium">—</span>
                            )}
                          </td>

                          {/* 7. KELULUSAN PENGARAH (Tik Button) */}
                          <td className="px-5 py-4 text-center bg-emerald-50/30 border-l border-emerald-100">
                            <button
                              type="button"
                              onClick={() => handleToggleDirectorApproval(cand)}
                              className="inline-flex items-center justify-center gap-1.5 p-1.5 rounded-lg hover:bg-emerald-100/50 transition-transform active:scale-95"
                              title={isApproved ? "Batal kelulusan" : "Tandakan untuk kelulusan"}
                            >
                              {isApproved ? (
                                <div className="flex items-center gap-1 text-emerald-700 font-extrabold">
                                  <CheckSquare className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                                  <span className="text-xs tracking-wider">LULUS</span>
                                </div>
                              ) : (
                                <Square className="w-6 h-6 text-gray-300 hover:text-emerald-500" />
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredCandidates.map((cand) => {
                const isMgmt = !!mgmtMap.get(cand.id);
                const isApproved = !!dirMap.get(cand.id);

                return (
                  <Card
                    key={cand.id}
                    className={`p-5 border-2 transition-all ${
                      isApproved
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-md'
                        : isMgmt
                        ? 'border-gold bg-gold-50/15'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-gold uppercase tracking-wider">
                        {cand.award?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDirectorApproval(cand)}
                        className="p-1"
                        title={isApproved ? "Batal kelulusan" : "Tandakan untuk kelulusan"}
                      >
                        {isApproved ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckSquare className="w-6 h-6 text-emerald-600" />
                            <span className="text-xs">LULUS</span>
                          </div>
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

                      <div className="text-center">
                        <span className="text-gray-400 block mb-1">Purata:</span>
                        <span className="font-mono font-extrabold text-navy text-base">
                          {Number(cand.average_score).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-gray-400 block mb-1">Pengesahan:</span>
                        <span className="font-bold text-xs">
                          {isMgmt ? (
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
        title="SENARAI PERAKUAN & KELULUSAN RASMI ANUGERAH APRESIASI STAF KKBDA"
        year={activeYear?.year || 2026}
        items={printItems}
        showDirectorApproval={true}
        managementSigner="WAN NORHASHIMAH BINTI WAN HUSIN"
        directorSigner={profile?.full_name || 'PENGARAH KOLEJ KOMUNITI BANDAR DARULAMAN'}
      />
    </DashboardLayout>
  );
}
