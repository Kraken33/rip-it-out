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

vi.mock('../components/AudioPlayerButton', () => ({
  default: ({ text }) => <button data-testid="audio-btn" aria-label={`Listen to ${text}`}>Audio</button>,
}));

vi.mock('../components/ExplainPracticeModal', () => ({
  default: ({ isOpen, onClose, sentence }) =>
    isOpen ? (
      <div data-testid="mock-explain-practice-modal">
        <span>Modal for {sentence?.ru}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

import { fetchManythingsPage } from '../services/manythingsService';
import {
  getFrequencyProgress,
  saveFrequencyProgress,
  saveFrequencySentenceToSrs,
  getSettings,
} from '../store';

describe('FrequencyPracticeSession Component', () => {
  const mockSentences = [
    { id: '1_10', enId: '1', ruId: '10', ru: 'Иди сюда.', en: 'Come here.', page: 1 },
    { id: '2_20', enId: '2', ruId: '20', ru: 'Подожди.', en: 'Wait.', page: 1 },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
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

  it('reveals translation, shows Explain & Practice button, and allows direction toggling', async () => {
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
    expect(screen.getByRole('button', { name: /Explain & Practice/i })).toBeInTheDocument();

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

  it('rates Hard: saves to SRS with rating 2 and advances immediately to sentence 2 without forced drill', async () => {
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
    fireEvent.click(screen.getByText(/Hard/i));

    await waitFor(() => {
      expect(saveFrequencySentenceToSrs).toHaveBeenCalledWith(mockSentences[0], 2);
      expect(saveFrequencyProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          sentenceIndex: 1,
          completedCount: 1,
          savedCount: 1,
        })
      );
    });

    // Directly advances to next sentence
    await waitFor(() => {
      expect(screen.getByText(/"Подожди."/i)).toBeInTheDocument();
    });
  });

  it('rates Again: saves to SRS with rating 1 and advances immediately to sentence 2', async () => {
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
    fireEvent.click(screen.getByText(/Again/i));

    await waitFor(() => {
      expect(saveFrequencySentenceToSrs).toHaveBeenCalledWith(mockSentences[0], 1);
      expect(saveFrequencyProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          sentenceIndex: 1,
          completedCount: 1,
          savedCount: 1,
        })
      );
    });

    // Directly advances to next sentence
    await waitFor(() => {
      expect(screen.getByText(/"Подожди."/i)).toBeInTheDocument();
    });
  });

  it('opens Explain & Practice modal on click and closes it cleanly', async () => {
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Reveal Translation/i));

    const explainBtn = screen.getByRole('button', { name: /Explain & Practice/i });
    fireEvent.click(explainBtn);

    expect(screen.getByTestId('mock-explain-practice-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal for Иди сюда.')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('mock-explain-practice-modal')).toBeNull();
  });

  it('renders unified PracticeHeader with active Frequency Sentences tab and jump page modal', async () => {
    render(
      <MemoryRouter>
        <FrequencyPracticeSession />
      </MemoryRouter>
    );

    expect(screen.getByTestId('practice-header')).toBeInTheDocument();
    expect(screen.getByTestId('tab-frequency-active')).toHaveTextContent('Frequency Sentences');
    expect(screen.getByTestId('tab-translation-inactive')).toHaveTextContent('Translation Practice');

    await waitFor(() => {
      expect(screen.getByText(/"Иди сюда."/i)).toBeInTheDocument();
    });

    // Jump page modal
    const jumpBtn = screen.getByTestId('jump-page-button');
    fireEvent.click(jumpBtn);
    expect(screen.getByText('Jump to Manythings Page')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('e.g. 1');
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Load Page/i }));

    await waitFor(() => {
      expect(fetchManythingsPage).toHaveBeenCalledWith(4);
    });
  });
});
