import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, ArrowLeft, Trash2, Edit2, CheckCircle2, AlertTriangle, GripVertical } from 'lucide-react';
import { useItemSets, useAwardItems } from '@/hooks/useItemSets';
import type { AwardItem } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ItemSetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: itemSets = [] } = useItemSets();
  const currentSet = itemSets.find((s) => s.id === id);

  const { data: items = [], isLoading, create, update, remove, reorder } = useAwardItems(id || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AwardItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AwardItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_score: 10,
  });

  const totalScore = items.reduce((sum, item) => sum + (item.max_score || 0), 0);
  const isComplete = totalScore === 100;

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', max_score: 10 });
    setModalOpen(true);
  };

  const openEditModal = (item: AwardItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      max_score: item.max_score,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Sila masukkan nama item.');
      return;
    }
    if (formData.max_score <= 0) {
      toast.error('Markah maksimum mestilah lebih daripada 0.');
      return;
    }

    if (editingItem) {
      await update.mutateAsync({
        id: editingItem.id,
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

  const moveOrder = async (item: AwardItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    await reorder.mutateAsync([
      { id: item.id, sort_order: targetItem.sort_order },
      { id: targetItem.id, sort_order: item.sort_order },
    ]);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={currentSet?.name || 'Pembina Item Penilaian'}
        subtitle="Rangka kriteria, rubrik penilaian, dan tetapkan markah maksimum bagi setiap komponen penilaian."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/admin/item-sets')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Senarai Set
            </Button>
            <Button variant="gold" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Item
            </Button>
          </div>
        }
      />

      {/* Score Summary & Validation Warning */}
      <div className="mb-6">
        <Card className={`border-2 ${isComplete ? 'border-green-500 bg-green-50/20' : 'border-amber-500 bg-amber-50/20'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  Jumlah Markah Keseluruhan: <span className={isComplete ? 'text-green-600' : 'text-amber-600'}>{totalScore} / 100</span>
                </h4>
                <p className="text-xs text-gray-600">
                  {isComplete
                    ? 'Status: LENGKAP. Set item ini sedia digunakan untuk pemarkahan rasmi.'
                    : 'Peringatan: Jumlah markah belum lengkap. Sila pastikan jumlah markah mencukupi tepat 100 markah.'}
                </p>
              </div>
            </div>

            <Badge variant={isComplete ? 'success' : 'warning'} className="text-sm px-4 py-1.5 font-bold">
              {isComplete ? 'LENGKAP (100%)' : 'BELUM LENGKAP'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h3 className="font-bold text-navy">Senarai Item Penilaian ({items.length})</h3>
          <p className="text-xs text-gray-500">Gunakan panah untuk mengubah susunan item pemarkahan</p>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p>Tiada item dalam template ini. Sila klik "Tambah Item" untuk memulakan pembinaan rubrik.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={item.id} className="py-4 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center mt-1">
                    <button
                      onClick={() => moveOrder(item, 'up')}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gold disabled:opacity-20 p-0.5"
                    >
                      ▲
                    </button>
                    <span className="font-mono text-xs font-bold text-navy">#{idx + 1}</span>
                    <button
                      onClick={() => moveOrder(item, 'down')}
                      disabled={idx === items.length - 1}
                      className="text-gray-400 hover:text-gold disabled:opacity-20 p-0.5"
                    >
                      ▼
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-gray-900 text-sm">{item.name}</h5>
                      {item.rubric_levels && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/10 text-navy">
                          Rubrik 5-Tahap
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                    {item.rubric_levels && (
                      <div className="mt-2 text-[11px] text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 space-y-1">
                        <div><strong className="text-navy">5 – Cemerlang:</strong> {item.rubric_levels.level_5}</div>
                        <div><strong className="text-navy">4 – Sangat Baik:</strong> {item.rubric_levels.level_4}</div>
                        <div><strong className="text-navy">3 – Baik:</strong> {item.rubric_levels.level_3}</div>
                        <div><strong className="text-navy">2 – Memuaskan:</strong> {item.rubric_levels.level_2}</div>
                        <div><strong className="text-navy">1 – Perlu Penambahbaikan:</strong> {item.rubric_levels.level_1}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase font-semibold">Markah Maks</span>
                    <p className="font-mono font-bold text-navy text-base">{item.max_score} Markah</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sunting Item Penilaian' : 'Tambah Item Penilaian Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Item Penilaian</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="cth. Penglibatan Sukarelawan"
              required
            />
          </div>

          <div>
            <label className="label">Penerangan / Rubrik Penilaian (Pilihan)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-24 resize-none"
              placeholder="Huraikan kriteria pemarkahan..."
            />
          </div>

          <div>
            <label className="label">Markah Maksimum</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
              className="input-field font-mono font-bold"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Baki markah untuk cukup 100: <span className="font-bold text-navy">{Math.max(0, 100 - (totalScore - (editingItem ? editingItem.max_score : 0)))}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={create.isPending || update.isPending}>
              {editingItem ? 'Kemaskini Item' : 'Simpan Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Padam Item Penilaian"
        message={`Adakah anda pasti mahu memadam item "${deleteTarget?.name}"?`}
        variant="danger"
        loading={remove.isPending}
      />
    </DashboardLayout>
  );
}
