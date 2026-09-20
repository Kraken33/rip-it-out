import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Supabase mock factory ────────────────────────────────────────────
let mockUser = null;
let mockSession = null;
let mockAuthStateCallback = null;

const mockSupabase = {
  auth: {
    getSession: vi.fn(async () => ({
      data: { session: mockSession },
    })),
    onAuthStateChange: vi.fn((cb) => {
      mockAuthStateCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signUp: vi.fn(async ({ email }) => ({
      data: { user: { id: 'new-uid', email }, session: null },
      error: null,
    })),
    signInWithPassword: vi.fn(async ({ email }) => ({
      data: { user: { id: 'uid-1', email }, session: { user: { id: 'uid-1', email } } },
      error: null,
    })),
    signOut: vi.fn(async () => ({ error: null })),
  },
};

vi.mock('../supabaseClient', () => ({
  get supabase() { return mockSupabase; },
  isSupabaseConfigured: true,
}));

// Helper component to expose context values
function AuthConsumer() {
  const { user, loading, isConfigured } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="configured">{String(isConfigured)}</div>
    </div>
  );
}

// Helper component to test signIn
function SignInConsumer() {
  const { signIn, user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => signIn({ email: 'test@example.com', password: 'pass123' })}>
        Sign In
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockUser = null;
    mockSession = null;
    mockAuthStateCallback = null;
    vi.clearAllMocks();

    // Re-wire mocks after clear
    mockSupabase.auth.getSession.mockImplementation(async () => ({
      data: { session: mockSession },
    }));
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
      mockAuthStateCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mockSupabase.auth.signUp.mockImplementation(async ({ email }) => ({
      data: { user: { id: 'new-uid', email }, session: null },
      error: null,
    }));
    mockSupabase.auth.signInWithPassword.mockImplementation(async ({ email }) => ({
      data: { user: { id: 'uid-1', email }, session: { user: { id: 'uid-1', email } } },
      error: null,
    }));
    mockSupabase.auth.signOut.mockImplementation(async () => ({ error: null }));
  });

  it('starts with loading true then resolves to no user when no session', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('no-user'));
  });

  it('loads existing session from getSession on mount', async () => {
    mockSession = { user: { id: 'uid-existing', email: 'existing@test.com' } };
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('existing@test.com')
    );
  });

  it('exposes isConfigured as true when supabase is configured', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('configured')).toHaveTextContent('true')
    );
  });

  it('updates user state via onAuthStateChange callback', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    act(() => {
      mockAuthStateCallback?.('SIGNED_IN', {
        user: { id: 'uid-auth', email: 'auth@test.com' },
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('auth@test.com')
    );
  });

  it('signUp calls supabase.auth.signUp with correct credentials', async () => {
    function SignUpConsumer() {
      const { signUp, loading } = useAuth();
      if (loading) return <div>Loading...</div>;
      return (
        <button onClick={() => signUp({ email: 'new@test.com', password: 'secure123' })}>
          Register
        </button>
      );
    }

    render(
      <AuthProvider>
        <SignUpConsumer />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Register'));
    await act(async () => screen.getByText('Register').click());

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'secure123',
    });
  });

  it('signOut calls supabase.auth.signOut and clears user', async () => {
    mockSession = { user: { id: 'uid-1', email: 'logged@test.com' } };
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

    function SignOutConsumer() {
      const { signOut, user, loading } = useAuth();
      if (loading) return <div>Loading...</div>;
      return (
        <div>
          <div data-testid="user">{user ? user.email : 'no-user'}</div>
          <button onClick={signOut}>Sign Out</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <SignOutConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('logged@test.com')
    );

    await act(async () => screen.getByText('Sign Out').click());

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    );
  });
});
