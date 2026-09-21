import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SeamlessChatSession from '../screens/SeamlessChatSession';
import SeamlessChatViewerModal from '../screens/SeamlessChatViewerModal';
import ConversationViewerModal from '../screens/ConversationViewerModal';

// Mock dependencies
vi.mock('../store', () => ({
  addImprovements: vi.fn().mockResolvedValue([]),
  updateSession: vi.fn().mockResolvedValue({}),
  logActivity: vi.fn().mockResolvedValue({}),
  addSessionText: vi.fn().mockResolvedValue({}),
  countTextWords: vi.fn().mockReturnValue({ totalWords: 10, uniqueWords: 8, vocabularyDensity: 0.8 }),
}));

vi.mock('../services/aiService', () => ({
  streamSeamlessChatCompletion: vi.fn().mockImplementation(async (session, messages, settings, onChunk) => {
    if (onChunk) onChunk('Hello! That sounds fascinating.');
    return 'Hello! That sounds fascinating.';
  }),
  evaluateSingleMessage: vi.fn().mockResolvedValue({
    improvements: [
      {
        construction: 'Simple Past Irregular',
        original: 'readed',
        improved: 'read',
        explanation: 'Past tense of read is pronounced red.',
        category: 'grammar',
        spoken_frequency: 'high',
        context: 'I readed chapter 3',
      },
    ],
  }),
  transcribeAudio: vi.fn().mockResolvedValue('Transcribed audio text'),
}));

describe('SeamlessChatSession Component', () => {
  const dummySession = {
    id: 's_test_1',
    title: 'Atomic Habits Chapter 3',
    sourceType: 'book',
    messages: [],
  };

  const dummySettings = {
    groqApiKey: 'gsk_test',
    formality: 'casual',
  };

  it('renders initial session header and welcome prompt', async () => {
    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Seamless AI Coach/i)).toBeInTheDocument();
    expect(screen.getAllByText(/"Atomic Habits Chapter 3"/i)[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Hi there! Tell me about the book/i)).toBeInTheDocument();
    });
  });

  it('sends user input and receives assistant response', async () => {
    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Speak above or type your answer/i);
    fireEvent.change(input, { target: { value: 'I learned that small habits compound over time.' } });

    const sendBtn = screen.getByRole('button', { name: /Send ▶/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('I learned that small habits compound over time.')).toBeInTheDocument();
      expect(screen.getByText('Hello! That sounds fascinating.')).toBeInTheDocument();
    });
  });
});

describe('SeamlessChatViewerModal Component', () => {
  const chatSession = {
    id: 's_test_2',
    title: 'Podcast Summary',
    sourceType: 'podcast',
    messages: [
      { id: 'm1', role: 'user', content: 'I readed chapter 3', isImproved: true, improvements: [{ original: 'readed', improved: 'read', explanation: 'past tense' }] },
      { id: 'm2', role: 'assistant', content: 'Great job!' },
    ],
  };

  it('renders chat thread transcript in modal', () => {
    render(<SeamlessChatViewerModal session={chatSession} onClose={vi.fn()} />);

    expect(screen.getByText(/Seamless Chat: Podcast Summary/i)).toBeInTheDocument();
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });

  it('delegates from ConversationViewerModal when session contains messages', () => {
    render(<ConversationViewerModal session={chatSession} onClose={vi.fn()} />);

    expect(screen.getByText(/Seamless Chat: Podcast Summary/i)).toBeInTheDocument();
  });
});
