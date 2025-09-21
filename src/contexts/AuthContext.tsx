import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, UserRole, RolePermissions } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
  hasPermission: (permission: keyof RolePermissions) => boolean;
  getUserPermissions: () => RolePermissions;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john.dinglasan@ub.edu.ph',
    firstName: 'John Mark',
    lastName: 'Dinglasan',
    role: 'student',
    program: 'BS Information Technology',
    studentId: '2021-00001',
    avatar: 'JD',
    isActive: true,
    createdAt: '2021-08-15T00:00:00Z',
    lastLoginAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'maria.santos@ub.edu.ph',
    firstName: 'Dr. Maria',
    lastName: 'Santos',
    role: 'faculty',
    department: 'Information Technology',
    employeeId: 'FAC-2020-001',
    avatar: 'MS',
    isActive: true,
    createdAt: '2020-01-15T00:00:00Z',
    lastLoginAt: '2024-01-15T08:45:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'librarian@ub.edu.ph',
    firstName: 'Ana',
    lastName: 'Cruz',
    role: 'librarian',
    department: 'Library Services',
    employeeId: 'LIB-2019-001',
    avatar: 'AC',
    isActive: true,
    createdAt: '2019-03-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:15:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'admin@ub.edu.ph',
    firstName: 'Roberto',
    lastName: 'Admin',
    role: 'admin',
    department: 'IT Administration',
    employeeId: 'ADM-2018-001',
    avatar: 'RA',
    isActive: true,
    createdAt: '2018-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T07:30:00Z',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize with a default user for demo
  useEffect(() => {
    // Simulate loading user from localStorage or API
    const savedUser = localStorage.getItem('ubrary_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      // For demo, auto-login as student
      const defaultUser = MOCK_USERS[0];
      setAuthState({
        user: defaultUser,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('ubrary_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && password === 'password') { // Simple demo password
      const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('ubrary_user', JSON.stringify(updatedUser));
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem('ubrary_user');
  };

  const switchRole = (role: UserRole) => {
    if (!authState.user) return;
    
    const newUser = MOCK_USERS.find(u => u.role === role);
    if (newUser) {
      setAuthState(prev => ({
        ...prev,
        user: newUser,
      }));
      localStorage.setItem('ubrary_user', JSON.stringify(newUser));
    }
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!authState.user) return false;
    return ROLE_PERMISSIONS[authState.user.role][permission];
  };

  const getUserPermissions = (): RolePermissions => {
    if (!authState.user) {
      return ROLE_PERMISSIONS.student; // Default to most restrictive
    }
    return ROLE_PERMISSIONS[authState.user.role];
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        switchRole,
        hasPermission,
        getUserPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
