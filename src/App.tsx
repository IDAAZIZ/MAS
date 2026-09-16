import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ToastConfig from '@/components/ui/ToastConfig';

// Public & Auth Pages
import LandingPage from '@/pages/landing/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import ActivateAccountPage from '@/pages/auth/ActivateAccountPage';
import SelectRolePage from '@/pages/auth/SelectRolePage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import AwardYearManagement from '@/pages/admin/AwardYearManagement';
import CategoryManagement from '@/pages/admin/CategoryManagement';
import ItemSetBuilder from '@/pages/admin/ItemSetBuilder';
import ItemSetDetail from '@/pages/admin/ItemSetDetail';
import PanelManagement from '@/pages/admin/PanelManagement';
import PanelAssignment from '@/pages/admin/PanelAssignment';
import EvaluationStatus from '@/pages/admin/EvaluationStatus';
import ManagementReview from '@/pages/admin/ManagementReview';
import DirectorApprovalView from '@/pages/admin/DirectorApprovalView';
import FinalResults from '@/pages/admin/FinalResults';
import Reports from '@/pages/admin/Reports';
import AuditTrailPage from '@/pages/admin/AuditTrailPage';
import TestDataManagement from '@/pages/admin/TestDataManagement';
import Settings from '@/pages/admin/Settings';

// Panel Pages
import PanelDashboard from '@/pages/panel/PanelDashboard';
import CandidateList from '@/pages/panel/CandidateList';
import AddCandidate from '@/pages/panel/AddCandidate';
import ScoringForm from '@/pages/panel/ScoringForm';

// Management Pages (TPA / TPP)
import ManagementDashboard from '@/pages/management/ManagementDashboard';

// Director Pages
import DirectorDashboard from '@/pages/director/DirectorDashboard';
import DirectorApprovalPage from '@/pages/director/DirectorApprovalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <ToastConfig />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/activate-account" element={<ActivateAccountPage />} />
            <Route path="/select-role" element={<SelectRolePage />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/years"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AwardYearManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CategoryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/item-sets"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ItemSetBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/item-sets/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ItemSetDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/panels"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PanelManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PanelAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/evaluation-status"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EvaluationStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/management-review"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManagementReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/director-approval"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DirectorApprovalView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/final-results"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FinalResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-trail"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditTrailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/test-data"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TestDataManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Panel Routes */}
            <Route
              path="/panel"
              element={
                <ProtectedRoute allowedRoles={['panel']}>
                  <PanelDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panel/dashboard"
              element={
                <ProtectedRoute allowedRoles={['panel']}>
                  <PanelDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panel/award/:awardId"
              element={
                <ProtectedRoute allowedRoles={['panel']}>
                  <CandidateList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panel/award/:awardId/add"
              element={
                <ProtectedRoute allowedRoles={['panel']}>
                  <AddCandidate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panel/award/:awardId/score/:candidateId"
              element={
                <ProtectedRoute allowedRoles={['panel']}>
                  <ScoringForm />
                </ProtectedRoute>
              }
            />

            {/* Management (TPA/TPP) Routes */}
            <Route
              path="/management"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/dashboard"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementDashboard />
                </ProtectedRoute>
              }
            />

            {/* Director Routes */}
            <Route
              path="/director"
              element={
                <ProtectedRoute allowedRoles={['director']}>
                  <DirectorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director/dashboard"
              element={
                <ProtectedRoute allowedRoles={['director']}>
                  <DirectorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director/approve"
              element={
                <ProtectedRoute allowedRoles={['director']}>
                  <DirectorApprovalPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
