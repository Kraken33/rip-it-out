import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FrequencyPracticeSession from '../screens/FrequencyPracticeSession';

vi.mock('../services/manythingsService', () => ({
  fetchManythingsPage: vi.fn(),
}));

vi.mock('../store', () => ({
  getFrequencyProgress: vi.fn(),
  saveFrequencyProgress: vi.fn(),
  saveFrequencySentenceToSrs: vi.fn(),
  getSettings: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('../services/aiService', () => ({
  generateFrequencyMiniDrill: vi.fn(),
  evaluateFrequencyMiniDrill: vi.fn(),
}));

vi.mock('../components/AudioPlayerButton', () => ({
  default: ({ text }) => <button data-testid="audio-btn" aria-label={`Listen to ${text}`}>Audio</button>,
}));

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button data-testid="mock-audio-recorder" onClick={() => onTranscribed('spoken answer')}>
      Mic
    </button>
  ),
}));

import { fetchManythingsPage } from '../services/manythingsService';
import {
  getFrequencyProgress,
  saveFrequencyProgress,
  saveFrequencySentenceToSrs,
  getSettings,
} from '../store';
import {
  generateFrequencyMiniDrill,
  evaluateFrequencyMiniDrill,
} from '../services/aiService';

describe('FrequencyPracticeSession Component', () => {
  const mockSentences = [
    { id: '1_10', enId: '1', ruId: '10', ru: 'Иди сюда.', en: 'Come here.', page: 1 },
    { id: '2_20', enId: '2', ruId: '20', ru: 'Подожди.', en: 'Wait.', page: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ level: 'intermediate', formality: 'casual' });
    getFrequencyProgress.mockReturnValue({
      page: 1,
      sentenceIndex: 0,
      completedCount: 0,
      skippedCount: 0,
      savedCount: 0,
    });
    fetchManythingsPage.mockResolvedValue(mockSentences);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and streams sentences from Manythings', async () => {
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    expect(screen.getByText(/Streaming frequency sentences from Manythings/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    expect(fetchManythingsPage).toHaveBeenCalledWith(1);
    expect(screen.getByText(/Reveal Translation/i)).toBeInTheDocument();
  });

  it('reveals translation and allows direction toggling', async () => {
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    // Reveal translation
    fireEvent.click(screen.getByText(/Reveal Translation/i));

    expect(screen.getByText(/"Come here."/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy/i)).toBeInTheDocument();
    expect(screen.getByText(/Good/i)).toBeInTheDocument();
    expect(screen.getByText(/Hard/i)).toBeInTheDocument();
    expect(screen.getByText(/Again/i)).toBeInTheDocument();

    // Toggle direction
    const toggleBtn = screen.getByText(/RU →.*EN/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/EN →.*RU/i)).toBeInTheDocument();
  });

  it('rates Easy: skips without saving to SRS and advances to sentence 2', async () => {
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Reveal Translation/i));
    fireEvent.click(screen.getByText(/Easy/i));

    expect(saveFrequencySentenceToSrs).not.toHaveBeenCalled();
    expect(saveFrequencyProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        sentenceIndex: 1,
        completedCount: 1,
        skippedCount: 1,
      })
    );

    // Should now show second sentence
    await waitFor(() => {
      expect(screen.getByText(/"Подожди."/i)).toBeInTheDocument();
    });
  });

  it('rates Good: saves to SRS and advances directly to sentence 2', async () => {
    saveFrequencySentenceToSrs.mockResolvedValueOnce({});
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Reveal Translation/i));
    fireEvent.click(screen.getByText(/Good/i));

    await waitFor(() => {
      expect(saveFrequencySentenceToSrs).toHaveBeenCalledWith(mockSentences[0], 3);
      expect(saveFrequencyProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          sentenceIndex: 1,
          completedCount: 1,
          savedCount: 1,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/"Подожди."/i)).toBeInTheDocument();
    });
  });

  it('rates Hard: launches interactive mini-drill loop with AI', async () => {
    saveFrequencySentenceToSrs.mockResolvedValueOnce({});
    generateFrequencyMiniDrill.mockResolvedValueOnce({
      ru: 'Иди быстрее.',
      en: 'Come quicker.',
      hint: 'Comparative adverb',
    });
    evaluateFrequencyMiniDrill.mockResolvedValueOnce({
      isAccurate: true,
      verdict: 'natural',
      naturalRewrite: 'Come faster.',
      explanation: 'Great translation!',
    });

    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Reveal Translation/i));
    fireEvent.click(screen.getByText(/Hard/i));

    await waitFor(() => {
      expect(saveFrequencySentenceToSrs).toHaveBeenCalledWith(mockSentences[0], 2);
      expect(screen.getByTestId('interactive-mini-drill')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/"Иди быстрее."/i)).toBeInTheDocument();
      expect(screen.getByText(/Comparative adverb/i)).toBeInTheDocument();
    });

    // Type translation
    const textarea = screen.getByPlaceholderText(/Type your English translation/i);
    fireEvent.change(textarea, { target: { value: 'Come quicker.' } });

    const submitBtn = screen.getByText(/Check Translation/i);
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(evaluateFrequencyMiniDrill).toHaveBeenCalled();
      expect(screen.getByText(/Verdict: natural/i)).toBeInTheDocument();
      expect(screen.getByText(/"Come faster."/i)).toBeInTheDocument();
      expect(screen.getByText(/Great translation!/i)).toBeInTheDocument();
    });

    // Continue to next sentence
    fireEvent.click(screen.getByText(/Continue to Next Sentence/i));

    await waitFor(() => {
      expect(screen.getByText(/"Подожди."/i)).toBeInTheDocument();
    });
  });

  it('allows speech transcription in mini-drill via AudioRecorder', async () => {
    generateFrequencyMiniDrill.mockResolvedValueOnce({
      ru: 'Иди быстрее.',
      en: 'Come quicker.',
      hint: '',
    });

    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Reveal Translation/i));
    fireEvent.click(screen.getByText(/Again/i));

    await waitFor(() => {
      expect(screen.getByText(/"Иди быстрее."/i)).toBeInTheDocument();
    });

    // Click mic button
    fireEvent.click(screen.getByTestId('mock-audio-recorder'));

    const textarea = screen.getByPlaceholderText(/Type your English translation/i);
    expect(textarea.value).toBe('spoken answer');
  });
});
