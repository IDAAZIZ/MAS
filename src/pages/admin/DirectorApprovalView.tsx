import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { useCandidateAggregates, useManagementSelections, useDirectorSelections } from '@/hooks/useSelections';
import type { CandidateAggregate } from '@/lib/types';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DirectorApprovalView() {
  const { activeYear } = useAuth();
  const { data: awards = [] } = useAwards();
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  const { data: candidates = [], isLoading } = useCandidateAggregates(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const { data: mgmtSelections = [] } = useManagementSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const { data: dirSelections = [] } = useDirectorSelections(
    selectedAwardId || undefined,
    activeYear?.id
  );

  const mgmtMap = new Map(mgmtSelections.map((s) => [s.candidate_aggregate_id, s.selected]));
  const dirMap = new Map(dirSelections.map((s) => [s.candidate_aggregate_id, s.selected]));

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
          <p className="text-xs text-gray-500">{row.division}</p>
        </div>
      ),
    },
    {
      key: 'average_score',
      label: 'Markah Purata',
      sortable: true,
      render: (row: CandidateAggregate) => (
        <span className="font-mono font-bold text-navy">
          {Number(row.average_score).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'mgmt_choice',
      label: 'Cadangan TPA/TPP',
      render: (row: CandidateAggregate) => {
        const isMgmt = mgmtMap.get(row.id);
        return isMgmt ? (
          <Badge variant="success">☑ Cadangan</Badge>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'director_choice',
      label: 'Pilihan Pengarah (Muktamad)',
      render: (row: CandidateAggregate) => {
        const isDir = dirMap.get(row.id);
        return isDir ? (
          <div className="flex items-center gap-1.5 text-gold font-bold text-xs bg-gold/10 px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>DIPILIH PENGARAH</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Status Pengesahan Pengarah"
        subtitle="Pantau penetapan pemilihan muktamad oleh Pengarah dan perbandingan terhadap cadangan asal pengurusan."
      />

      <Card className="mb-6">
        <div>
          <label className="label">Tapis Mengikut Kategori Anugerah</label>
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
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={candidates}
          loading={isLoading}
          emptyMessage="Tiada data calon atau keputusan belum dibuat."
        />
      </Card>
    </DashboardLayout>
  );
}
