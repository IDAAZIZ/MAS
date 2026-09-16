import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { Plus, Check, Trash2, Calendar } from 'lucide-react';
import { useAwardYears } from '@/hooks/useAwardYears';
import { useAuth } from '@/contexts/AuthContext';
import type { AwardYear } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AwardYearManagement() {
  const { data: years = [], isLoading, create, setActive, remove } = useAwardYears();
  const { setActiveYear } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [deleteTarget, setDeleteTarget] = useState<AwardYear | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear || isNaN(newYear)) {
      toast.error('Sila masukkan tahun yang sah.');
      return;
    }
    await create.mutateAsync(newYear);
    setIsAddOpen(false);
  };

  const handleSetActive = async (year: AwardYear) => {
    await setActive.mutateAsync(year.id);
    setActiveYear(year);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: 'year',
      label: 'Tahun Anugerah',
      sortable: true,
      render: (row: AwardYear) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <span className="font-bold text-gray-800">{row.year}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: AwardYear) => (
        row.is_active ? (
          <Badge variant="success">Tahun Semasa (Aktif)</Badge>
        ) : (
          <Badge variant="neutral">Arkib / Tidak Aktif</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Tindakan',
      className: 'text-right',
      render: (row: AwardYear) => (
        <div className="flex items-center justify-end gap-2">
          {!row.is_active && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSetActive(row)}
              loading={setActive.isPending}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Jadikan Aktif
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Pengurusan Tahun Anugerah"
        subtitle="Tetapkan tahun penganugerahan dan tentukan tahun aktif untuk proses penilaian semasa."
        actions={
          <Button variant="gold" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Tahun
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={years}
          loading={isLoading}
          emptyMessage="Tiada rekod tahun anugerah. Sila tambah tahun pertama."
        />
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Tahun Anugerah Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Tahun</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value))}
              min="2020"
              max="2050"
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: 2026, 2027</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={create.isPending}>
              Simpan Tahun
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Padam Tahun Anugerah"
        message={`Adakah anda pasti mahu memadam tahun anugerah ${deleteTarget?.year}? Semua data berkaitan tahun ini mungkin terkesan.`}
        variant="danger"
        loading={remove.isPending}
      />
    </DashboardLayout>
  );
}
