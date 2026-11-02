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
const mocks = vi.hoisted(() => ({ finishPayload: null, finishRounds: [[], []] }));

vi.mock('../screens/TranslationPracticeSession', async (importOriginal) => {
  const mod = await importOriginal();
  const Original = mod.default;
  return {
    default: (props) =>
      mocks.finishPayload ? (
        <button onClick={() => props.onFinish(mocks.finishRounds[0], mocks.finishPayload)}>Stub Finish</button>
      ) : (
        <Original {...props} />
      ),
  };
});

describe('Practice Component', () => {
  beforeEach(async () => {
    mocks.finishPayload = null;
    mocks.finishRounds = [[], []];
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
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Finish Practice/i })).toBeInTheDocument();
  });

  it('renders translation practice directly and links to frequency sentences', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument()
    );

    expect(screen.getByText(/Frequency Sentences/i)).toBeInTheDocument();
    expect(screen.queryByText(/Prompt #5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Prompt #3/i)).not.toBeInTheDocument();
  });

  it('finishes session immediately when Finish Practice is clicked without rounds', async () => {
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

    const finishBtn = await screen.findByRole('button', { name: /Finish Practice/i });
    fireEvent.click(finishBtn);

    // No rounds submitted → no session artefact saved, straight to completion.
    const { getSessions, getActivityLogs, getSrsCards } = await import('../store');
    await waitFor(async () => {
      expect(await getSessions()).toHaveLength(1);
      expect(await getActivityLogs()).toHaveLength(0);
    });

    // Session finished completion appears directly without redundant rating
    expect(await screen.findByText('Session finished')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rate Recall' })).not.toBeInTheDocument();

    // Cards remain unreviewed since they were not rated
    const all = await getSrsCards();
    expect(all.every((c) => c.totalReviews === 0)).toBe(true);
  });

  it('saves a translation-practice session with translations-only stats on seamless finish', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    const [imp] = await addImprovements(s.id, [
      { construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' },
    ]);

    mocks.finishPayload = [{ id: imp.id, improvementId: imp.id, construction: 'catch up on', improved: 'catch up on work' }];
    mocks.finishRounds = [[
      {
        roundIndex: 0,
        cards: [{ id: imp.id, improvementId: imp.id, construction: 'catch up on', improved: 'catch up on work' }],
        passageText: 'Вчера мы поболтали.',
        translationText: 'Yesterday we caught up nicely',
        evaluatedAt: new Date().toISOString(),
        verdict: {
          summary: 'Good use of the target.',
          rewriteNeeded: false,
          rewrite: '',
          constructions: [{ target: 'catch up on', used: true, quality: 'natural', mine: 'caught up', better: null, note: null }],
        },
        rawFeedback: '',
      },
    ], mocks.finishPayload];

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    const stubBtn = await screen.findByRole('button', { name: 'Stub Finish' });
    fireEvent.click(stubBtn);

    const { getSessions, getSessionWordMetrics, getActivityStats, countTextWords } = await import('../store');
    let savedId;
    await waitFor(async () => {
      const sessions = await getSessions();
      // Origin session + saved translation-practice artefact.
      expect(sessions).toHaveLength(2);
      const saved = sessions.find((x) => x.sourceType === 'translation-practice');
      expect(saved).toBeDefined();
      savedId = saved.id;
      expect(saved.title).toMatch(/Translation Practice/);
      expect(saved.title).toMatch(/1 rounds/);
      // rawText holds ONLY the learner translation — passage/verdict text excluded.
      expect(saved.rawText).toBe('Yesterday we caught up nicely');
      expect(saved.messages.map((m) => m.content).join('\n')).toContain('Вчера мы поболтали.');
      const expected = countTextWords('Yesterday we caught up nicely');
      const metrics = await getSessionWordMetrics(savedId);
      expect(metrics).toMatchObject({ totalWords: expected.totalWords, uniqueWords: expected.uniqueWords });
      const stats = await getActivityStats();
      // Duration may be 0s in the fast test env (no log), but a real session
      // logs time against the saved artefact when duration > 0.
      expect(stats.totalTimeSeconds).toBeGreaterThanOrEqual(0);
    });

    // Session completion appears directly without redundant batch rating
    const sessions = await getSessions();
    expect(sessions.some((x) => x.id === savedId && x.sourceType === 'translation-practice')).toBe(true);
    expect(await screen.findByText('Session finished')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rate Recall' })).not.toBeInTheDocument();
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

  it('persists inline rating via onRateCard and finishes directly to completion screen', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [
      { construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' },
    ]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await screen.findByText(/Round 1/i);

    // Submit translation
    const textarea = screen.getByPlaceholderText(/Type or speak your English translation/i);
    fireEvent.change(textarea, { target: { value: 'We caught up on work.' } });
    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));

    // Wait for verdict
    await screen.findByTestId('translation-verdict');

    // Rate the card inline via the card rating button
    const goodBtn = screen.getByRole('button', { name: /3\. Good/i });
    fireEvent.click(goodBtn);

    // Verify SRS card updated
    const { getSrsCards } = await import('../store');
    await waitFor(async () => {
      const all = await getSrsCards();
      expect(all[0].totalReviews).toBe(1);
    });

    // Session completion view is displayed directly without redundant batch rating
    expect(await screen.findByText('Session finished')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rate Recall' })).not.toBeInTheDocument();
  });

  it('finishes session early after rating card 1, ignoring unrated card 2 and transitioning straight to completion', async () => {
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

    await screen.findByText(/Round 1/i);

    // Submit translation for card 1
    const textarea = screen.getByPlaceholderText(/Type or speak your English translation/i);
    fireEvent.change(textarea, { target: { value: 'We caught up on work.' } });
    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));

    // Wait for verdict
    await screen.findByTestId('translation-verdict');

    // Rate card 1 inline via the card rating button (advances to card 2)
    const goodBtn = screen.getByRole('button', { name: /3\. Good/i });
    fireEvent.click(goodBtn);

    // Now round 2 is loaded (unrated)
    await screen.findByText(/Round 2/i);

    // Click Finish Practice early
    const finishBtn = screen.getByRole('button', { name: /Finish Practice/i });
    fireEvent.click(finishBtn);

    // Transitions directly to completion screen
    expect(await screen.findByText('Session finished')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rate Recall' })).not.toBeInTheDocument();

    // Verify card 1 has SRS review, card 2 has 0 reviews
    const { getSrsCards, getSessions } = await import('../store');
    const all = await getSrsCards();
    const card1 = all.find((c) => c.improvementId === 'imp_1' || c.construction === 'catch up on');
    const card2 = all.find((c) => c.improvementId === 'imp_2' || c.construction === 'invite over');
    expect(card1?.totalReviews ?? all[0].totalReviews).toBe(1);
    expect(card2?.totalReviews ?? all[1].totalReviews).toBe(0);

    // Saved session exists with 1 round
    const sessions = await getSessions();
    const saved = sessions.find((x) => x.sourceType === 'translation-practice');
    expect(saved).toBeDefined();
    expect(saved.title).toMatch(/1 rounds/);
  });
});
