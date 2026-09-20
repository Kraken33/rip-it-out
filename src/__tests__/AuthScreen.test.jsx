import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthScreen } from '../screens/AuthScreen';

// ── Mock AuthContext ────────────────────────────────────────────────
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    isConfigured: true,
  }),
}));

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Sign In tab by default with correct fields', () => {
    render(<AuthScreen />);

    expect(screen.getByText('Rip It Out')).toBeInTheDocument();
    // 'Sign In' appears on both tab and submit button
    expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('shows confirm password field only in Register tab', async () => {
    render(<AuthScreen />);

    // Should NOT have confirm password initially (Sign In tab)
    expect(screen.queryAllByPlaceholderText('••••••••').length).toBe(1);

    // Switch to Register
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Should now have 2 password fields (password + confirm)
    expect(screen.queryAllByPlaceholderText('••••••••').length).toBe(2);
  });

  it('shows validation error when email is empty', async () => {
    const { container } = render(<AuthScreen />);

    const form = container.querySelector('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() =>
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument()
    );
  });

  it('shows password length validation error', async () => {
    render(<AuthScreen />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: '123' }, // Too short
    });

    // Click the submit-type button
    const submitBtns = screen.getAllByRole('button');
    const submitBtn = submitBtns.find(b => b.type === 'submit');
    await act(async () => fireEvent.click(submitBtn));

    await waitFor(() =>
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    );
  });

  it('shows password mismatch error in register mode', async () => {
    render(<AuthScreen />);

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    const [passwordInput, confirmInput] = screen.queryAllByPlaceholderText('••••••••');
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different456' } });

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    );

    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );
  });

  it('calls signIn with correct credentials on valid login form submit', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'uid-1' }, session: {} });

    render(<AuthScreen />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'mypassword' },
    });

    // Submit button is type="submit"
    const submitBtns = screen.getAllByRole('button');
    const submitBtn = submitBtns.find(b => b.type === 'submit');
    await act(async () => fireEvent.click(submitBtn));

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'mypassword',
    });
  });

  it('calls signUp with correct credentials on valid register form submit', async () => {
    mockSignUp.mockResolvedValue({ user: { id: 'uid-new' }, session: null });

    render(<AuthScreen />);

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'new@test.com' },
    });
    const [passwordInput, confirmInput] = screen.queryAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'securepass' } });
    fireEvent.change(confirmInput, { target: { value: 'securepass' } });

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    );

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'securepass',
    });
  });

  it('shows success message when registration returns user without session (email confirmation)', async () => {
    mockSignUp.mockResolvedValue({ user: { id: 'uid-new' }, session: null });

    render(<AuthScreen />);

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'new@test.com' },
    });
    const [passwordInput, confirmInput] = screen.queryAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'securepass' } });
    fireEvent.change(confirmInput, { target: { value: 'securepass' } });

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    );

    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    );
  });

  it('displays error message when signIn throws', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));

    render(<AuthScreen />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });

    const submitBtns = screen.getAllByRole('button');
    const submitBtn = submitBtns.find(b => b.type === 'submit');
    await act(async () => fireEvent.click(submitBtn));

    await waitFor(() =>
      expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument()
    );
  });
});
