import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import { Play, Pause, RotateCcw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAwards } from '@/hooks/useAwards';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { Award, AwardProcessStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface CategoryStatusRow {
  award: Award;
  assignedPanelsCount: number;
  candidatesCount: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  status: AwardProcessStatus;
}

export default function EvaluationStatus() {
  const { activeYear } = useAuth();
  const { data: awards = [], isLoading: loadingAwards } = useAwards();
  const [rows, setRows] = useState<CategoryStatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryStatuses = async () => {
    if (!activeYear) return;
    setLoading(true);

    if (!isSupabaseConfigured()) {
      const assignments = localDB.getAssignments('', activeYear.id);
      const candidates = localDB.getCandidates('', activeYear.id);
      const calculatedRows: CategoryStatusRow[] = awards.map((award) => {
        const panels = assignments.filter((a) => a.award_id === award.id).length;
        const cands = candidates.filter((c) => c.award_id === award.id).length;
        return {
          award,
          assignedPanelsCount: panels,
          candidatesCount: cands,
          completedEvaluations: cands,
          pendingEvaluations: 0,
          status: 'evaluation_open' as AwardProcessStatus,
        };
      });
      setRows(calculatedRows);
      setLoading(false);
      return;
    }

    try {
      // Assignments
      const { data: assignments } = await supabase
        .from('evaluator_assignments')
        .select('award_id, evaluator_id')
        .eq('award_year_id', activeYear.id);

      // Candidates
      const { data: candidates } = await supabase
        .from('candidate_aggregates')
        .select('award_id, candidate_identifier')
        .eq('award_year_id', activeYear.id);

      // Evaluations
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('award_id, status')
        .eq('award_year_id', activeYear.id);

      // Status
      const { data: awardStatuses } = await supabase
        .from('award_status')
        .select('award_id, status')
        .eq('award_year_id', activeYear.id);

      const statusMap = new Map(awardStatuses?.map((s) => [s.award_id, s.status as AwardProcessStatus]));

      const calculatedRows: CategoryStatusRow[] = awards.map((award) => {
        const panels = assignments?.filter((a) => a.award_id === award.id).length || 0;
        const cands = candidates?.filter((c) => c.award_id === award.id).length || 0;
        const evals = evaluations?.filter((e) => e.award_id === award.id) || [];
        const completed = evals.filter((e) => e.status === 'submitted').length;
        const pending = evals.filter((e) => e.status === 'draft').length;
        const currStatus = statusMap.get(award.id) || 'setup';

        return {
          award,
          assignedPanelsCount: panels,
          candidatesCount: cands,
          completedEvaluations: completed,
          pendingEvaluations: pending,
          status: currStatus,
        };
      });

      setRows(calculatedRows);
    } catch (err) {
      console.error('Error fetching statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryStatuses();
  }, [awards, activeYear]);

  const updateStatus = async (awardId: string, newStatus: AwardProcessStatus, label: string) => {
    if (!activeYear) return;
    const { error } = await supabase.from('award_status').upsert(
      {
        award_id: awardId,
        award_year_id: activeYear.id,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'award_id,award_year_id' }
    );

    if (error) {
      toast.error('Ralat mengemas kini status.');
    } else {
      toast.success(`Status kategori berjaya diubah: ${label}`);
      fetchCategoryStatuses();
    }
  };

  const unlockEvaluations = async (awardId: string) => {
    if (!activeYear) return;
    const { error } = await supabase
      .from('evaluations')
      .update({ status: 'draft' })
      .eq('award_id', awardId)
      .eq('award_year_id', activeYear.id);

    if (error) {
      toast.error('Ralat membuka semula penilaian.');
    } else {
      toast.success('Penilaian dibuka semula untuk semakan/pindaan panel.');
      fetchCategoryStatuses();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Kategori Anugerah',
      render: (row: CategoryStatusRow) => (
        <div>
          <p className="font-bold text-gray-900">{row.award.name}</p>
          <p className="text-xs text-gray-500">{row.assignedPanelsCount} panel penilai</p>
        </div>
      ),
    },
    {
      key: 'candidates',
      label: 'Calon Didaftarkan',
      render: (row: CategoryStatusRow) => (
        <span className="font-mono font-bold text-gray-800">{row.candidatesCount} Calon</span>
      ),
    },
    {
      key: 'progress',
      label: 'Status Penilaian Panel',
      render: (row: CategoryStatusRow) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600 font-semibold">{row.completedEvaluations} Selesai</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600 font-semibold">{row.pendingEvaluations} Draf</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Aliran Kerja',
      render: (row: CategoryStatusRow) => {
        switch (row.status) {
          case 'evaluation_open':
            return <Badge variant="info">Penilaian Dibuka</Badge>;
          case 'evaluation_completed':
            return <Badge variant="success">Penilaian Selesai</Badge>;
          case 'management_review':
            return <Badge variant="warning">Semakan TPA/TPP</Badge>;
          case 'director_approved':
            return <Badge variant="gold">Disahkan Pengarah</Badge>;
          default:
            return <Badge variant="neutral">Persediaan / Terkunci</Badge>;
        }
      },
    },
    {
      key: 'actions',
      label: 'Kawalan Penilaian',
      className: 'text-right',
      render: (row: CategoryStatusRow) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'evaluation_open' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus(row.award.id, 'evaluation_completed', 'Tutup Penilaian')}
            >
              <Pause className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Tutup Penilaian
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateStatus(row.award.id, 'evaluation_open', 'Buka Penilaian')}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Buka Penilaian
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => unlockEvaluations(row.award.id)}
            title="Buka semula markah terkunci jika panel perlukan pembetulan"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Status & Kawalan Penilaian"
        subtitle="Pantau status penyerahan markah oleh panel penilai, buka/tutup tempoh penilaian, dan buka semula penilaian jika perlu."
      />

      <Card>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading || loadingAwards}
          emptyMessage="Tiada data kategori anugerah."
        />
      </Card>
    </DashboardLayout>
  );
}
