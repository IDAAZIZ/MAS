import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';
import { useAwards } from '@/hooks/useAwards';
import type { Award } from '@/lib/types';
import toast from 'react-hot-toast';

export default function CategoryManagement() {
  const { data: awards = [], isLoading, create, update, remove } = useAwards();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Award | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_candidates: 1,
    is_active: true,
  });

  const openAddModal = () => {
    setEditingAward(null);
    setFormData({
      name: '',
      description: '',
      max_candidates: 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (award: Award) => {
    setEditingAward(award);
    setFormData({
      name: award.name,
      description: award.description || '',
      max_candidates: award.max_candidates || 1,
      is_active: award.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Sila masukkan nama kategori anugerah.');
      return;
    }

    if (editingAward) {
      await update.mutateAsync({
        id: editingAward.id,
        ...formData,
      });
    } else {
      await create.mutateAsync({
        name: formData.name,
        description: formData.description,
        max_candidates: formData.max_candidates,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleStatus = async (award: Award) => {
    await update.mutateAsync({
      id: award.id,
      is_active: !award.is_active,
    });
  };

  const moveOrder = async (award: Award, direction: 'up' | 'down') => {
    const currentIndex = awards.findIndex(a => a.id === award.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= awards.length) return;

    const otherAward = awards[targetIndex];
    await update.mutateAsync({ id: award.id, sort_order: otherAward.sort_order });
    await update.mutateAsync({ id: otherAward.id, sort_order: award.sort_order });
  };

  const columns = [
    {
      key: 'sort_order',
      label: 'Susunan',
      className: 'w-24',
      render: (row: Award) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-gray-500 w-6">#{row.sort_order}</span>
          <div className="flex flex-col">
            <button
              onClick={() => moveOrder(row, 'up')}
              className="p-0.5 hover:text-gold text-gray-400 disabled:opacity-30"
              disabled={awards.indexOf(row) === 0}
            >
              ▲
            </button>
            <button
              onClick={() => moveOrder(row, 'down')}
              className="p-0.5 hover:text-gold text-gray-400 disabled:opacity-30"
              disabled={awards.indexOf(row) === awards.length - 1}
            >
              ▼
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Kategori Anugerah',
      sortable: true,
      render: (row: Award) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          {row.description && <p className="text-xs text-gray-500">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'max_candidates',
      label: 'Maks. Calon Akhir',
      render: (row: Award) => (
        <Badge variant="neutral">{row.max_candidates} Calon</Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Award) => (
        <button
          onClick={() => toggleStatus(row)}
          className="cursor-pointer"
          title="Klik untuk ubah status"
        >
          {row.is_active ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="neutral">Tidak Aktif</Badge>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Tindakan',
      className: 'text-right',
      render: (row: Award) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            <Edit2 className="w-4 h-4 text-gray-600" />
          </Button>
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
        title="Pengurusan Kategori Anugerah"
        subtitle="Daftar, sunting, aktif/nyahaktif serta susun semula kategori anugerah tanpa mengubah kod sumber."
        actions={
          <Button variant="gold" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Kategori
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={awards}
          loading={isLoading}
          emptyMessage="Tiada kategori anugerah didaftarkan."
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAward ? 'Sunting Kategori Anugerah' : 'Tambah Kategori Anugerah Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Kategori</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="cth. Ikon Sukarelawan"
              required
            />
          </div>

          <div>
            <label className="label">Penerangan / Kriteria Ringkas (Pilihan)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-24 resize-none"
              placeholder="Penerangan mengenai kriteria kategori ini..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bilangan Calon Akhir Dibenarkan</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.max_candidates}
                onChange={(e) => setFormData({ ...formData, max_candidates: parseInt(e.target.value) || 1 })}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Default: 1 (Pengarah memilih 1 pemenang)</p>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="input-field"
              >
                <option value="true">Aktif</option>
                <option value="false">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={create.isPending || update.isPending}>
              {editingAward ? 'Kemaskini Kategori' : 'Simpan Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Padam Kategori Anugerah"
        message={`Adakah anda pasti mahu memadam kategori "${deleteTarget?.name}"? Tindakan ini tidak boleh diundur.`}
        variant="danger"
        loading={remove.isPending}
      />
    </DashboardLayout>
  );
}
