import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Library from '../screens/Library';
import { clearAllData, createSession, addImprovements } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Library Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders empty library state', async () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Your phrase library is empty/i)).toBeInTheDocument()
    );
  });

  it('displays stored phrases and filters by construction search term', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [
      { construction: 'invite [someone] over', original: 'invited home', improved: 'invited him over', explanation: 'exp' },
      { construction: 'look forward to', original: 'waiting for', improved: 'looking forward to', explanation: 'exp2' }
    ]);

    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"invite \[someone\] over\"/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/\"look forward to\"/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search phrases or explanations/i);
    fireEvent.change(searchInput, { target: { value: 'forward' } });

    expect(screen.queryByText(/\"invite \[someone\] over\"/i)).not.toBeInTheDocument();
    expect(screen.getByText(/\"look forward to\"/i)).toBeInTheDocument();
  });

  it('pre-filters phrases when session query parameter is present in URL', async () => {
    const s1 = await createSession({ title: 'Session 1', sourceType: 'video' });
    const s2 = await createSession({ title: 'Session 2', sourceType: 'podcast' });

    await addImprovements(s1.id, [
      { construction: 'phrase from s1', original: 'orig1', improved: 'imp1', explanation: 'exp1' }
    ]);
    await addImprovements(s2.id, [
      { construction: 'phrase from s2', original: 'orig2', improved: 'imp2', explanation: 'exp2' }
    ]);

    window.history.pushState({}, '', `/?session=${s1.id}`);

    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"phrase from s1\"/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/\"phrase from s2\"/i)).not.toBeInTheDocument();
  });
});
