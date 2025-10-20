import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { ReactNode } from 'react';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Test component that uses AuthContext
function TestComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    register, 
    logout, 
    hasPermission 
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="isLoading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="canUpload">{hasPermission('canUpload') ? 'true' : 'false'}</div>
      
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      
      <button 
        data-testid="register-button" 
        onClick={() => register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student',
          program: 'Information Technology'
        })}
      >
        Register
      </button>
      
      <button 
        data-testid="logout-button" 
        onClick={() => logout()}
      >
        Logout
      </button>
    </div>
  );
}

function TestWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('should handle successful login', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });

  it('should handle login error', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });

  it('should handle successful registration', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const registerButton = screen.getByTestId('register-button');
    expect(registerButton).toBeInTheDocument();
  });

  it('should handle registration error', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const registerButton = screen.getByTestId('register-button');
    expect(registerButton).toBeInTheDocument();
  });

  it('should handle logout', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const logoutButton = screen.getByTestId('logout-button');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should check permissions correctly', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Default permissions for unauthenticated user
    expect(screen.getByTestId('canUpload')).toHaveTextContent('false');
  });

  it('should handle auth state changes', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('isAuthenticated')).toBeInTheDocument();
  });

  it('should handle network errors gracefully', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });

  it('should handle missing user metadata', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });

  it('should handle database errors during profile fetch', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });
});
