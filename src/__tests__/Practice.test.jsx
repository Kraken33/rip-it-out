import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Practice from '../screens/Practice';
import { clearAllData, createSession, addImprovements } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Practice Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders empty state when no cards are due', async () => {
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument()
    );
  });

  it('renders Russian scenario practice prompt when cards are due', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Scenario Practice Mode/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Copy Prompt #3/i })).toBeInTheDocument();
  });
});
