import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Edit3, ArrowLeftRight, CheckCircle2, Key, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_DASHBOARDS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { profile, role, roles, activeRole, setActiveRole, activeYear, updateProfileName, changeMyPassword, isTestMode, exitTestMode } = useAuth();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.full_name || '');

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Sila masukkan nama.');
      return;
    }
    updateProfileName(nameInput.trim());
    toast.success('Nama profil berjaya dikemaskini!');
    setIsEditOpen(false);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setIsRoleModalOpen(false);
    toast.success(`Peranan aktif ditukar kepada: ${ROLE_LABELS[newRole]}`);
    navigate(ROLE_DASHBOARDS[newRole] || '/');
  };

  return (
    <>
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 font-medium shadow-inner z-40 relative">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
            <span>
              <strong>MOD UJIAN PANEL AKTIF:</strong> Anda sedang menguji sistem sebagai <strong>{profile?.full_name}</strong>.
            </span>
          </div>
          <button
            onClick={async () => {
              await exitTestMode();
              toast.success('Mod ujian tamat. Kembali ke Urusetia.');
              navigate('/admin');
            }}
            className="bg-navy hover:bg-navy-800 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            Tamat Mod Ujian (Kembali ke Urusetia)
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            {activeYear && (
              <Badge variant="gold">Tahun {activeYear.year}</Badge>
            )}

            {/* Multi-role indicator & switch button */}
            {roles && roles.length > 1 && (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all shadow-sm"
                title="Klik untuk menukar peranan aktif"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                <span>Tukar Peranan</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick role button for mobile multi-role */}
            {roles && roles.length > 1 && (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="md:hidden p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                title="Tukar Peranan"
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-700" />
              </button>
            )}

            {/* Tukar Kata Laluan button */}
            <button
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setIsPasswordModalOpen(true);
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-navy hover:bg-gray-100 transition-colors"
              title="Tukar Kata Laluan Akaun"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setNameInput(profile?.full_name || '');
                setIsEditOpen(true);
              }}
              className="flex items-center gap-3 text-right group p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              title="Klik untuk kemaskini nama anda"
            >
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-navy transition-colors">
                    {profile?.full_name || 'Pengguna'}
                  </p>
                  <Edit3 className="w-3.5 h-3.5 text-gray-400 group-hover:text-gold transition-colors" />
                </div>
                <p className="text-xs text-navy font-semibold">
                  Peranan Aktif: <span className="text-gray-500 font-normal">{role ? ROLE_LABELS[role] : ''}</span>
                </p>
              </div>
              <div className="w-9 h-9 bg-navy/10 rounded-full flex items-center justify-center text-navy font-bold text-sm group-hover:bg-navy group-hover:text-white transition-all">
                {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Tukar Kata Laluan"
        size="sm"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!currentPassword || !newPassword || !confirmPassword) {
              toast.error('Sila lengkapkan semua ruangan kata laluan.');
              return;
            }
            if (newPassword.length < 6) {
              toast.error('Kata laluan baru mestilah sekurang-kurangnya 6 aksara.');
              return;
            }
            if (newPassword !== confirmPassword) {
              toast.error('Kata laluan baru dan pengesahan kata laluan tidak sepadan.');
              return;
            }

            setPasswordLoading(true);
            const res = await changeMyPassword(currentPassword, newPassword);
            setPasswordLoading(false);

            if (res.success) {
              toast.success('Kata laluan berjaya dikemas kini.');
              setIsPasswordModalOpen(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            } else {
              toast.error(res.error || 'Gagal menukar kata laluan.');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Kata Laluan Semasa</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Kata Laluan Baru (Minimum 6 aksara)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Sahkan Kata Laluan Baru</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={passwordLoading}
            >
              Batal
            </Button>
            <Button variant="gold" type="submit" loading={passwordLoading}>
              Simpan Kata Laluan Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Name Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Kemaskini Nama Pengguna"
        size="sm"
      >
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="label">Nama Penuh & Jawatan</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input-field"
              placeholder="cth. Ida Safinar Binti Aziz (UJK)"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Nama ini akan dipaparkan di bahagian atas skrin dan direkodkan pada laporan & jejak audit.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan Nama
            </Button>
          </div>
        </form>
      </Modal>

      {/* Switch Role Modal for Multi-Role Users */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Tukar Peranan Sesi Ini"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sila pilih peranan yang ingin anda aktifkan bagi sesi ini. Papan pemuka, menu dan kebenaran tindakan akan dikemas kini secara automatik tanpa perlu log keluar.
          </p>

          <div className="space-y-2 pt-2">
            {roles &&
              roles.map((r) => {
                const isActive = (activeRole || role) === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSwitchRole(r)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                        : 'border-gray-200 hover:border-navy hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{ROLE_LABELS[r] || r}</span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r === 'panel'
                          ? 'Penilaian kategori & pencalonan'
                          : r === 'management'
                          ? 'Semakan purata & cadangan TPA/TPP'
                          : r === 'admin'
                          ? 'Pentadbiran & pengurusan sistem'
                          : 'Kelulusan rasmi anugerah'}
                      </p>
                    </div>

                    <Button variant={isActive ? 'gold' : 'secondary'} size="sm">
                      {isActive ? 'Sedang Aktif' : 'Pilih'}
                    </Button>
                  </button>
                );
              })}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
