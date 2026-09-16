import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import SearchBar from '@/components/ui/SearchBar';
import { useAuditLog } from '@/hooks/useSelections';
import { formatDateTime } from '@/utils/formatters';
import { Shield, Clock, User, Activity } from 'lucide-react';
import type { AuditLog } from '@/lib/types';

export default function AuditTrailPage() {
  const { data: logs = [], isLoading } = useAuditLog();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filteredLogs = logs.filter((log: AuditLog) => {
    const matchSearch =
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    const matchRole = roleFilter ? log.user_role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      key: 'created_at',
      label: 'Tarikh & Masa',
      sortable: true,
      render: (row: AuditLog) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-gold" />
          <span>{formatDateTime(row.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'user_name',
      label: 'Pengguna',
      sortable: true,
      render: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-[10px]">
            {row.user_name.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900 text-xs">{row.user_name}</span>
        </div>
      ),
    },
    {
      key: 'user_role',
      label: 'Peranan',
      render: (row: AuditLog) => {
        switch (row.user_role) {
          case 'admin':
            return <Badge variant="info">Urusetia</Badge>;
          case 'panel':
            return <Badge variant="neutral">Panel</Badge>;
          case 'management':
            return <Badge variant="warning">TPA / TPP</Badge>;
          case 'director':
            return <Badge variant="gold">Pengarah</Badge>;
          default:
            return <Badge variant="neutral">{row.user_role}</Badge>;
        }
      },
    },
    {
      key: 'action',
      label: 'Aktiviti Dilakukan',
      render: (row: AuditLog) => (
        <span className="font-bold text-navy text-xs">{row.action}</span>
      ),
    },
    {
      key: 'details',
      label: 'Butiran Tindakan',
      render: (row: AuditLog) => (
        <span className="text-xs text-gray-600 font-mono">{row.details || '-'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Jejak Audit Integriti (Audit Trail)"
        subtitle="Log keselamatan dan rekod kronologi setiap tindakan pengguna (tambah calon, penilaian, semakan, pemilihan & pengesahan)."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cari aktiviti, nama pengguna atau butiran..."
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="">Semua Peranan Pengguna</option>
            <option value="admin">Urusetia / Admin</option>
            <option value="panel">Panel Penilai</option>
            <option value="management">Pengurusan (TPA/TPP)</option>
            <option value="director">Pengarah</option>
          </select>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredLogs}
          loading={isLoading}
          emptyMessage="Tiada rekod log aktiviti ditemui."
        />
      </Card>
    </DashboardLayout>
  );
}
