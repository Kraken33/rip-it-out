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

  it('renders review card with upcoming cards when 0 cards are due today but cards exist in vault', async () => {
    const s = await createSession({ title: 'Book 1', sourceType: 'book' });
    await addImprovements(s.id, [{ construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over to my place', explanation: 'natural' }]);

    // Push nextReview into the future
    const { getSrsCards, updateSrsCard, getDueCards } = await import('../store');
    const allCards = await getSrsCards();
    await updateSrsCard(allCards[0].improvementId, { nextReview: new Date(Date.now() + 86400000).toISOString() });

    expect(await getDueCards()).toHaveLength(0);

    render(
      <BrowserRouter>
        <Review />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"invite \[someone\] over\"/i)).toBeInTheDocument()
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

  it('advances to next card and completes review session when rating cards', async () => {
    const s = await createSession({ title: 'Book 1', sourceType: 'book' });
    await addImprovements(s.id, [
      { construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over to my place', explanation: 'natural' },
      { construction: 'run out of [something]', original: 'no coffee', improved: 'ran out of coffee', explanation: 'common phrase' },
    ]);

    render(
      <BrowserRouter>
        <Review />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"invite \[someone\] over\"/i)).toBeInTheDocument()
    );

    // Rate first card Good (3)
    fireEvent.click(screen.getByRole('button', { name: /Show Answer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Good/i }));

    // Second card should now be displayed
    await waitFor(() =>
      expect(screen.getByText(/\"run out of \[something\]\"/i)).toBeInTheDocument()
    );

    // Rate second card Good (3)
    fireEvent.click(screen.getByRole('button', { name: /Show Answer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Good/i }));

    // Review session should be complete
    await waitFor(() =>
      expect(screen.getByText(/Session Complete!/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/You reviewed 2 cards today/i)).toBeInTheDocument();
  });

  it('requeues card when rating Again (1) and completes session when requeued card is finished', async () => {
    const s = await createSession({ title: 'Book 1', sourceType: 'book' });
    await addImprovements(s.id, [
      { construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over to my place', explanation: 'natural' },
    ]);

    render(
      <BrowserRouter>
        <Review />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/\"invite \[someone\] over\"/i)).toBeInTheDocument()
    );

    // Rate Again (1)
    fireEvent.click(screen.getByRole('button', { name: /Show Answer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Again/i }));

    // The card is requeued; answer should be hidden and card 2 of 2 rendered
    await waitFor(() =>
      expect(screen.getByText(/Card 2 of 2/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Show Answer/i })).toBeInTheDocument();

    // Now rate Good (3)
    fireEvent.click(screen.getByRole('button', { name: /Show Answer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Good/i }));

    await waitFor(() =>
      expect(screen.getByText(/Session Complete!/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/You reviewed 2 cards today/i)).toBeInTheDocument();
  });
});
