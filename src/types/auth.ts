export type UserRole = 'student' | 'faculty' | 'librarian' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  program?: string; // For students and faculty
  department?: string; // For faculty and staff
  studentId?: string; // For students
  employeeId?: string; // For faculty and staff
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Role-based permissions
export interface RolePermissions {
  canUpload: boolean;
  canDownload: boolean;
  canView: boolean;
  canReview: boolean;
  canApprove: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewWorkflow: boolean;
  canManageWorkflow: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageCategories: boolean;
  canBulkImport: boolean;
  canExport: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  student: {
    canUpload: true,
    canDownload: true,
    canView: true,
    canReview: false,
    canApprove: false,
    canEdit: false,
    canDelete: false,
    canViewWorkflow: false, 
    canManageWorkflow: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageCategories: false,
    canBulkImport: false,
    canExport: false,
  },
  faculty: {
    canUpload: true,
    canDownload: true,
    canView: true,
    canReview: true,
    canApprove: true,
    canEdit: true,
    canDelete: false,
    canViewWorkflow: true, 
    canManageWorkflow: false, 
    canManageUsers: false,
    canViewAnalytics: true,
    canManageCategories: false,
    canBulkImport: false,
    canExport: true,
  },
  librarian: {
    canUpload: true,
    canDownload: true,
    canView: true,
    canReview: true,
    canApprove: true,
    canEdit: true,
    canDelete: true,
    canViewWorkflow: true, 
    canManageWorkflow: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageCategories: true,
    canBulkImport: true,
    canExport: true,
  },
  admin: {
    canUpload: true,
    canDownload: true,
    canView: true,
    canReview: true,
    canApprove: true,
    canEdit: true,
    canDelete: true,
    canViewWorkflow: true,
    canManageWorkflow: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageCategories: true,
    canBulkImport: true,
    canExport: true,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty/Adviser',
  librarian: 'Library Staff',
  admin: 'Administrator',
};
