
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, UserRole, RolePermissions, User } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  getUserPermissions: () => RolePermissions;
  clearError: () => void;
  retry: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  program?: string;
  department?: string;
  studentId?: string;
  employeeId?: string;
}

// Enhanced auth state with error handling
interface EnhancedAuthState extends AuthState {
  error: string | null;
  lastOperation: 'login' | 'register' | 'logout' | 'initialize' | null;
}





const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility function to create timeout promises
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

// Utility function to load user profile
const loadUserProfile = async (user: any): Promise<User> => {
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbUser && !dbError) {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      role: dbUser.role,
      program: dbUser.program,
      department: dbUser.department,
      studentId: dbUser.student_id,
      employeeId: dbUser.employee_id,
      avatar: `${dbUser.first_name?.[0] || 'U'}${dbUser.last_name?.[0] || ''}`,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      lastLoginAt: dbUser.last_login_at,
    };
  }

  // Fallback to session metadata
  return {
    id: user.id,
    email: user.email || '',
    firstName: user.user_metadata?.first_name || 'User',
    lastName: user.user_metadata?.last_name || '',
    role: (user.user_metadata?.role as UserRole) || 'student',
    program: user.user_metadata?.program,
    department: user.user_metadata?.department,
    studentId: user.user_metadata?.student_id,
    employeeId: user.user_metadata?.employee_id,
    avatar: `${user.user_metadata?.first_name?.[0] || 'U'}${user.user_metadata?.last_name?.[0] || ''}`,
    isActive: true,
    createdAt: user.created_at || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<EnhancedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastOperation: null,
  });

  const setLoadingState = useCallback((isLoading: boolean, operation: 'login' | 'register' | 'logout' | 'initialize' | null = null) => {
    setAuthState(prev => ({
      ...prev,
      isLoading,
      lastOperation: operation,
      // Only clear error when starting a new operation (isLoading = true)
      // Don't clear error when finishing an operation (isLoading = false)
      error: isLoading ? null : prev.error,
    }));
  }, []);

  const setErrorState = useCallback((error: string | null, operation: 'login' | 'register' | 'logout' | 'initialize' | null = null) => {
    setAuthState(prev => ({
      ...prev,
      error,
      isLoading: false,
      lastOperation: operation,
    }));
  }, []);

  const setSuccessState = useCallback((user: User) => {
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      lastOperation: null,
    });
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastOperation: null,
    });
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for auth state changes - SIMPLIFIED VERSION
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Create basic user object without database queries
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || 'User',
          lastName: session.user.user_metadata?.last_name || '',
          role: (session.user.user_metadata?.role as UserRole) || 'student',
          program: session.user.user_metadata?.program,
          department: session.user.user_metadata?.department,
          studentId: session.user.user_metadata?.student_id,
          employeeId: session.user.user_metadata?.employee_id,
          avatar: `${session.user.user_metadata?.first_name?.[0] || 'U'}${session.user.user_metadata?.last_name?.[0] || ''}`,
          isActive: true,
          createdAt: session.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setSuccessState(basicUser);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastOperation: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [setSuccessState]);





  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    setLoadingState(true, 'login');

    try {
      // Use Supabase authentication
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        10000, // 10 second timeout
        'Login timeout - please check your connection'
      );

      if (error) {
        // Show specific error message for invalid credentials
        let userFriendlyMessage = 'Login failed';
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid') || 
            error.message.includes('credentials')) {
          userFriendlyMessage = 'Invalid credentials - Please check your email and password';
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = 'Login timeout - please check your connection';
        } else {
          userFriendlyMessage = `Login failed - ${error.message || 'An error occurred during login'}`;
        }
        setErrorState(userFriendlyMessage, 'login');
        throw new Error(userFriendlyMessage);
      }

      if (!data.user) {
        const errorMessage = 'Authentication failed';
        setErrorState(errorMessage, 'login');
        throw new Error(errorMessage);
      }

      // Clear any previous errors on successful login
      setErrorState(null, 'login');

    } catch (error: unknown) {
      // Only set error state if it's not already set above
      if (!authState.error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setErrorState(errorMessage, 'login');
      }
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName || !userData.role) {
      throw new Error('All required fields must be filled');
    }

    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    setLoadingState(true, 'register');

    try {
      // Use Supabase registration
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: userData.email.trim(),
          password: userData.password,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: userData.role,
              program: userData.program,
              department: userData.department,
              student_id: userData.studentId,
              employee_id: userData.employeeId,
            }
          }
        }),
        15000, // 15 second timeout for registration
        'Registration timeout - please check your connection'
      );

      if (authError) {
        // Show specific error messages for registration
        let userFriendlyMessage = 'Registration failed';
        if (authError.message.includes('already registered') || 
            authError.message.includes('already exists')) {
          userFriendlyMessage = 'Account already exists - An account with this email already exists. Please try logging in instead.';
        } else if (authError.message.includes('password')) {
          userFriendlyMessage = 'Password requirements not met';
        } else if (authError.message.includes('timeout')) {
          userFriendlyMessage = 'Registration timeout - please check your connection';
        } else {
          userFriendlyMessage = `Registration failed - ${authError.message || 'An error occurred during registration'}`;
        }
        setErrorState(userFriendlyMessage, 'register');
        throw new Error(userFriendlyMessage);
      }

      if (!authData.user) {
        const errorMessage = 'Registration failed - no user returned';
        setErrorState(errorMessage, 'register');
        throw new Error(errorMessage);
      }

      // Clear any previous errors on successful registration
      setErrorState(null, 'register');

      // Skip profile verification and database operations for now
      // User profile will be created automatically by auth state change listener

    } catch (error: unknown) {
      // Only set error state if it's not already set above
      if (!authState.error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setErrorState(errorMessage, 'register');
      }
      throw error;
    }
  };

  const logout = async () => {
    setLoadingState(true, 'logout');

    try {
      // Use Supabase logout
      await withTimeout(
        supabase.auth.signOut(),
        10000,
        'Logout timeout'
      );

      // Clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastOperation: null,
      });

      localStorage.removeItem('ubrary_user');

    } catch (error: unknown) {
      // Still clear local state even if logout fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastOperation: null,
      });
      localStorage.removeItem('ubrary_user');
    }
  };

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const retry = useCallback(async () => {
    const lastOp = authState.lastOperation;
    if (!lastOp) return;

    if (lastOp === 'initialize') {
      await initializeAuth();
    } else if (lastOp === 'login') {
      setErrorState('Please try logging in again', 'login');
    } else if (lastOp === 'register') {
      setErrorState('Please try registering again', 'register');
    }
  }, [authState.lastOperation, initializeAuth, setErrorState]);

  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!authState.user) return false;
    return ROLE_PERMISSIONS[authState.user.role][permission];
  }, [authState.user]);

  const getUserPermissions = useCallback((): RolePermissions => {
    if (!authState.user) {
      return ROLE_PERMISSIONS.student; // Default to most restrictive
    }
    return ROLE_PERMISSIONS[authState.user.role];
  }, [authState.user]);

  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;

    setLoadingState(true, 'initialize');

    try {
      const userProfile = await loadUserProfile(authState.user);
      setSuccessState(userProfile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
      setErrorState(errorMessage, 'initialize');
    }
  }, [authState.user, setLoadingState, setSuccessState, setErrorState]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    hasPermission,
    getUserPermissions,
    clearError,
    retry,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe fallback instead of throwing
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastOperation: null,
      login: async () => { throw new Error('useAuth must be used within AuthProvider'); },
      logout: async () => {},
      register: async () => { throw new Error('useAuth must be used within AuthProvider'); },
      hasPermission: () => false,
      getUserPermissions: () => ROLE_PERMISSIONS.student,
      clearError: () => {},
      retry: async () => {},
      refreshProfile: async () => {},
    };
  }
  return context;
}
