import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TranslationStorySession, {
  aggregateStoryConstructions,
} from '../screens/TranslationStorySession';

const mocks = vi.hoisted(() => ({
  generateTranslationStoryPassage: vi.fn(),
  evaluateTranslationStory: vi.fn(),
}));

vi.mock('../services/aiService', () => ({
  generateTranslationStoryPassage: mocks.generateTranslationStoryPassage,
  evaluateTranslationStory: mocks.evaluateTranslationStory,
  transcribeAudio: vi.fn().mockResolvedValue('dictated text'),
}));

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button type="button" onClick={() => onTranscribed('dictated text')}>
      Simulate dictation
    </button>
  ),
}));

const PASSAGE_1 = 'Вчера я пригласил друга в гости, и мы долго болтали.';
const PASSAGE_2 = 'Сегодня утром я опоздал на автобус.';

const buildFeedback = (constructions, { summary = 'Nice work.', improvedVersion = '' , alreadyNatural } = {}) =>
  JSON.stringify({
    feedback: {
      summary,
      improved_version: improvedVersion,
      ...(alreadyNatural !== undefined ? { already_natural: alreadyNatural } : {}),
      constructions,
    },
  });

const IMPROVED_FEEDBACK = buildFeedback(
  [
    {
      construction: 'invite [someone] over',
      original: 'invited a friend to my house',
      improved: 'invited a friend over',
      explanation: '"over" is the natural phrasing for casual visits.',
      category: 'collocation',
      spoken_frequency: 'very_high',
    },
  ],
  { improvedVersion: 'Yesterday I invited a friend over and we talked for ages.' }
);

const NATURAL_FEEDBACK = buildFeedback(
  [
    {
      construction: 'run into [someone]',
      original: 'met him by chance',
      improved: 'ran into him',
      explanation: 'everyday phrasal verb',
      category: 'vocabulary',
      spoken_frequency: 'high',
    },
  ],
  { improvedVersion: '', alreadyNatural: true, summary: 'Sounds natural already.' }
);

describe('aggregateStoryConstructions', () => {
  const entry = (construction, improved = 'x') => ({
    construction,
    original: 'o',
    improved,
    explanation: 'e',
    category: 'vocabulary',
    spoken_frequency: 'high',
  });

  it('flattens constructions across rounds in order', () => {
    const rounds = [
      { feedback: { constructions: [entry('a'), entry('b')] } },
      { feedback: { constructions: [entry('c')] } },
    ];
    expect(aggregateStoryConstructions(rounds).map((c) => c.construction)).toEqual(['a', 'b', 'c']);
  });

  it('dedupes case-insensitively, keeping the earliest round entry', () => {
    const rounds = [
      { feedback: { constructions: [entry('Invite over', 'first')] } },
      { feedback: { constructions: [entry('invite over', 'second')] } },
    ];
    const result = aggregateStoryConstructions(rounds);
    expect(result).toHaveLength(1);
    expect(result[0].improved).toBe('first');
  });

  it('skips rounds without feedback and entries without a construction', () => {
    const rounds = [
      { passage: 'p', translation: 't' },
      { feedback: { constructions: [{ original: 'x', improved: '' }, entry('ok')] } },
    ];
    expect(aggregateStoryConstructions(rounds).map((c) => c.construction)).toEqual(['ok']);
  });

  it('caps the aggregate at maxImprovements', () => {
    const rounds = [
      { feedback: { constructions: [entry('a'), entry('b')] } },
      { feedback: { constructions: [entry('c'), entry('d')] } },
    ];
    expect(aggregateStoryConstructions(rounds, 3).map((c) => c.construction)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('TranslationStorySession Component', () => {
  const dummySession = { id: 's1', title: 'My Day' };
  const dummySettings = { openaiApiKey: 'sk_test', maxImprovements: 10 };

  const getTextarea = () =>
    screen.getByPlaceholderText(/Type or speak your English translation/i);

  const waitForPassage = (text = PASSAGE_1) =>
    waitFor(() => expect(screen.getByText(new RegExp(text.slice(0, 20)))).toBeInTheDocument());

  const renderSession = (onFinish) =>
    render(
      <MemoryRouter>
        <TranslationStorySession session={dummySession} settings={dummySettings} onFinish={onFinish} />
      </MemoryRouter>
    );

  const submitTranslation = (text) => {
    fireEvent.change(getTextarea(), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));
  };

  beforeEach(() => {
    mocks.generateTranslationStoryPassage.mockReset();
    mocks.evaluateTranslationStory.mockReset();
    mocks.generateTranslationStoryPassage
      .mockResolvedValueOnce(PASSAGE_1)
      .mockResolvedValue(PASSAGE_2);
    mocks.evaluateTranslationStory.mockResolvedValue(IMPROVED_FEEDBACK);
  });

  it('generates the first story passage on mount', async () => {
    renderSession();

    expect(screen.getByRole('button', { name: /Next Round/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finish Story/i })).toBeInTheDocument();

    await waitForPassage();
    expect(mocks.generateTranslationStoryPassage).toHaveBeenCalledTimes(1);
    expect(mocks.generateTranslationStoryPassage).toHaveBeenCalledWith(
      dummySession,
      dummySettings,
      []
    );
  });

  it('submits a translation and renders the improved version with constructions', async () => {
    renderSession();
    await waitForPassage();

    submitTranslation('Yesterday I invited a friend to my house and we talked for a long time.');
    await waitFor(() => expect(screen.getByTestId('story-feedback')).toBeInTheDocument());

    expect(mocks.evaluateTranslationStory).toHaveBeenCalledWith(
      PASSAGE_1,
      'Yesterday I invited a friend to my house and we talked for a long time.',
      dummySettings
    );
    expect(
      screen.getByText(/Yesterday I invited a friend over and we talked for ages/)
    ).toBeInTheDocument();
    const constructions = screen.getAllByTestId('story-construction');
    expect(constructions).toHaveLength(1);
    expect(constructions[0]).toHaveTextContent('invite [someone] over');
    expect(constructions[0]).toHaveTextContent('collocation');
    expect(screen.getByText('Nice work.')).toBeInTheDocument();
  });

  it('shows an affirmation instead of a rewrite for already-natural translations', async () => {
    mocks.evaluateTranslationStory.mockResolvedValue(NATURAL_FEEDBACK);
    renderSession();
    await waitForPassage();

    submitTranslation('I ran into him yesterday.');
    await waitFor(() => expect(screen.getByTestId('story-feedback')).toBeInTheDocument());

    expect(screen.getByText(/Natural as-is/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fluent daily-speaking version/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('story-construction')).toHaveLength(1);
  });


  it('keeps the learner translation visible and offers a retry when feedback is unparsable', async () => {
    mocks.evaluateTranslationStory
      .mockResolvedValueOnce('not json at all')
      .mockResolvedValueOnce(IMPROVED_FEEDBACK);
    renderSession();
    await waitForPassage();

    submitTranslation('My translation attempt.');
    await waitFor(() => expect(screen.getByTestId('story-raw-feedback')).toBeInTheDocument());
    expect(screen.getByTestId('story-raw-feedback')).toHaveTextContent('not json at all');

    fireEvent.click(screen.getByRole('button', { name: /Retry Evaluation/i }));
    await waitFor(() => expect(screen.getByTestId('story-feedback')).toBeInTheDocument());
    expect(mocks.evaluateTranslationStory).toHaveBeenCalledTimes(2);
  });

  it('gates Next Round on a submitted translation and sends passage history for variety', async () => {
    renderSession();
    await waitForPassage();

    const nextButton = screen.getByRole('button', { name: /Next Round/i });
    expect(nextButton).toBeDisabled();

    submitTranslation('Yesterday I invited a friend over.');
    await waitFor(() => expect(screen.getByTestId('story-feedback')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Next Round/i }));
    await waitForPassage(PASSAGE_2);
    expect(mocks.generateTranslationStoryPassage).toHaveBeenCalledTimes(2);
    expect(mocks.generateTranslationStoryPassage).toHaveBeenLastCalledWith(
      dummySession,
      dummySettings,
      [PASSAGE_1]
    );
    expect(screen.getByText(/Round 1 · Story passage/)).toBeInTheDocument();
    expect(screen.getByText(/Round 2 · Story passage/)).toBeInTheDocument();
  });

  it('returns the completed rounds to onFinish', async () => {
    const onFinish = vi.fn();
    renderSession(onFinish);
    await waitForPassage();

    submitTranslation('Yesterday I invited a friend over.');
    await waitFor(() => expect(screen.getByTestId('story-feedback')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Finish Story/i }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    const rounds = onFinish.mock.calls[0][0];
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({
      passage: PASSAGE_1,
      translation: 'Yesterday I invited a friend over.',
    });
    expect(rounds[0].feedback.constructions).toHaveLength(1);
  });

  it('shows an error with a retry when passage generation fails', async () => {
    mocks.generateTranslationStoryPassage.mockReset();
    mocks.generateTranslationStoryPassage
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(PASSAGE_1);
    renderSession();

    await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^Retry$/i }));
    await waitForPassage();
    expect(mocks.generateTranslationStoryPassage).toHaveBeenCalledTimes(2);
  });
});

