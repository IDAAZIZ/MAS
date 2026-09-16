import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Award, ListChecks, Users, ClipboardList, CheckCircle,
  FileText, Shield, Trophy, BarChart3, History, Settings, LogOut,
  ChevronDown, ChevronRight, X, Star, ShieldAlert, ArrowLeftRight, CheckCircle2, UserCog,
} from 'lucide-react';
import { ROLE_LABELS, ROLE_DASHBOARDS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface MenuItem {
  label: string;
  path?: string;
  icon: any;
  children?: { label: string; path: string }[];
}

const adminMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Pengurusan Pengguna', path: '/admin/users', icon: UserCog },
  {
    label: 'Pengurusan Anugerah', icon: Award,
    children: [
      { label: 'Tahun Anugerah', path: '/admin/years' },
      { label: 'Kategori', path: '/admin/categories' },
      { label: 'Set Item Penilaian', path: '/admin/item-sets' },
    ],
  },
  {
    label: 'Panel', icon: Users,
    children: [
      { label: 'Senarai Panel', path: '/admin/panels' },
      { label: 'Tugasan Panel', path: '/admin/assignments' },
    ],
  },
  {
    label: 'Penilaian', icon: ClipboardList,
    children: [
      { label: 'Status Penilaian', path: '/admin/evaluation-status' },
    ],
  },
  { label: 'Semakan Pengurusan', path: '/admin/management-review', icon: ListChecks },
  { label: 'Pengesahan Pengarah', path: '/admin/director-approval', icon: Shield },
  { label: 'Keputusan Akhir', path: '/admin/final-results', icon: Trophy },
  { label: 'Laporan', path: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Trail', path: '/admin/audit-trail', icon: History },
  { label: 'Pengurusan Data Ujian', path: '/admin/test-data', icon: ShieldAlert },
  { label: 'Tetapan', path: '/admin/settings', icon: Settings },
];

const panelMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/panel', icon: LayoutDashboard },
];

const managementMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/management', icon: LayoutDashboard },
];

const directorMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/director', icon: LayoutDashboard },
  { label: 'Pengesahan Anugerah', path: '/director/approve', icon: CheckCircle },
];

const menuByRole: Record<string, MenuItem[]> = {
  admin: adminMenu,
  panel: panelMenu,
  management: managementMenu,
  director: directorMenu,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, roles, activeRole, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const currentRole = activeRole || role;
  const menu = menuByRole[currentRole || 'panel'] || [];

  const toggleSubmenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setIsRoleModalOpen(false);
    onClose();
    toast.success(`Peranan aktif ditukar kepada: ${ROLE_LABELS[newRole]}`);
    navigate(ROLE_DASHBOARDS[newRole] || '/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-navy z-50 shadow-sidebar transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="text-gold font-bold text-sm">e-APRESIASI</h1>
                <p className="text-white/50 text-xs">KKBDA</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menu.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className="sidebar-link w-full justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {openMenus[item.label] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {openMenus[item.label] && (
                    <div className="ml-4 pl-4 border-l border-white/10 space-y-0.5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `sidebar-link text-xs ${isActive ? 'sidebar-link-active' : ''}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path!}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Active Role Card & Switcher */}
        {currentRole && (
          <div className="px-3 py-3 mx-3 mb-2 rounded-xl bg-white/5 border border-white/10 text-xs">
            <p className="text-[11px] text-white/50 font-medium">Peranan Aktif:</p>
            <p className="text-white font-bold truncate mt-0.5">{ROLE_LABELS[currentRole] || currentRole}</p>
            {roles && roles.length > 1 && (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Tukar Peranan</span>
              </button>
            )}
          </div>
        )}

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Switch Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Tukar Peranan Sesi Ini"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pilih peranan yang ingin anda gunakan sekarang. Menu dan fungsi papan pemuka akan bertukar secara automatik.
          </p>

          <div className="space-y-2 pt-2">
            {roles &&
              roles.map((r) => {
                const isActive = currentRole === r;
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
