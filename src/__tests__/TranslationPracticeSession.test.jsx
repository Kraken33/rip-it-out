import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import TranslationPracticeSession from '../screens/TranslationPracticeSession';

const mocks = vi.hoisted(() => ({
  generateTranslationSentence: vi.fn(),
  evaluateTranslationRound: vi.fn(),
  dictation: { transcription: 'invited him over' },
}));

vi.mock('../services/aiService', () => ({
  generateTranslationSentence: mocks.generateTranslationSentence,
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

const SENTENCE = 'Вчера я пригласил друга в гости.';

const buildVerdict = (constructions, { summary = 'ok', rewriteNeeded = false, rewrite = '' } = {}) =>
  JSON.stringify({ verdict: { summary, rewrite_needed: rewriteNeeded, rewrite, constructions } });

const NATURAL_VERDICT = buildVerdict([
  {
    target: 'invite over',
    used: true,
    quality: 'natural',
    mine: 'invited a friend over',
    better: 'invited a friend over',
    note: 'SHOULD NOT RENDER',
  },
]);

const PROBLEM_VERDICT = buildVerdict(
  [
    {
      target: 'invite over',
      used: true,
      quality: 'awkward',
      mine: 'invited a friend to my house',
      better: 'invited a friend over',
      note: '"over" carries the target.',
    },
  ],
  {
    summary: 'Close — target needs work.',
    rewriteNeeded: true,
    rewrite: 'Yesterday I invited a friend over.',
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

  const dummySettings = { openaiApiKey: 'sk_test' };

  const getTextarea = () => screen.getByPlaceholderText(/Type or speak your English translation/i);

  const waitForSentence = (text = /пригласил друга в гости/i) =>
    waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());

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
    mocks.generateTranslationSentence.mockReset();
    mocks.evaluateTranslationRound.mockReset();
    mocks.generateTranslationSentence.mockResolvedValue(SENTENCE);
    mocks.evaluateTranslationRound.mockResolvedValue(NATURAL_VERDICT);
    mocks.dictation.transcription = 'invited him over';
  });

  it('renders translation practice header and initial Russian sentence', async () => {
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
      expect(screen.getByText(SENTENCE)).toBeInTheDocument();
    });
  });

  it('advances to next card in queue automatically when translation is natural', async () => {
    mocks.generateTranslationSentence
      .mockResolvedValueOnce('Вчера я пригласил друга в гости.')
      .mockResolvedValueOnce('Я планирую пойти в театр.');

    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    await waitForSentence();
    expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(1);
    expect(mocks.generateTranslationSentence).toHaveBeenCalledWith(dummyCards[0], dummySettings);

    submitTranslation('Yesterday I invited a friend over.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    // Immediately advances and calls generateTranslationSentence for the second card (plan on)
    await waitFor(() => expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(2));
    expect(mocks.generateTranslationSentence).toHaveBeenLastCalledWith(dummyCards[1], dummySettings);
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Я планирую пойти в театр.')).toBeInTheDocument());
  });

  it('retries same construction with fresh sentence when translation is awkward or missed', async () => {
    mocks.generateTranslationSentence
      .mockResolvedValueOnce('Вчера я пригласил друга в гости.')
      .mockResolvedValueOnce('Почему бы не позвать коллегу на обед?');
    mocks.evaluateTranslationRound.mockResolvedValueOnce(PROBLEM_VERDICT);

    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    await waitForSentence();
    expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(1);

    submitTranslation('Yesterday I invited a friend to my house.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    // Immediately generates a fresh sentence for the SAME card (dummyCards[0])
    await waitFor(() => expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(2));
    expect(mocks.generateTranslationSentence).toHaveBeenLastCalledWith(dummyCards[0], dummySettings);
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Почему бы не позвать коллегу на обед?')).toBeInTheDocument()
    );
  });

  it('advances to next card via manual Next Round button', async () => {
    mocks.generateTranslationSentence
      .mockResolvedValueOnce('Вчера я пригласил друга в гости.')
      .mockResolvedValueOnce('Я планирую пойти в театр.');

    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    await waitForSentence();
    expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));

    await waitFor(() => expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(2));
    expect(mocks.generateTranslationSentence).toHaveBeenLastCalledWith(dummyCards[1], dummySettings);
    expect(screen.getByText(/Round 2/i)).toBeInTheDocument();
  });

  it('passes ordered per-round payload and distinct practiced cards to onFinish', async () => {
    mocks.generateTranslationSentence
      .mockResolvedValueOnce('Вчера я пригласил друга в гости.')
      .mockResolvedValueOnce('Я планирую пойти в театр.');

    mocks.evaluateTranslationRound
      .mockResolvedValueOnce(NATURAL_VERDICT)
      .mockResolvedValueOnce(
        buildVerdict([
          {
            target: 'plan on',
            used: true,
            quality: 'natural',
            mine: 'I plan on going to the theater',
            better: '',
            note: null,
          },
        ])
      );

    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession
          allCards={dummyCards}
          settings={dummySettings}
          onFinish={onFinishMock}
        />
      </MemoryRouter>
    );

    await waitForSentence();
    submitTranslation('Yesterday I invited a friend over.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    // Second round automatically loaded
    await waitFor(() => expect(screen.getByText('Я планирую пойти в театр.')).toBeInTheDocument());
    submitTranslation('I plan on going to the theater.');
    await waitFor(() => expect(screen.getAllByTestId('translation-verdict')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: /Finish & Rate Recall/i }));

    expect(onFinishMock).toHaveBeenCalledTimes(1);
    const [orderedRounds, practiced] = onFinishMock.mock.calls[0];
    expect(orderedRounds).toHaveLength(2);
    expect(orderedRounds[0]).toMatchObject({
      roundIndex: 0,
      translationText: 'Yesterday I invited a friend over.',
    });
    expect(orderedRounds[0].passageText).toBe('Вчера я пригласил друга в гости.');
    expect(orderedRounds[0].cards.map((c) => c.construction)).toEqual(['invite over']);
    expect(orderedRounds[1]).toMatchObject({
      roundIndex: 1,
      translationText: 'I plan on going to the theater.',
    });
    expect(orderedRounds[1].cards.map((c) => c.construction)).toEqual(['plan on']);
    expect(practiced.map((c) => c.construction)).toEqual(['invite over', 'plan on']);
  });

  it('calls onFinish with empty payload when Finish Practice is clicked with no rounds', async () => {
    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession
          allCards={dummyCards}
          settings={dummySettings}
          onFinish={onFinishMock}
        />
      </MemoryRouter>
    );

    await waitForSentence();

    const finishBtn = screen.getByRole('button', { name: /Finish & Rate Recall/i });
    fireEvent.click(finishBtn);

    expect(onFinishMock).toHaveBeenCalledWith([], []);
  });

  it('calls generateTranslationSentence statelessly with 1 card and zero conversation history', async () => {
    renderSession();
    await waitForSentence();

    expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(1);
    expect(mocks.generateTranslationSentence).toHaveBeenCalledWith(dummyCards[0], dummySettings);
    // Verifies no history was passed
    expect(mocks.generateTranslationSentence.mock.calls[0].length).toBe(2);
  });

  it('renders natural Russian sentence directly without bracket annotations or spoiler tooltips', async () => {
    renderSession();
    await waitForSentence();

    expect(screen.getByText(SENTENCE)).toBeInTheDocument();
    // No interactive spoiler buttons or tooltips
    expect(screen.queryByTestId('interactive-construction')).not.toBeInTheDocument();
    expect(screen.queryByTestId('construction-tooltip')).not.toBeInTheDocument();
  });

  it('offers a multi-line text area for the translation instead of a one-row input', async () => {
    renderSession();
    await waitForSentence();

    const textarea = getTextarea();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('rows')).toBe('3');
  });

  it('keeps the line breaks of a passage-length translation in the submitted message', async () => {
    renderSession();
    await waitForSentence();

    const translation = 'Yesterday I invited a friend over.\nThen we caught up for an hour.';
    submitTranslation(translation);

    await waitFor(() => expect(mocks.evaluateTranslationRound).toHaveBeenCalled());
    expect(findUserBubble(translation)).toBeInTheDocument();
  });

  it('does not translate on a plain Enter but does on Ctrl/Cmd+Enter', async () => {
    renderSession();
    await waitForSentence();

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
    await waitForSentence();

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
    await waitForSentence();

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
    await waitForSentence();
    submitTranslation('Yesterday I invited a friend over.');

    expect(findUserBubble('Yesterday I invited a friend over.')).toBeInTheDocument();
    expect(screen.getByTestId('evaluating-indicator')).toBeInTheDocument();

    await act(async () => {
      resolveVerdict(NATURAL_VERDICT);
    });

    await waitFor(() => expect(screen.queryByTestId('evaluating-indicator')).not.toBeInTheDocument());
    expect(mocks.evaluateTranslationRound).toHaveBeenCalledTimes(1);
  });

  it('renders one coverage badge per round target and no rewrite when everything is natural', async () => {
    renderSession();
    await waitForSentence();
    submitTranslation('Yesterday I invited a friend over.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    const badges = screen.getAllByTestId('verdict-target');
    expect(badges.map((b) => b.getAttribute('data-state'))).toEqual(['natural']);
    expect(badges.map((b) => b.textContent.replace('✓', ''))).toEqual(['invite over']);

    expect(screen.queryByText(/Natural version of your sentence/i)).not.toBeInTheDocument();
    expect(screen.queryByText('SHOULD NOT RENDER')).not.toBeInTheDocument();
  });

  it('shows a rewrite and notes only for the awkward and missing targets', async () => {
    mocks.evaluateTranslationRound.mockResolvedValueOnce(PROBLEM_VERDICT);

    renderSession();
    await waitForSentence();
    submitTranslation('Yesterday I invited a friend to my house.');

    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    expect(screen.getAllByTestId('verdict-target').map((b) => b.getAttribute('data-state'))).toEqual([
      'awkward',
    ]);

    expect(screen.getByText(/Natural version of your sentence/i)).toBeInTheDocument();
    expect(screen.getByText('Yesterday I invited a friend over.')).toBeInTheDocument();
    expect(screen.getByText('"over" carries the target.')).toBeInTheDocument();
    expect(screen.queryByText('SHOULD NOT RENDER')).not.toBeInTheDocument();
  });

  it('falls back to the raw feedback with a retry when the verdict cannot be interpreted', async () => {
    mocks.evaluateTranslationRound.mockResolvedValueOnce('Your translation reads naturally to me.');

    renderSession();
    await waitForSentence();
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

  it('requests the round sentence once under StrictMode', async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
        </MemoryRouter>
      </StrictMode>
    );

    await waitForSentence();
    expect(mocks.generateTranslationSentence).toHaveBeenCalledTimes(1);
  });

  it('renders responsive mobile container, streamlined header, and toolbar controls without chip bar', async () => {
    const { container } = renderSession();
    await waitForSentence();

    const outerContainer = container.querySelector('.glass-panel');
    expect(outerContainer.className).toContain('h-[calc(100dvh-5.5rem)]');
    expect(outerContainer.className).toContain('sm:h-[82vh]');

    expect(screen.queryByText(/Round Targets:/i)).not.toBeInTheDocument();

    const header = container.querySelector('.border-b');
    expect(header.className).toContain('hidden');
    expect(header.className).toContain('sm:flex');

    const desktopTranslateBtn = screen.getByRole('button', { name: /Translate ▶/i });
    expect(desktopTranslateBtn.className).toContain('hidden');
    expect(desktopTranslateBtn.className).toContain('sm:inline-flex');
  });

  it('renders full-width composer with text-base font and resets scroll on focus', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderSession();
    await waitForSentence();

    const textarea = getTextarea();
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('w-full');

    fireEvent.focus(textarea);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });

    expect(screen.getByText(SENTENCE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Translate ▶/i })).toBeInTheDocument();
    expect(screen.getByTestId('toggle-mobile-practice-actions')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-mobile-practice-actions'));
    expect(screen.getByTestId('mobile-practice-actions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-practice-translate-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-mobile-practice-actions'));
    expect(screen.queryByTestId('mobile-practice-actions-panel')).not.toBeInTheDocument();

    scrollToSpy.mockRestore();
  });

  it('submits translation via mobile actions HUD translate button', async () => {
    renderSession();
    await waitForSentence();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: 'I invited a friend over.' } });

    fireEvent.click(screen.getByTestId('toggle-mobile-practice-actions'));
    const mobileTranslateBtn = screen.getByTestId('mobile-practice-translate-button');
    expect(mobileTranslateBtn).toBeInTheDocument();

    fireEvent.click(mobileTranslateBtn);

    expect(screen.queryByTestId('mobile-practice-actions-panel')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('translation-verdict')).toBeInTheDocument();
    });
  });

  it('triggers auto-scroll to active practice sentence when translation textarea is focused', async () => {
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    renderSession();
    await waitForSentence();

    const textarea = getTextarea();
    fireEvent.focus(textarea);

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('displays completion banner and disables input when all cards in queue are passed', async () => {
    const singleCard = [dummyCards[0]];
    renderSession(singleCard);
    await waitForSentence();

    submitTranslation('Yesterday I invited a friend over.');
    await waitFor(() => expect(screen.getByTestId('translation-verdict')).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByTestId('session-completed-banner')).toBeInTheDocument();
    });
    expect(screen.getByText(/All target constructions practiced!/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Session complete/i)).toBeDisabled();
  });
});
