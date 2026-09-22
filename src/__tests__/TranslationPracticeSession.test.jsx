import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import TranslationPracticeSession from '../screens/TranslationPracticeSession';

const mocks = vi.hoisted(() => ({
  generateTranslationRoundPassage: vi.fn(),
  evaluateTranslationRound: vi.fn(),
  dictation: { transcription: 'invited him over' },
}));

vi.mock('../services/aiService', () => ({
  generateTranslationRoundPassage: mocks.generateTranslationRoundPassage,
  evaluateTranslationRound: mocks.evaluateTranslationRound,
  transcribeAudio: vi.fn().mockResolvedValue('I invited a friend over'),
}));

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button type="button" onClick={() => onTranscribed(mocks.dictation.transcription)}>
      Simulate dictation
    </button>
  ),
}));

const PASSAGE = 'Вчера я [[пригласил друга в гости|invite over]] и мы [[поболтали|catch up]].';

const buildVerdict = (constructions, { summary = 'ok', rewriteNeeded = false, rewrite = '' } = {}) =>
  JSON.stringify({ verdict: { summary, rewrite_needed: rewriteNeeded, rewrite, constructions } });

const NATURAL_VERDICT = buildVerdict([
  { target: 'invite over', used: true, quality: 'natural', mine: 'invited a friend over', better: 'invited a friend over', note: 'SHOULD NOT RENDER' },
  { target: 'plan on', used: true, quality: 'natural', mine: 'plan on going', better: 'plan on going', note: null },
  { target: 'turn down', used: true, quality: 'natural', mine: 'turned it down', better: 'turned it down', note: null },
  { target: 'catch up', used: true, quality: 'natural', mine: 'caught up', better: 'caught up', note: null },
]);

const PROBLEM_VERDICT = buildVerdict(
  [
    { target: 'invite over', used: true, quality: 'awkward', mine: 'invited a friend to my house', better: 'invited a friend over', note: '"over" carries the target.' },
    { target: 'plan on', used: true, quality: 'natural', mine: 'plan on going', better: 'plan on going', note: 'SHOULD NOT RENDER' },
    { target: 'turn down', used: true, quality: 'natural', mine: 'turned it down', better: 'turned it down', note: null },
    { target: 'catch up', used: false, quality: null, mine: null, better: 'We should catch up soon.', note: 'target missing' },
  ],
  {
    summary: 'Close — two targets need work.',
    rewriteNeeded: true,
    rewrite: 'Yesterday I invited a friend over so we could catch up.',
  }
);

describe('TranslationPracticeSession Component', () => {
  const dummyCards = [
    { improvementId: 'c1', construction: 'invite over', improved: 'I invited him over' },
    { improvementId: 'c2', construction: 'plan on', improved: 'I plan on going' },
    { improvementId: 'c3', construction: 'turn down', improved: 'turned down the offer' },
    { improvementId: 'c4', construction: 'catch up', improved: 'caught up with him' },
    { improvementId: 'c5', construction: 'look forward to', improved: 'looking forward to it' },
  ];

  const eightCards = [
    ...dummyCards,
    { improvementId: 'c6', construction: 'get around to', improved: 'got around to it' },
    { improvementId: 'c7', construction: 'come up with', improved: 'came up with an idea' },
    { improvementId: 'c8', construction: 'run into', improved: 'ran into him' },
  ];

  const dummySettings = { openaiApiKey: 'sk_test' };

  const getTextarea = () => screen.getByPlaceholderText(/Type or speak your English translation/i);

  const waitForPassage = () =>
    waitFor(() => expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument());

  const renderSession = (cards = dummyCards) =>
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={cards} settings={dummySettings} />
      </MemoryRouter>
    );

  const submitTranslation = (text) => {
    fireEvent.change(getTextarea(), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));
  };

  const findUserBubble = (text) =>
    screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);

  beforeEach(() => {
    mocks.generateTranslationRoundPassage.mockReset();
    mocks.evaluateTranslationRound.mockReset();
    mocks.generateTranslationRoundPassage.mockResolvedValue(PASSAGE);
    mocks.evaluateTranslationRound.mockResolvedValue(NATURAL_VERDICT);
    mocks.dictation.transcription = 'invited him over';
  });

  it('renders translation practice header and initial tagged Russian passage', async () => {
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Round 1 of/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Round/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finish Practice/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    });
  });

  it('advances 5 fallback cards as two 2-construction rounds via Next Round', async () => {
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    await waitForPassage();
    // Round 1 uses the first 2 queued constructions.
    expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(1);
    expect(mocks.generateTranslationRoundPassage.mock.calls[0][0].map((c) => c.construction)).toEqual([
      'invite over',
      'plan on',
    ]);

    submitTranslation('Yesterday I invited a friend over and we plan on meeting.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitFor(() => expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(2));
    expect(mocks.generateTranslationRoundPassage.mock.calls[1][0].map((c) => c.construction)).toEqual([
      'turn down',
      'catch up',
    ]);
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/of \d/i)).not.toBeInTheDocument();
  });

  it('passes ordered per-round payload and distinct practiced cards to onFinish', async () => {
    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} onFinish={onFinishMock} />
      </MemoryRouter>
    );

    await waitForPassage();
    submitTranslation('First translation here.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitFor(() => expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(2));
    submitTranslation('Second translation here.');
    await waitFor(() => expect(screen.getAllByTestId('translation-verdict')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: /Finish Practice/i }));

    expect(onFinishMock).toHaveBeenCalledTimes(1);
    const [orderedRounds, practiced] = onFinishMock.mock.calls[0];
    expect(orderedRounds).toHaveLength(2);
    expect(orderedRounds[0]).toMatchObject({
      roundIndex: 0,
      translationText: 'First translation here.',
    });
    expect(orderedRounds[0].passageText).toContain('пригласил друга в гости');
    expect(orderedRounds[0].cards.map((c) => c.construction)).toEqual(['invite over', 'plan on']);
    expect(orderedRounds[1]).toMatchObject({
      roundIndex: 1,
      translationText: 'Second translation here.',
    });
    expect(orderedRounds[1].cards.map((c) => c.construction)).toEqual(['turn down', 'catch up']);
    expect(practiced.map((c) => c.construction)).toEqual([
      'invite over',
      'plan on',
      'turn down',
      'catch up',
    ]);
  });

  it('calls onFinish with empty payload when Finish Practice is clicked with no rounds', async () => {
    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} onFinish={onFinishMock} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    });

    const finishBtn = screen.getByRole('button', { name: /Finish Practice/i });
    fireEvent.click(finishBtn);

    expect(onFinishMock).toHaveBeenCalledWith([], []);
  });

  it('offers a multi-line text area for the translation instead of a one-row input', async () => {
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('rows')).toBe('3');
  });

  it('keeps the line breaks of a passage-length translation in the submitted message', async () => {
    renderSession();
    await waitForPassage();

    const translation = 'Yesterday I invited a friend over.\nThen we caught up for an hour.';
    submitTranslation(translation);

    await waitFor(() => expect(mocks.evaluateTranslationRound).toHaveBeenCalled());
    expect(findUserBubble(translation)).toBeInTheDocument();
  });

  it('does not translate on a plain Enter but does on Ctrl/Cmd+Enter', async () => {
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'Yesterday I invited a friend over.' } });

    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(mocks.evaluateTranslationRound).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Yesterday I invited a friend over.');

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(mocks.evaluateTranslationRound).toHaveBeenCalledTimes(1));
    expect(textarea).toHaveValue('');
  });

  it('inserts dictated speech at the caret and submits both parts', async () => {
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'Yesterday I home' } });
    textarea.setSelectionRange(12, 12);

    fireEvent.click(screen.getByRole('button', { name: /Simulate dictation/i }));
    expect(textarea).toHaveValue('Yesterday I invited him over home');

    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));

    await waitFor(() => expect(mocks.evaluateTranslationRound).toHaveBeenCalled());
    expect(findUserBubble('Yesterday I invited him over home')).toBeInTheDocument();
  });

  it('neither sends nor clears a whitespace-only translation', async () => {
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: /Translate/i })).toBeDisabled();
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(mocks.evaluateTranslationRound).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('   ');
  });

  it('shows the submitted translation immediately and an evaluating state until the verdict lands', async () => {
    let resolveVerdict;
    mocks.evaluateTranslationRound.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVerdict = resolve;
      })
    );

    renderSession();
    await waitForPassage();
    submitTranslation('Yesterday I invited a friend over.');

    expect(findUserBubble('Yesterday I invited a friend over.')).toBeInTheDocument();
    expect(screen.getByTestId('evaluating-indicator')).toBeInTheDocument();

    await act(async () => {
      resolveVerdict(NATURAL_VERDICT);
    });

    await waitFor(() => expect(screen.queryByTestId('evaluating-indicator')).not.toBeInTheDocument());
    expect(mocks.evaluateTranslationRound).toHaveBeenCalledTimes(1);
  });

  it('still renders the passage with construction badges while the verdict renders as a card', async () => {
    renderSession();
    await waitForPassage();
    expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    expect(screen.getByText('(invite over)')).toBeInTheDocument();

    submitTranslation('Yesterday I invited a friend over and we caught up.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());
    expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
  });

  it('renders one coverage badge per round target and no rewrite when everything is natural', async () => {
    renderSession();
    await waitForPassage();
    submitTranslation('Yesterday I invited a friend over, planned on staying and caught up.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    const badges = screen.getAllByTestId('verdict-target');
    expect(badges.map((b) => b.getAttribute('data-state'))).toEqual([
      'natural',
      'natural',
      'natural',
      'natural',
    ]);
    expect(badges.map((b) => b.textContent.replace('✓', ''))).toEqual([
      'invite over',
      'plan on',
      'turn down',
      'catch up',
    ]);

    expect(screen.queryByText(/Natural version of your sentence/i)).not.toBeInTheDocument();
    expect(screen.queryByText('SHOULD NOT RENDER')).not.toBeInTheDocument();
  });

  it('shows a rewrite and notes only for the awkward and missing targets', async () => {
    mocks.evaluateTranslationRound.mockResolvedValueOnce(PROBLEM_VERDICT);

    renderSession();
    await waitForPassage();
    submitTranslation('Yesterday I invited a friend to my house.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    expect(screen.getAllByTestId('verdict-target').map((b) => b.getAttribute('data-state'))).toEqual([
      'awkward',
      'natural',
      'natural',
      'missing',
    ]);

    expect(screen.getByText(/Natural version of your sentence/i)).toBeInTheDocument();
    expect(
      screen.getByText('Yesterday I invited a friend over so we could catch up.')
    ).toBeInTheDocument();
    expect(screen.getByText('"over" carries the target.')).toBeInTheDocument();
    expect(screen.getByText('target missing')).toBeInTheDocument();
    expect(screen.getByText('We should catch up soon.')).toBeInTheDocument();
    expect(screen.queryByText('SHOULD NOT RENDER')).not.toBeInTheDocument();
  });

  it('falls back to the raw feedback with a retry when the verdict cannot be interpreted', async () => {
    mocks.evaluateTranslationRound.mockResolvedValueOnce('Your translation reads naturally to me.');

    renderSession();
    await waitForPassage();
    submitTranslation('Yesterday I invited a friend over.');

    await waitFor(() =>
      expect(screen.getByText('Your translation reads naturally to me.')).toBeInTheDocument()
    );
    expect(screen.getByText(/Structured evaluation unavailable/i)).toBeInTheDocument();

    mocks.evaluateTranslationRound.mockResolvedValueOnce(NATURAL_VERDICT);
    fireEvent.click(screen.getByRole('button', { name: /Retry evaluation/i }));

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());
    expect(mocks.evaluateTranslationRound).toHaveBeenCalledTimes(2);
  });

  it('sends verdict-free history to the next round passage request', async () => {
    renderSession(eightCards);
    await waitForPassage();
    submitTranslation('Yesterday I invited a friend over.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitFor(() => expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(2));

    const history = mocks.generateTranslationRoundPassage.mock.calls[1][2];
    expect(history.length).toBeGreaterThan(0);
    expect(history.every((m) => Object.keys(m).sort().join(',') === 'content,role')).toBe(true);
    expect(JSON.stringify(history)).not.toContain('verdict');
  });

  it('requests the round passage once under StrictMode', async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
        </MemoryRouter>
      </StrictMode>
    );

    await waitForPassage();
    expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(1);
  });
});
