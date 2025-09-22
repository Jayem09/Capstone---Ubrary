
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, UserRole, RolePermissions } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
  hasPermission: (permission: keyof RolePermissions) => boolean;
  getUserPermissions: () => RolePermissions;
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

  // Initialize authentication state - SIMPLE VERSION
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔧 Checking if user is logged in...');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Found session for:', session.user.email);
        
        // Check if user exists in database
        const { data: dbUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (dbUser) {
          console.log('🎉 User exists in DB - logging in!');
          
          // User exists in DB → LOGIN
          setAuthState({
            user: {
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
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } else if (selectError) {
          console.log('🔧 RLS blocking user query - logging in with session data');
          console.log('🔍 Error details:', selectError);
          
          // RLS is blocking us from reading the user - login with session data directly
          console.log('✅ Setting auth state with session data...');
          setAuthState({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || 'User',
                lastName: session.user.user_metadata?.last_name || '',
                role: (session.user.user_metadata?.role as any) || 'student',
                program: session.user.user_metadata?.program,
                department: session.user.user_metadata?.department,
                studentId: session.user.user_metadata?.student_id,
                employeeId: session.user.user_metadata?.employee_id,
                avatar: `${session.user.user_metadata?.first_name?.[0] || 'U'}${session.user.user_metadata?.last_name?.[0] || ''}`,
                isActive: true,
                createdAt: session.user.created_at || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              },
              isAuthenticated: true,
              isLoading: false,
            });
            console.log('🎉 Auth state set - user should be logged in!');
            return; // Exit early, don't try to create user
        } else {
          console.log('⚠️ User has session but not in DB - creating profile...');
          
          // Create user profile from session metadata
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                first_name: session.user.user_metadata?.first_name || 'User',
                last_name: session.user.user_metadata?.last_name || '',
                role: (session.user.user_metadata?.role as any) || 'student',
                program: session.user.user_metadata?.program,
                department: session.user.user_metadata?.department,
                student_id: session.user.user_metadata?.student_id,
                employee_id: session.user.user_metadata?.employee_id,
              });

            if (insertError) {
              console.log('🔧 User creation failed, logging in with session data anyway');
              
              // If it's a duplicate key error, the user already exists but RLS is blocking us
              if (insertError.code === '23505') {
                
                // Login with session data since user exists
                setAuthState({
                  user: {
                    id: session.user.id,
                    email: session.user.email || '',
                    firstName: session.user.user_metadata?.first_name || 'User',
                    lastName: session.user.user_metadata?.last_name || '',
                    role: (session.user.user_metadata?.role as any) || 'student',
                    program: session.user.user_metadata?.program,
                    department: session.user.user_metadata?.department,
                    studentId: session.user.user_metadata?.student_id,
                    employeeId: session.user.user_metadata?.employee_id,
                    avatar: `${session.user.user_metadata?.first_name?.[0] || 'U'}${session.user.user_metadata?.last_name?.[0] || ''}`,
                    isActive: true,
                    createdAt: session.user.created_at || new Date().toISOString(),
                    lastLoginAt: new Date().toISOString(),
                  },
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                setAuthState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            } else {
              console.log('✅ User profile created - logging in!');
              
              // Login with session data
              setAuthState({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  firstName: session.user.user_metadata?.first_name || 'User',
                  lastName: session.user.user_metadata?.last_name || '',
                  role: (session.user.user_metadata?.role as any) || 'student',
                  program: session.user.user_metadata?.program,
                  department: session.user.user_metadata?.department,
                  studentId: session.user.user_metadata?.student_id,
                  employeeId: session.user.user_metadata?.employee_id,
                  avatar: `${session.user.user_metadata?.first_name?.[0] || 'U'}${session.user.user_metadata?.last_name?.[0] || ''}`,
                  isActive: true,
                  createdAt: session.user.created_at || new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                },
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (createError) {
            console.error('Error creating user profile:', createError);
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } else {
        console.log('❌ No session found - need to login');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };




  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Try real Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase auth fails, fall back to mock authentication for development
        console.log('Supabase auth failed, trying mock authentication:', error.message);
        
        const user = MOCK_USERS.find(u => u.email === email);
        if (user && password === 'password') {
          const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
          setAuthState({
            user: updatedUser,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('ubrary_user', JSON.stringify(updatedUser));
          return;
        } else {
          throw new Error('Invalid credentials');
        }
      }

      // Real authentication succeeded - user profile will be loaded by the auth state change listener
      if (!data.user) {
        throw new Error('Authentication failed');
      }

    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Try real Supabase registration with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
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
      });

      if (authError) {
        console.error('Supabase auth signup error:', authError);
        throw new Error(authError.message || 'Registration failed');
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user returned');
      }

      console.log('✅ User registration successful:', authData.user.id);

      // The trigger should automatically create the user profile
      // Let's verify it was created
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.warn('Profile not found, creating manually:', profileError);
          
          // Manually create profile if trigger failed
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: userData.role,
              program: userData.program,
              department: userData.department,
              student_id: userData.studentId,
              employee_id: userData.employeeId,
            });

          if (insertError) {
            console.error('Failed to create user profile:', insertError);
            await supabase.auth.signOut();
            throw new Error('Failed to create user profile: ' + insertError.message);
          }
        } else {
          console.log('✅ User profile created successfully:', profile);
        }
      } catch (profileCheckError) {
        console.warn('Could not verify profile creation:', profileCheckError);
        // Continue anyway - the trigger might have worked
      }

      // User profile will be loaded by the auth state change listener

    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    // Clear local state regardless
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
        register,
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
