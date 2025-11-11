import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

// Match DEV_MODE setting from ProtectedRoute
const DEV_MODE = false;

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: ('coach' | 'admin' | 'client')[];
  redirectTo?: string;
  message?: string;
}

export const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard',
  message = 'You do not have permission to access this page'
}: RoleBasedRouteProps) => {
  const { role, isLoading } = useUserRole();
  const navigate = useNavigate();

  // Skip role checks in development mode
  if (DEV_MODE) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role as any)) {
      toast.error(message);
      navigate(redirectTo);
    }
  }, [role, isLoading, allowedRoles, navigate, redirectTo, message]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role as any)) {
    return null;
  }

  return <>{children}</>;
};
