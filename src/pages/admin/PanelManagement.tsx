import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, Mail, Phone, Briefcase, UserCheck } from 'lucide-react';
import { useEvaluators } from '@/hooks/useEvaluators';
import type { Evaluator } from '@/lib/types';
import toast from 'react-hot-toast';

export default function PanelManagement() {
  const { data: evaluators = [], isLoading, create, update, remove } = useEvaluators();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvaluator, setEditingEvaluator] = useState<Evaluator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evaluator | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    phone: '',
    is_active: true,
  });

  const openAddModal = () => {
    setEditingEvaluator(null);
    setFormData({
      name: '',
      email: '',
      position: '',
      phone: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Evaluator) => {
    setEditingEvaluator(item);
    setFormData({
      name: item.name,
      email: item.email,
      position: item.position || '',
      phone: item.phone || '',
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nama dan e-mel panel wajib diisi.');
      return;
    }

    if (editingEvaluator) {
      await update.mutateAsync({
        id: editingEvaluator.id,
        ...formData,
      });
    } else {
      await create.mutateAsync(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleStatus = async (item: Evaluator) => {
    await update.mutateAsync({
      id: item.id,
      is_active: !item.is_active,
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama Panel Penilai',
      sortable: true,
      render: (row: Evaluator) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
            <Mail className="w-3 h-3 text-gold" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Jawatan',
      render: (row: Evaluator) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          <span>{row.position || 'Pegawai Penilai'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'No. Telefon',
      render: (row: Evaluator) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>{row.phone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Evaluator) => (
        <button onClick={() => toggleStatus(row)} className="cursor-pointer">
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
      render: (row: Evaluator) => (
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
        title="Pengurusan Panel Penilai"
        subtitle="Daftar senarai panel penilai, kemas kini profil, dan urus keaktifan akaun penilai kolej."
        actions={
          <Button variant="gold" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Panel
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={evaluators}
          loading={isLoading}
          emptyMessage="Tiada panel penilai didaftarkan. Sila klik butang Tambah Panel."
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvaluator ? 'Sunting Maklumat Panel' : 'Daftar Panel Penilai Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Penuh</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="cth. Ts. Dr. Ahmad Bin Hashim"
              required
            />
          </div>

          <div>
            <label className="label">Alamat E-mel</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="ahmad@kkbda.edu.my"
              required
            />
          </div>

          <div>
            <label className="label">Jawatan / Gred</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="input-field"
              placeholder="cth. Pensyarah DH44 / Ketua Unit"
            />
          </div>

          <div>
            <label className="label">No. Telefon (Pilihan)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              placeholder="012-3456789"
            />
          </div>

          <div>
            <label className="label">Status Keaktifan</label>
            <select
              value={formData.is_active ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              className="input-field"
            >
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={create.isPending || update.isPending}>
              {editingEvaluator ? 'Kemaskini Panel' : 'Daftar Panel'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Padam Panel Penilai"
        message={`Adakah anda pasti mahu memadam profil panel "${deleteTarget?.name}"?`}
        variant="danger"
        loading={remove.isPending}
      />
    </DashboardLayout>
  );
}
