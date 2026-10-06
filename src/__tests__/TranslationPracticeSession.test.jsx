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

    expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Round 1 of/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Round/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finish & Rate Recall →/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    });
  });

  it('advances candidate pool across rounds via Next Round', async () => {
    mocks.generateTranslationRoundPassage
      .mockResolvedValueOnce({
        picked: ['invite over', 'plan on'],
        passage: 'Вчера я [[пригласил друга в гости|invite over]] и мы [[планировали|plan on]].',
      })
      .mockResolvedValueOnce({
        picked: ['turn down', 'catch up'],
        passage: 'Он [[отказался|turn down]], но мы [[поболтали|catch up]].',
      });

    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument());
    // Round 1 receives the full pool of available cards (5 cards)
    expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(1);
    expect(mocks.generateTranslationRoundPassage.mock.calls[0][0].map((c) => c.construction)).toEqual([
      'invite over',
      'plan on',
      'turn down',
      'catch up',
      'look forward to',
    ]);

    submitTranslation('Yesterday I invited a friend over and we plan on meeting.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitFor(() => expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(2));
    // Round 2 receives the reduced candidate pool (3 remaining cards: turn down, catch up, look forward to)
    expect(mocks.generateTranslationRoundPassage.mock.calls[1][0].map((c) => c.construction)).toEqual([
      'turn down',
      'catch up',
      'look forward to',
    ]);
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/of \d/i)).not.toBeInTheDocument();
  });

  it('passes ordered per-round payload and distinct practiced cards to onFinish', async () => {
    mocks.generateTranslationRoundPassage
      .mockResolvedValueOnce({
        picked: ['invite over', 'plan on'],
        passage: 'Вчера я [[пригласил друга в гости|invite over]] и мы [[планировали|plan on]].',
      })
      .mockResolvedValueOnce({
        picked: ['turn down', 'catch up'],
        passage: 'Он [[отказался|turn down]], но мы [[поболтали|catch up]].',
      });

    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} onFinish={onFinishMock} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument());
    submitTranslation('First translation here.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitFor(() => expect(mocks.generateTranslationRoundPassage).toHaveBeenCalledTimes(2));
    submitTranslation('Second translation here.');
    await waitFor(() => expect(screen.getAllByTestId('translation-verdict')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: /Finish & Rate Recall/i }));

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

    const finishBtn = screen.getByRole('button', { name: /Finish & Rate Recall/i });
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

  it('renders interactive construction tags that reveal target construction on click', async () => {
    renderSession();
    await waitForPassage();
    expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    // Static inline label is NOT rendered by default
    expect(screen.queryByText('(invite over)')).not.toBeInTheDocument();

    // Click/tap the interactive construction
    const constrBtn = screen.getByRole('button', { name: /пригласил друга в гости/i });
    expect(constrBtn).toBeInTheDocument();
    fireEvent.click(constrBtn);

    // Target tooltip is revealed
    expect(screen.getByTestId('construction-tooltip')).toHaveTextContent('invite over');

    // Click again toggles it off
    fireEvent.click(constrBtn);
    expect(screen.queryByTestId('construction-tooltip')).not.toBeInTheDocument();

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

  it('renders responsive mobile container, streamlined header, and toolbar controls without chip bar', async () => {
    const { container } = renderSession();
    await waitForPassage();

    // Check container has dynamic dvh and sm:h-[82vh] classes
    const outerContainer = container.querySelector('.glass-panel');
    expect(outerContainer.className).toContain('h-[calc(100dvh-5.5rem)]');
    expect(outerContainer.className).toContain('sm:h-[82vh]');

    // Check round targets chip container is NOT present
    expect(screen.queryByText(/Round Targets:/i)).not.toBeInTheDocument();

    // Check top header is hidden on mobile (hidden sm:flex)
    const header = container.querySelector('.border-b');
    expect(header.className).toContain('hidden');
    expect(header.className).toContain('sm:flex');

    // Check desktop translate button is hidden on mobile
    const desktopTranslateBtn = screen.getByRole('button', { name: /Translate ▶/i });
    expect(desktopTranslateBtn.className).toContain('hidden');
    expect(desktopTranslateBtn.className).toContain('sm:inline-flex');
  });

  it('renders full-width composer with text-base font and resets scroll on focus', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('w-full');

    // Focus triggers instant window.scrollTo
    fireEvent.focus(textarea);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });

    expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Translate ▶/i })).toBeInTheDocument();
    expect(screen.getByTestId('toggle-mobile-practice-actions')).toBeInTheDocument();

    // Tap toggle to open mobile actions panel
    fireEvent.click(screen.getByTestId('toggle-mobile-practice-actions'));
    expect(screen.getByTestId('mobile-practice-actions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-practice-translate-button')).toBeInTheDocument();

    // Tap close
    fireEvent.click(screen.getByTestId('close-mobile-practice-actions'));
    expect(screen.queryByTestId('mobile-practice-actions-panel')).not.toBeInTheDocument();

    scrollToSpy.mockRestore();
  });

  it('submits translation via mobile actions HUD translate button', async () => {
    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'I invited a friend over.' } });

    // Open mobile actions panel
    fireEvent.click(screen.getByTestId('toggle-mobile-practice-actions'));
    const mobileTranslateBtn = screen.getByTestId('mobile-practice-translate-button');
    expect(mobileTranslateBtn).toBeInTheDocument();

    fireEvent.click(mobileTranslateBtn);

    // Panel closes and evaluation is triggered
    expect(screen.queryByTestId('mobile-practice-actions-panel')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('translation-verdict')).toBeInTheDocument();
    });
  });

  it('triggers auto-scroll to active practice passage when translation textarea is focused', async () => {
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    renderSession();
    await waitForPassage();

    const textarea = getTextarea();
    fireEvent.focus(textarea);

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });
});

