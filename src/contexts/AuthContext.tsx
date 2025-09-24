
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, UserRole, RolePermissions } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
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


export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize authentication state - ROBUST VERSION
  useEffect(() => {
    let isInitialized = false;
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.log('⚠️ Auth initialization timeout - forcing not authenticated');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        isInitialized = true;
      }
    }, 8000); // 8 second timeout

    // Helper function to load user profile
    const loadUserProfile = async (user: any) => {
      try {
        console.log('🔍 Fetching user profile from database for user ID:', user.id);
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('📊 Database query result:', { dbUser: !!dbUser, error: dbError });
        
        if (dbUser) {
          console.log('✅ User found in database, setting authenticated state');
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
        } else {
          console.log('⚠️ User not found in database, using session metadata');
          // User exists in auth but not in our users table - use session data
          setAuthState({
            user: {
              id: user.id,
              email: user.email || '',
              firstName: user.user_metadata?.first_name || 'User',
              lastName: user.user_metadata?.last_name || '',
              role: (user.user_metadata?.role as any) || 'student',
              program: user.user_metadata?.program,
              department: user.user_metadata?.department,
              studentId: user.user_metadata?.student_id,
              employeeId: user.user_metadata?.employee_id,
              avatar: `${user.user_metadata?.first_name?.[0] || 'U'}${user.user_metadata?.last_name?.[0] || ''}`,
              isActive: true,
              createdAt: user.created_at || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('❌ Error loading user profile:', error);
        console.log('🔄 Falling back to session metadata');
        // Fallback to session data
        setAuthState({
          user: {
            id: user.id,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || 'User',
            lastName: user.user_metadata?.last_name || '',
            role: (user.user_metadata?.role as any) || 'student',
            program: user.user_metadata?.program,
            department: user.user_metadata?.department,
            studentId: user.user_metadata?.student_id,
            employeeId: user.user_metadata?.employee_id,
            avatar: `${user.user_metadata?.first_name?.[0] || 'U'}${user.user_metadata?.last_name?.[0] || ''}`,
            isActive: true,
            createdAt: user.created_at || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    };

    // Check for existing session first
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Checking existing session:', session ? 'Found' : 'None');
        
        if (session?.user) {
          console.log('✅ Existing session found, loading user profile');
          await loadUserProfile(session.user);
          isInitialized = true;
          clearTimeout(timeoutId);
        } else {
          console.log('❌ No existing session, setting not authenticated');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          isInitialized = true;
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        isInitialized = true;
        clearTimeout(timeoutId);
      }
    };

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session found' : 'No session');
      
      if (!isInitialized) {
        clearTimeout(timeoutId);
        isInitialized = true;
      }
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        console.log('🔄 Loading user profile for signed in user:', session.user.email);
        await loadUserProfile(session.user);
        console.log('✅ User profile loaded successfully');
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    // Check for existing session immediately
    checkExistingSession();

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);





  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Try real Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid credentials');
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
      // Try real Supabase registration with minimal metadata to avoid trigger issues
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
        
        // If it's a database error, try a different approach
        if (authError.message?.includes('Database error saving new user')) {
          console.log('🔄 Trying alternative registration approach...');
          
          // Try registration without metadata first
          const { data: simpleAuthData, error: simpleAuthError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password
          });

          if (simpleAuthError) {
            throw new Error(simpleAuthError.message || 'Registration failed');
          }

          if (!simpleAuthData.user) {
            throw new Error('Registration failed - no user returned');
          }

          // Manually create the user profile
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: simpleAuthData.user.id,
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

          console.log('✅ User registered successfully with manual profile creation');
          return;
        }
        
        throw new Error(authError.message || 'Registration failed');
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user returned');
      }

      // Check if user profile was created by trigger
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.log('🔄 Trigger failed, creating profile manually...');
          
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
            // If it's a duplicate key error, the user already exists (trigger worked)
            if (insertError.code === '23505') {
              console.log('✅ User profile already exists (trigger worked):', insertError.message);
            } else {
              console.error('Failed to create user profile:', insertError);
              await supabase.auth.signOut();
              throw new Error('Failed to create user profile: ' + insertError.message);
            }
          }
        } else {
          console.log('✅ User profile created successfully by trigger:', profile);
        }
      } catch (profileCheckError) {
        console.error('Error checking/creating user profile:', profileCheckError);
        // Continue anyway - the user might still be able to login
      }

      console.log('✅ Registration completed successfully');
      
      // Don't set loading to false here - let the auth state change listener handle it
      // The user will be automatically signed in and the auth state will update

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
    console.error('useAuth called outside AuthProvider, using fallback');
    // Return a safe fallback instead of throwing
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      logout: () => {},
      register: async () => {},
      hasPermission: () => false,
      getUserPermissions: () => ({ canRead: false, canWrite: false, canDelete: false, canAdmin: false })
    };
  }
  return context;
}
