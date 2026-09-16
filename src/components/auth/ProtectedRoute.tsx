import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DASHBOARDS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, role, roles, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has multiple roles and has not selected an active role yet
  if (roles && roles.length > 1 && !activeRole) {
    return <Navigate to="/select-role" replace />;
  }

  const currentRole = activeRole || role;

  if (currentRole && !allowedRoles.includes(currentRole)) {
    return <Navigate to={ROLE_DASHBOARDS[currentRole] || '/'} replace />;
  }

  return <>{children}</>;
}
