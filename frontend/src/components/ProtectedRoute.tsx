import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/auth/AuthContext';

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'citizen' | 'admin';
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-6 text-sm text-slate-600">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

