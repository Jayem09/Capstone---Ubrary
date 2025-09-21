import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { RolePermissions } from '../types/auth';

interface PermissionGuardProps {
  children: ReactNode;
  permission: keyof RolePermissions;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
