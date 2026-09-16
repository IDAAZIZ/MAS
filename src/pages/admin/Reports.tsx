import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { FileText, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generatePDF, generateExcel, generateCSV } from '@/utils/reportGenerator';
import toast from 'react-hot-toast';

interface ReportConfig {
  id: number;
  title: string;
  description: string;
  fetchData: (yearId: string) => Promise<{ columns: { key: string; label: string }[]; data: any[] }>;
}

export default function Reports() {
  const { activeYear } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  const reportTypes: ReportConfig[] = [
    {
      id: 1,
      title: 'Laporan Senarai Kategori Anugerah',
      description: 'Laporan senarai penuh 15 kategori anugerah, status keaktifan dan had kuota calon akhir.',
      fetchData: async () => {
        const { data } = await supabase.from('awards').select('*').order('sort_order');
        return {
          columns: [
            { key: 'sort_order', label: 'Susunan' },
            { key: 'name', label: 'Nama Kategori' },
            { key: 'description', label: 'Penerangan' },
            { key: 'max_candidates', label: 'Maks Calon' },
            { key: 'is_active', label: 'Aktif' },
          ],
          data: (data || []).map((d) => ({
            ...d,
            is_active: d.is_active ? 'YA' : 'TIDAK',
          })),
        };
      },
    },
    {
      id: 2,
      title: 'Laporan Senarai Panel Penilai',
      description: 'Laporan direktori semua panel penilai berdaftar beserta maklumat perhubungan dan jawatan.',
      fetchData: async () => {
        const { data } = await supabase.from('evaluators').select('*').order('name');
        return {
          columns: [
            { key: 'name', label: 'Nama Panel' },
            { key: 'email', label: 'E-mel' },
            { key: 'position', label: 'Jawatan' },
            { key: 'phone', label: 'No Telefon' },
            { key: 'is_active', label: 'Status' },
          ],
          data: (data || []).map((d) => ({
            ...d,
            is_active: d.is_active ? 'Aktif' : 'Tidak Aktif',
          })),
        };
      },
    },
    {
      id: 3,
      title: 'Laporan Calon Didaftarkan',
      description: 'Laporan pendaftaran semua calon anugerah mengikut kategori dan bahagian bagi tahun aktif.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('panel_candidates')
          .select('*, award:awards(name)')
          .eq('award_year_id', yearId);
        return {
          columns: [
            { key: 'award_name', label: 'Kategori' },
            { key: 'candidate_name', label: 'Nama Calon' },
            { key: 'staff_number', label: 'No Staf' },
            { key: 'division', label: 'Bahagian' },
            { key: 'position', label: 'Jawatan' },
          ],
          data: (data || []).map((d) => ({
            ...d,
            award_name: d.award?.name || '-',
          })),
        };
      },
    },
    {
      id: 4,
      title: 'Laporan Markah Penilaian Lengkap',
      description: 'Laporan terperinci markah keseluruhan dan status penghantaran penilaian.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('evaluations')
          .select('*, candidate:panel_candidates(candidate_name, division), award:awards(name)')
          .eq('award_year_id', yearId);
        return {
          columns: [
            { key: 'award_name', label: 'Kategori' },
            { key: 'candidate_name', label: 'Calon' },
            { key: 'division', label: 'Bahagian' },
            { key: 'total_score', label: 'Jumlah Markah' },
            { key: 'status', label: 'Status Penilaian' },
          ],
          data: (data || []).map((d) => ({
            award_name: d.award?.name || '-',
            candidate_name: d.candidate?.candidate_name || '-',
            division: d.candidate?.division || '-',
            total_score: d.total_score ?? '-',
            status: d.status === 'submitted' ? 'SELESAI' : 'DRAF',
          })),
        };
      },
    },
    {
      id: 5,
      title: 'Laporan Markah Purata Calon',
      description: 'Laporan gabungan markah purata calon setelah penyelarasan berbilang panel penilai.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('candidate_aggregates')
          .select('*, award:awards(name)')
          .eq('award_year_id', yearId)
          .order('average_score', { ascending: false });
        return {
          columns: [
            { key: 'award_name', label: 'Kategori' },
            { key: 'candidate_name', label: 'Calon' },
            { key: 'division', label: 'Bahagian' },
            { key: 'score_count', label: 'Bilangan Panel' },
            { key: 'average_score', label: 'Markah Purata' },
          ],
          data: (data || []).map((d) => ({
            award_name: d.award?.name || '-',
            candidate_name: d.candidate_name,
            division: d.division,
            score_count: d.score_count,
            average_score: Number(d.average_score).toFixed(2),
          })),
        };
      },
    },
    {
      id: 6,
      title: 'Laporan Cadangan Pengurusan (TPA/TPP)',
      description: 'Laporan senarai calon yang diperakui dan dicadangkan oleh pihak pengurusan TPA/TPP.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('management_selections')
          .select('*, candidate:candidate_aggregates(*), award:awards(name)')
          .eq('award_year_id', yearId)
          .eq('selected', true);
        return {
          columns: [
            { key: 'award_name', label: 'Kategori' },
            { key: 'candidate_name', label: 'Calon Dicadangkan' },
            { key: 'division', label: 'Bahagian' },
            { key: 'avg_score', label: 'Markah Purata' },
          ],
          data: (data || []).map((d) => ({
            award_name: d.award?.name || '-',
            candidate_name: d.candidate?.candidate_name || '-',
            division: d.candidate?.division || '-',
            avg_score: d.candidate ? Number(d.candidate.average_score).toFixed(2) : '-',
          })),
        };
      },
    },
    {
      id: 7,
      title: 'Laporan Pilihan Pengarah',
      description: 'Laporan calon pilihan Pengarah bersama catatan rasmi pertimbangan sebelum pemuktamadan.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('director_selections')
          .select('*, candidate:candidate_aggregates(*), award:awards(name)')
          .eq('award_year_id', yearId)
          .eq('selected', true);
        return {
          columns: [
            { key: 'award_name', label: 'Kategori' },
            { key: 'candidate_name', label: 'Pilihan Pengarah' },
            { key: 'division', label: 'Bahagian' },
            { key: 'avg_score', label: 'Markah Purata' },
            { key: 'note', label: 'Catatan Pengarah' },
          ],
          data: (data || []).map((d) => ({
            award_name: d.award?.name || '-',
            candidate_name: d.candidate?.candidate_name || '-',
            division: d.candidate?.division || '-',
            avg_score: d.candidate ? Number(d.candidate.average_score).toFixed(2) : '-',
            note: d.director_note || 'Tiada Catatan Khusus',
          })),
        };
      },
    },
    {
      id: 8,
      title: 'Laporan Keputusan Akhir & Pemenang',
      description: 'Laporan muktamad senarai rasmi pemenang Anugerah Apresiasi Staf KKBDA.',
      fetchData: async (yearId) => {
        const { data } = await supabase
          .from('final_results')
          .select('*, candidate:candidate_aggregates(*), award:awards(name)')
          .eq('award_year_id', yearId);
        return {
          columns: [
            { key: 'award_name', label: 'Kategori Anugerah' },
            { key: 'winner', label: 'Penerima Anugerah' },
            { key: 'division', label: 'Bahagian' },
            { key: 'avg_score', label: 'Markah Akhir' },
            { key: 'status', label: 'Pengesahan' },
          ],
          data: (data || []).map((d) => ({
            award_name: d.award?.name || '-',
            winner: d.candidate?.candidate_name || '-',
            division: d.candidate?.division || '-',
            avg_score: d.candidate ? Number(d.candidate.average_score).toFixed(2) : '-',
            status: 'DISAHKAN PENGARAH',
          })),
        };
      },
    },
  ];

  const handleExport = async (report: ReportConfig, format: 'pdf' | 'excel' | 'csv') => {
    if (!activeYear) {
      toast.error('Sila pastikan tahun anugerah aktif dipilih.');
      return;
    }
    const key = `${report.id}_${format}`;
    setDownloading(key);
    try {
      const { columns, data } = await report.fetchData(activeYear.id);
      const title = `${report.title} (Tahun ${activeYear.year})`;

      if (format === 'pdf') {
        generatePDF(title, columns, data);
      } else if (format === 'excel') {
        generateExcel(title, columns, data);
      } else if (format === 'csv') {
        generateCSV(columns, data);
      }
      toast.success(`${report.title} berjaya dieksport (${format.toUpperCase()})`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Ralat mengeksport laporan.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Laporan & Statistik Sistem"
        subtitle={`Pusat penjanaan laporan rasmi anugerah bagi Sesi ${activeYear ? `Tahun ${activeYear.year}` : ''}. Eksport data dalam format PDF, Excel, dan CSV.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center text-navy font-bold text-sm">
                  {report.id}
                </div>
                <h4 className="font-bold text-navy text-base">{report.title}</h4>
              </div>
              <p className="text-xs text-gray-500 mb-6 pl-11">{report.description}</p>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 pl-11">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport(report, 'pdf')}
                loading={downloading === `${report.id}_pdf`}
              >
                <Download className="w-3.5 h-3.5 mr-1 text-red-600" />
                PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport(report, 'excel')}
                loading={downloading === `${report.id}_excel`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-green-600" />
                Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport(report, 'csv')}
                loading={downloading === `${report.id}_csv`}
              >
                <FileCode className="w-3.5 h-3.5 mr-1 text-blue-600" />
                CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
