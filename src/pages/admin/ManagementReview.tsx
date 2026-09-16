import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { useCandidateAggregates, useManagementSelections } from '@/hooks/useSelections';
import type { CandidateAggregate } from '@/lib/types';
import { CheckCircle2, Circle } from 'lucide-react';
import { DIVISIONS } from '@/lib/constants';

export default function ManagementReview() {
  const { activeYear } = useAuth();
  const { data: awards = [] } = useAwards();
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const { data: candidates = [], isLoading: loadingCandidates } = useCandidateAggregates(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const { data: selections = [] } = useManagementSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const selectionMap = new Map(selections.map((s) => [s.candidate_aggregate_id, s.selected]));

  const filteredCandidates = candidates.filter((c) => {
    if (selectedDivision && c.division !== selectedDivision) return false;
    return true;
  });

  const columns = [
    {
      key: 'award',
      label: 'Kategori Anugerah',
      sortable: true,
      render: (row: CandidateAggregate & { award?: any }) => (
        <span className="font-semibold text-gray-900">{row.award?.name || '-'}</span>
      ),
    },
    {
      key: 'candidate_name',
      label: 'Calon',
      sortable: true,
      render: (row: CandidateAggregate) => (
        <div>
          <p className="font-bold text-gray-900">{row.candidate_name}</p>
          {row.staff_number && <p className="text-xs text-gray-500 font-mono">No. Staf: {row.staff_number}</p>}
        </div>
      ),
    },
    {
      key: 'division',
      label: 'Bahagian',
      render: (row: CandidateAggregate) => (
        <Badge variant="neutral">{row.division}</Badge>
      ),
    },
    {
      key: 'individual_scores',
      label: 'Markah Panel',
      render: (row: CandidateAggregate) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {(row.individual_scores || []).map((score: number, idx: number) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy/10 text-navy border border-navy/20"
            >
              [{score}]
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'average_score',
      label: 'Markah Purata',
      sortable: true,
      render: (row: CandidateAggregate) => (
        <span className="font-mono font-bold text-navy text-base">
          {Number(row.average_score).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'selection',
      label: 'Pilihan TPA/TPP',
      render: (row: CandidateAggregate) => {
        const isSelected = selectionMap.get(row.id);
        return isSelected ? (
          <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>DICADANGKAN</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Circle className="w-4 h-4" />
            <span>—</span>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Semakan Cadangan Pengurusan (TPA/TPP)"
        subtitle="Paparan semakan integriti urusetia bagi meninjau senarai calon anugerah serta calon yang dicadangkan oleh pihak TPA/TPP."
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tapis Mengikut Kategori</label>
            <select
              value={selectedAwardId}
              onChange={(e) => setSelectedAwardId(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Kategori</option>
              {awards.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tapis Mengikut Bahagian</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Bahagian</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredCandidates}
          loading={loadingCandidates}
          emptyMessage="Tiada calon direkodkan atau penilaian belum dihantar oleh panel."
        />
      </Card>
    </DashboardLayout>
  );
}
