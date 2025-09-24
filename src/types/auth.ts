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
  error: string | null;
  lastOperation: 'login' | 'register' | 'logout' | 'initialize' | null;
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
    canManageWorkflow: true, 
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

// Authentication error types
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'REGISTRATION_FAILED'
  | 'USER_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
}

// Enhanced user interface with additional metadata
export interface UserProfile extends User {
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  lastActivityAt?: string;
  loginCount?: number;
}

// Authentication context methods
export interface AuthMethods {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  getUserPermissions: () => RolePermissions;
  clearError: () => void;
  retry: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Registration data with validation
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  program?: string;
  department?: string;
  studentId?: string;
  employeeId?: string;
  acceptTerms: boolean;
  captchaToken?: string;
}

// Validation result for forms
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Authentication status for debugging
export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasError: boolean;
  lastOperation: string | null;
  sessionAge: number | null;
  retryCount: number;
}
