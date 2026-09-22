import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Practice from '../screens/Practice';
import { clearAllData, createSession, addImprovements } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

vi.mock('../services/aiService', () => ({
  generateTranslationRoundPassage: vi
    .fn()
    .mockResolvedValue('Вчера я [[пригласил друга в гости|invite over]].'),
  evaluateTranslationRound: vi.fn().mockResolvedValue(
    JSON.stringify({
      verdict: {
        summary: 'ok',
        rewrite_needed: false,
        rewrite: '',
        constructions: [
          { target: 'invite over', used: true, quality: 'natural', mine: 'invited him over', better: null, note: null },
        ],
      },
    })
  ),
  transcribeAudio: vi.fn().mockResolvedValue('I invited a friend over'),
}));

// Lets a single test drive onFinish with an arbitrary payload while every
// other test exercises the real session component.
const mocks = vi.hoisted(() => ({ finishPayload: null }));

vi.mock('../screens/TranslationPracticeSession', async (importOriginal) => {
  const mod = await importOriginal();
  const Original = mod.default;
  return {
    default: (props) =>
      mocks.finishPayload ? (
        <button onClick={() => props.onFinish(mocks.finishPayload)}>Stub Finish</button>
      ) : (
        <Original {...props} />
      ),
  };
});

describe('Practice Component', () => {
  beforeEach(async () => {
    mocks.finishPayload = null;
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

  it('renders practice mode with upcoming cards when 0 cards are due today but cards exist in vault', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    // Push nextReview to the future
    const { getSrsCards, updateSrsCard, getDueCards } = await import('../store');
    const allCards = await getSrsCards();
    await updateSrsCard(allCards[0].improvementId, { nextReview: new Date(Date.now() + 86400000).toISOString() });

    expect(await getDueCards()).toHaveLength(0);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument()
    );
  });

  it('renders translation practice mode by default when cards are due', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Finish & Rate Recall →/i })).toBeInTheDocument();
  });

  it('switches between translation practice and scenario practice mode', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument()
    );

    // Switch to Scenario Q&A (Prompt #3)
    const scenarioTab = screen.getByRole('button', { name: /Scenario Q&A/i });
    fireEvent.click(scenarioTab);

    expect(screen.getByText(/Russian Scenario Practice Mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Prompt #3/i })).toBeInTheDocument();

    // Switch to Copy Prompt #5 submode
    const transTab = screen.getByRole('button', { name: /Translation Practice/i });
    fireEvent.click(transTab);

    const prompt5Tab = screen.getByRole('button', { name: /📋 Copy Prompt #5/i });
    fireEvent.click(prompt5Tab);

    expect(screen.getByText(/Russian Translation Practice \(Prompt #5\)/i)).toBeInTheDocument();
    expect(document.getElementById('btn-copy-prompt-5')).toBeInTheDocument();
  });

  it('persists Easy rating and advances the queue after a seamless translation session finishes', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [
      { construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' },
      { construction: 'invite over', original: 'invited', improved: 'invite him over', explanation: 'exp2' },
    ]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    const finishBtn = await screen.findByRole('button', { name: /Finish & Rate Recall →/i });
    fireEvent.click(finishBtn);

    // Rate Recall step appears
    await screen.findByRole('heading', { name: 'Rate Recall' });

    // Regression: Hard/Good/Easy must work too, not only Again
    fireEvent.click(screen.getByRole('button', { name: /Easy/i }));

    const { getSrsCards } = await import('../store');
    await waitFor(async () => {
      const all = await getSrsCards();
      const rated = all.filter((c) => c.status === 'reviewing');
      expect(rated).toHaveLength(1);
      expect(rated[0].intervalDays).toBe(4);
      expect(rated[0].totalReviews).toBe(1);
      expect(new Date(rated[0].nextReview).getTime()).toBeGreaterThan(Date.now());
    });

    // Queue advanced to the second practiced card
    await waitFor(() =>
      expect(screen.getByText((_, el) => el?.textContent === '2 / 2')).toBeInTheDocument()
    );
  });

  it('persists Good rating after prompt-based practice via "I\'m Done Practicing → Rate Recall"', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [
      { construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' },
    ]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    // Wait for the seamless session, then switch to the Copy Prompt #5 sub-mode
    await screen.findByRole('button', { name: /Finish & Rate Recall →/i });
    fireEvent.click(screen.getByRole('button', { name: /📋 Copy Prompt #5/i }));

    const doneBtn = await screen.findByRole('button', { name: /Done Practicing/i });
    fireEvent.click(doneBtn);

    await screen.findByRole('heading', { name: 'Rate Recall' });
    fireEvent.click(screen.getByRole('button', { name: /Good/i }));

    const { getSrsCards } = await import('../store');
    await waitFor(async () => {
      const all = await getSrsCards();
      expect(all).toHaveLength(1);
      expect(all[0].status).toBe('learning');
      expect(all[0].intervalDays).toBe(1);
      expect(all[0].repetitions).toBe(1);
      expect(all[0].totalReviews).toBe(1);
    });

    // Single card rated -> completion screen
    expect(await screen.findByText('Session finished')).toBeInTheDocument();
  });

  it('skips to the completion state when no practiced card has a matching SRS card', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [
      { construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' },
    ]);

    // Simulate a practiced payload whose improvement has no SRS card record
    mocks.finishPayload = [{ id: 'ghost-improvement', construction: 'ghost', improved: 'ghost' }];

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    const stubBtn = await screen.findByRole('button', { name: 'Stub Finish' });
    fireEvent.click(stubBtn);

    expect(await screen.findByText('Session finished')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rate Recall' })).not.toBeInTheDocument();
  });
});
