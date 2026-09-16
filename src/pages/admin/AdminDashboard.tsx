import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Award, Users, UserCheck, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import type { Award as AwardType } from '@/lib/types';

interface CategoryProgress {
  award: AwardType;
  totalCandidates: number;
  completedEvaluations: number;
  totalEvaluations: number;
  hasManagementSelection: boolean;
  isDirectorApproved: boolean;
}

export default function AdminDashboard() {
  const { activeYear } = useAuth();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalPanels: 0,
    totalCandidates: 0,
    completedPercentage: 0,
    pendingManagement: 0,
    pendingDirector: 0,
  });
  const [categoriesProgress, setCategoriesProgress] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!activeYear) return;
      setLoading(true);

      if (!isSupabaseConfigured()) {
        const awards = localDB.getAwards();
        const panels = localDB.getEvaluators();
        const cands = localDB.getCandidates(undefined, activeYear.id);
        const mgmt = localDB.getManagementSelections(undefined, activeYear.id);
        const dirs = localDB.getDirectorSelections(undefined, activeYear.id);

        const mgmtAwardIds = new Set(mgmt.filter((m) => m.selected).map((m) => m.award_id));
        const dirApprovedIds = new Set(dirs.filter((d) => d.selected).map((d) => d.award_id));

        setStats({
          totalCategories: awards.length,
          totalPanels: panels.length,
          totalCandidates: cands.length,
          completedPercentage: cands.length > 0 ? 100 : 0,
          pendingManagement: Math.max(0, awards.length - mgmtAwardIds.size),
          pendingDirector: Math.max(0, mgmtAwardIds.size - dirApprovedIds.size),
        });

        const progressList: CategoryProgress[] = awards.map((award) => {
          const catCands = cands.filter((c) => c.award_id === award.id);
          return {
            award,
            totalCandidates: catCands.length,
            completedEvaluations: catCands.length,
            totalEvaluations: catCands.length,
            hasManagementSelection: mgmtAwardIds.has(award.id),
            isDirectorApproved: dirApprovedIds.has(award.id),
          };
        });

        setCategoriesProgress(progressList);
        setLoading(false);
        return;
      }

      try {
        // Categories
        const { data: awards } = await supabase
          .from('awards')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        // Panels
        const { count: panelCount } = await supabase
          .from('evaluators')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Candidates for active year
        const { count: candidateCount } = await supabase
          .from('candidate_aggregates')
          .select('*', { count: 'exact', head: true })
          .eq('award_year_id', activeYear.id);

        // Evaluations
        const { data: evaluations } = await supabase
          .from('evaluations')
          .select('status')
          .eq('award_year_id', activeYear.id);

        const totalEvals = evaluations?.length || 0;
        const submittedEvals = evaluations?.filter((e) => e.status === 'submitted').length || 0;
        const evalPercentage = totalEvals > 0 ? Math.round((submittedEvals / totalEvals) * 100) : 0;

        // Management Selections
        const { data: mgmtSelections } = await supabase
          .from('management_selections')
          .select('award_id, selected')
          .eq('award_year_id', activeYear.id)
          .eq('selected', true);

        // Director Approvals
        const { data: dirApprovals } = await supabase
          .from('director_approvals')
          .select('award_id, approved')
          .eq('award_year_id', activeYear.id)
          .eq('approved', true);

        const approvedAwardIds = new Set(dirApprovals?.map((d) => d.award_id) || []);
        const mgmtAwardIds = new Set(mgmtSelections?.map((m) => m.award_id) || []);

        const totalAwards = awards?.length || 0;
        const pendingMgmt = awards?.filter((a) => !mgmtAwardIds.has(a.id)).length || 0;
        const pendingDir = awards?.filter((a) => mgmtAwardIds.has(a.id) && !approvedAwardIds.has(a.id)).length || 0;

        setStats({
          totalCategories: totalAwards,
          totalPanels: panelCount || 0,
          totalCandidates: candidateCount || 0,
          completedPercentage: evalPercentage,
          pendingManagement: pendingMgmt,
          pendingDirector: pendingDir,
        });

        if (awards) {
          const progressList: CategoryProgress[] = awards.map((award) => ({
            award,
            totalCandidates: 0,
            completedEvaluations: submittedEvals,
            totalEvaluations: totalEvals,
            hasManagementSelection: mgmtAwardIds.has(award.id),
            isDirectorApproved: approvedAwardIds.has(award.id),
          }));
          setCategoriesProgress(progressList);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [activeYear]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard Pentadbir"
        subtitle={`Ringkasan Prestasi dan Status Penilaian Anugerah ${activeYear ? `Tahun ${activeYear.year}` : ''}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Jumlah Kategori"
          value={stats.totalCategories}
          icon={Award}
          color="navy"
        />
        <StatCard
          title="Jumlah Panel"
          value={stats.totalPanels}
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Jumlah Calon"
          value={stats.totalCandidates}
          icon={UserCheck}
          color="navy"
        />
        <StatCard
          title="Penilaian Selesai"
          value={`${stats.completedPercentage}%`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Semakan TPA/TPP"
          value={stats.pendingManagement}
          icon={Clock}
          color="purple"
          trend="Menunggu Semakan"
        />
        <StatCard
          title="Pengesahan Pengarah"
          value={stats.pendingDirector}
          icon={ShieldCheck}
          color="orange"
          trend="Menunggu Pengesahan"
        />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy">Kemajuan Penilaian Mengikut Kategori</h3>
              <Link to="/admin/evaluation-status" className="text-sm text-gold hover:underline flex items-center gap-1 font-medium">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {categoriesProgress.slice(0, 8).map(({ award, isDirectorApproved, hasManagementSelection }) => (
                <div key={award.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">{award.name}</p>
                    <p className="text-xs text-gray-500">Maksimum Calon Akhir: {award.max_candidates}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isDirectorApproved ? (
                      <Badge variant="success">Keputusan Disahkan</Badge>
                    ) : hasManagementSelection ? (
                      <Badge variant="warning">Cadangan TPA/TPP Sedia</Badge>
                    ) : (
                      <Badge variant="info">Penilaian Berjalan</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-navy mb-3">Tindakan Pantas</h3>
              <p className="text-sm text-gray-500 mb-6">
                Urus konfigurasi penganugerahan, tetapan panel penilai, serta pantau keseluruhan proses penilaian.
              </p>

              <div className="space-y-2">
                <Link
                  to="/admin/assignments"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition-all text-sm font-medium text-navy"
                >
                  <span>Tetapkan Panel Penilai</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
                <Link
                  to="/admin/management-review"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition-all text-sm font-medium text-navy"
                >
                  <span>Semak Cadangan TPA/TPP</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
                <Link
                  to="/admin/final-results"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition-all text-sm font-medium text-navy"
                >
                  <span>Keputusan Rasmi Akhir</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
                <Link
                  to="/admin/reports"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition-all text-sm font-medium text-navy"
                >
                  <span>Eksport Laporan & Statistik</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>
            </div>

            <div className="mt-6 p-4 bg-navy-50 rounded-xl">
              <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-1">Status Sistem</p>
              <p className="text-xs text-navy/70">
                Sistem beroperasi sepenuhnya mengikut piawaian integriti & audit trail KKBDA.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
