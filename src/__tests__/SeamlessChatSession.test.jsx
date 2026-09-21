import { describe, it, expect, vi } from 'vitest';
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
  transcribeAudio: vi.fn().mockResolvedValue('Transcribed audio text'),
}));

vi.mock('../components/AudioPlayerButton', () => ({
  default: ({ text }) => <button aria-label="Listen to audio">{text}</button>,
}));

vi.mock('../services/audioPlayer', () => ({
  playText: vi.fn(),
  stopAudio: vi.fn(),
  isPlayingText: vi.fn().mockReturnValue(false),
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
    expect(screen.getAllByText(/\"Atomic Habits Chapter 3\"/i)[0]).toBeInTheDocument();

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

  it('calls onFinish with concatenated user text when Finish Conversation button is clicked', async () => {
    const onFinishMock = vi.fn();
    const sessionWithMessages = {
      id: 's_test_finish',
      title: 'Atomic Habits Chapter 3',
      sourceType: 'book',
      messages: [
        { id: 'm1', role: 'user', content: 'I readed chapter 3 yesterday.' },
        { id: 'm2', role: 'assistant', content: 'That is great!' },
        { id: 'm3', role: 'user', content: 'It was very interesting book.' },
      ],
    };

    render(
      <MemoryRouter>
        <SeamlessChatSession session={sessionWithMessages} settings={dummySettings} onFinish={onFinishMock} />
      </MemoryRouter>
    );

    const finishBtn = screen.getByRole('button', { name: /Finish Conversation →/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(onFinishMock).toHaveBeenCalledWith('I readed chapter 3 yesterday.\nIt was very interesting book.');
    });
  });
});

describe('SeamlessChatViewerModal Component', () => {
  const chatSession = {
    id: 's_test_2',
    title: 'Podcast Summary',
    sourceType: 'podcast',
    messages: [
      { id: 'm1', role: 'user', content: 'I listened to this podcast' },
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
