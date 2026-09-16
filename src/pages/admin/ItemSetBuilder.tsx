import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { Plus, Edit3, Trash2, ListChecks, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useItemSets } from '@/hooks/useItemSets';
import { useAwards } from '@/hooks/useAwards';
import type { AwardItemSet } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ItemSetBuilder() {
  const navigate = useNavigate();
  const { data: itemSets = [], isLoading, create, update, remove } = useItemSets();
  const { data: awards = [] } = useAwards();

  const [modalOpen, setModalOpen] = useState(false);
  const [setName, setSetName] = useState('');
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AwardItemSet | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setName.trim()) {
      toast.error('Sila masukkan nama set item.');
      return;
    }
    const created = await create.mutateAsync(setName);
    if (selectedAwardId && created?.id) {
      await update.mutateAsync({
        id: created.id,
        award_id: selectedAwardId,
      });
    }
    setModalOpen(false);
    setSetName('');
    setSelectedAwardId('');
    if (created?.id) {
      navigate(`/admin/item-sets/${created.id}`);
    }
  };

  const handleAssignAward = async (setId: string, awardId: string | null) => {
    await update.mutateAsync({
      id: setId,
      award_id: awardId || null,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama Set Template',
      sortable: true,
      render: (row: AwardItemSet) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.award_items?.length || 0} item penilaian</p>
        </div>
      ),
    },
    {
      key: 'award_id',
      label: 'Kategori Ditugaskan',
      render: (row: AwardItemSet) => (
        <select
          value={row.award_id || ''}
          onChange={(e) => handleAssignAward(row.id, e.target.value || null)}
          className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-navy"
        >
          <option value="">-- Tiada Kategori Ditugaskan --</option>
          {awards.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'score_status',
      label: 'Status Pemarkahan',
      render: (row: AwardItemSet) => {
        const totalMax = row.award_items?.reduce((sum, i) => sum + i.max_score, 0) || 0;
        const isComplete = totalMax === 100;
        return isComplete ? (
          <div className="flex items-center gap-1.5 text-green-700 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>LENGKAP ({totalMax}/100)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>BELUM LENGKAP ({totalMax}/100)</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Tindakan',
      className: 'text-right',
      render: (row: AwardItemSet) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/admin/item-sets/${row.id}`)}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Bina & Sunting Item
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
        title="Set Item Penilaian"
        subtitle="Cipta template kriteria penilaian dan tetapkan rubrik pemarkahan bagi setiap kategori anugerah."
        actions={
          <Button variant="gold" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Cipta Set Baru
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={itemSets}
          loading={isLoading}
          emptyMessage="Tiada set item penilaian. Sila cipta template set pertama anda."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cipta Set Item Penilaian Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nama Template Set</label>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="input-field"
              placeholder="cth. Template Penilaian Ikon Sukarelawan"
              required
            />
          </div>

          <div>
            <label className="label">Gunakan Untuk Kategori (Pilihan)</label>
            <select
              value={selectedAwardId}
              onChange={(e) => setSelectedAwardId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Tetapkan Kemudian --</option>
              {awards.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={create.isPending}>
              Teruskan ke Pembina Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Padam Set Item Penilaian"
        message={`Adakah anda pasti mahu memadam template "${deleteTarget?.name}"? Semua rubrik item di bawah set ini akan dipadam.`}
        variant="danger"
        loading={remove.isPending}
      />
    </DashboardLayout>
  );
}
