import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExplainPracticeModal from '../components/ExplainPracticeModal';

vi.mock('../services/aiService', () => ({
  getSentenceDeepStudy: vi.fn(),
  generateAdditionalSentenceExamples: vi.fn(),
  evaluatePracticeExercise: vi.fn(),
}));

vi.mock('../components/AudioPlayerButton', () => ({
  default: ({ text }) => <button data-testid="audio-btn" aria-label={`Listen to ${text}`}>Audio</button>,
}));

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button data-testid="mock-audio-recorder" onClick={() => onTranscribed('spoken input')}>
      Mic
    </button>
  ),
}));

import {
  getSentenceDeepStudy,
  generateAdditionalSentenceExamples,
  evaluatePracticeExercise,
} from '../services/aiService';

describe('ExplainPracticeModal Component', () => {
  const mockSentence = { ru: 'У меня болит голова.', en: 'I have a headache.' };
  const mockSettings = { level: 'intermediate', formality: 'casual' };

  const mockDeepStudyData = {
    explanation: {
      overallMeaning: 'Expresses that the speaker currently has a headache.',
      nuances: 'Literal meaning is "At me aches head".',
      vocabulary: [
        { term: 'болит', role: 'verb', caseOrAspect: 'imperfective', meaning: 'aches', note: 'singular' },
        { term: 'голова', role: 'noun', caseOrAspect: 'nominative', meaning: 'head', note: 'subject' },
      ],
      usage: {
        formality: 'neutral',
        context: 'Everyday medical or conversational situations.',
      },
    },
    examples: [
      { ru: 'У тебя болит голова?', en: 'Do you have a headache?', contextType: 'Question' },
      { ru: 'У него не болит голова.', en: 'He does not have a headache.', contextType: 'Negation' },
    ],
    practice: {
      translation: {
        prompt: 'Do you have a headache?',
        reference: 'У тебя болит голова?',
        direction: 'en-ru',
        hint: 'Use informal you',
      },
      cloze: {
        sentenceWithBlank: 'У меня _____ голова.',
        blankTarget: 'болит',
        promptTranslation: 'I have a headache.',
        targetLanguage: 'ru',
        hint: 'verb for ache',
      },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    getSentenceDeepStudy.mockResolvedValue(mockDeepStudyData);
    generateAdditionalSentenceExamples.mockResolvedValue([
      { ru: 'Почему болит голова?', en: 'Why does your head ache?', contextType: 'Why question' },
    ]);
    evaluatePracticeExercise.mockResolvedValue({
      isAccurate: true,
      verdict: 'natural',
      naturalRewrite: 'У тебя болит голова?',
      explanation: 'Accurate and natural.',
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExplainPracticeModal
        isOpen={false}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('fetches deep study package and renders Explanation tab by default', async () => {
    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
      />
    );

    expect(screen.getByText(/Analyzing sentence nuances/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('tab-explanation')).toBeInTheDocument();
    });

    expect(screen.getByText('Expresses that the speaker currently has a headache.')).toBeInTheDocument();
    expect(screen.getByText('Literal meaning is "At me aches head".')).toBeInTheDocument();
    expect(screen.getByText('болит')).toBeInTheDocument();
    expect(screen.getByText('голова')).toBeInTheDocument();
    expect(screen.getByText('Everyday medical or conversational situations.')).toBeInTheDocument();
    expect(getSentenceDeepStudy).toHaveBeenCalledWith(mockSentence, mockSettings, 'ru-en');
  });

  it('uses cached data without re-fetching from AI service', async () => {
    const cache = new Map();
    const cacheKey = `${mockSentence.ru}::${mockSentence.en}::ru-en`;
    cache.set(cacheKey, mockDeepStudyData);

    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
        cache={cache}
      />
    );

    expect(screen.getByTestId('tab-explanation')).toBeInTheDocument();
    expect(getSentenceDeepStudy).not.toHaveBeenCalled();
  });

  it('isolates cache and passes direction to deep study', async () => {
    const cache = new Map();
    cache.set(`${mockSentence.ru}::${mockSentence.en}::ru-en`, mockDeepStudyData);

    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
        cache={cache}
        direction="en-ru"
      />
    );

    expect(getSentenceDeepStudy).toHaveBeenCalledWith(mockSentence, mockSettings, 'en-ru');
  });

  it('switches to Examples tab and generates more examples', async () => {
    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-explanation')).toBeInTheDocument();
    });

    // Switch to Examples tab
    fireEvent.click(screen.getByRole('button', { name: /Examples/i }));

    expect(screen.getByTestId('tab-examples')).toBeInTheDocument();
    expect(screen.getByText(/У тебя болит голова\?/i)).toBeInTheDocument();
    expect(screen.getByText(/He does not have a headache/i)).toBeInTheDocument();

    // Click Generate More Examples
    const moreBtn = screen.getByRole('button', { name: /Generate More Examples/i });
    fireEvent.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByText(/Почему болит голова\?/i)).toBeInTheDocument();
    });
    expect(generateAdditionalSentenceExamples).toHaveBeenCalledTimes(1);
  });

  it('switches to Practice tab, handles cloze and translation exercises with evaluation and retry', async () => {
    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={vi.fn()}
        sentence={mockSentence}
        settings={mockSettings}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-explanation')).toBeInTheDocument();
    });

    // Switch to Practice tab
    fireEvent.click(screen.getByRole('button', { name: /Practice/i }));
    expect(screen.getByTestId('tab-practice')).toBeInTheDocument();

    // Test microphone speech input
    const micBtn = screen.getByTestId('mock-audio-recorder');
    fireEvent.click(micBtn);

    const textarea = screen.getByPlaceholderText(/Type your translation/i);
    expect(textarea.value).toBe('spoken input');

    // Submit translation
    const checkBtn = screen.getByRole('button', { name: /Check Answer/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verdict: natural/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Accurate and natural.')).toBeInTheDocument();

    // Click Retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    expect(screen.queryByText(/Verdict: natural/i)).toBeNull();

    // Toggle to Cloze exercise
    const clozeTabBtn = screen.getByRole('button', { name: /Fill in the Blank/i });
    fireEvent.click(clozeTabBtn);

    expect(screen.getByText('"У меня _____ голова."')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <ExplainPracticeModal
        isOpen={true}
        onClose={handleClose}
        sentence={mockSentence}
        settings={mockSettings}
      />
    );

    const closeBtn = screen.getByTitle('Close modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
