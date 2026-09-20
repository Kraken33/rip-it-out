import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Review from '../screens/Review';
import { clearAllData, createSession, addImprovements } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Review Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders caught up state when no cards are due', async () => {
    render(
      <BrowserRouter>
        <Review />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument()
    );
  });

  it('renders card front with target construction pattern and handles answer reveal', async () => {
    const s = await createSession({ title: 'Book 1', sourceType: 'book' });
    await addImprovements(s.id, [{ construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over to my place', explanation: 'natural' }]);

    render(
      <BrowserRouter>
        <Review />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"invite \[someone\] over\"/i)).toBeInTheDocument()
    );

    const showAnswerBtn = screen.getByRole('button', { name: /Show Answer/i });
    fireEvent.click(showAnswerBtn);

    expect(screen.getByText(/\"invited him over to my place\"/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Good/i })).toBeInTheDocument();
  });
});
