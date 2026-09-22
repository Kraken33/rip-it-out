import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SeamlessChatSession from '../screens/SeamlessChatSession';
import SeamlessChatViewerModal from '../screens/SeamlessChatViewerModal';
import ConversationViewerModal from '../screens/ConversationViewerModal';
import { streamSeamlessChatCompletion } from '../services/aiService';

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

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button type="button" onClick={() => onTranscribed('Transcribed audio text')}>
      Simulate dictation
    </button>
  ),
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
    openaiApiKey: 'sk_test',
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

  it('renders a multi-line textarea that preserves line breaks', () => {
    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Speak above or type your answer/i);
    expect(textarea.tagName).toBe('TEXTAREA');

    fireEvent.change(textarea, { target: { value: 'First line\nSecond line' } });
    expect(textarea.value).toBe('First line\nSecond line');
  });

  it('does not send on plain Enter but sends on Ctrl+Enter', async () => {
    streamSeamlessChatCompletion.mockClear();

    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Speak above or type your answer/i);
    fireEvent.change(textarea, { target: { value: 'Line one' } });

    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(streamSeamlessChatCompletion).not.toHaveBeenCalled();
    expect(textarea.value).toBe('Line one');

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => {
      expect(streamSeamlessChatCompletion).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Line one')).toBeInTheDocument();
    });
    expect(textarea.value).toBe('');
  });

  it('shows the keyboard shortcut hint near the textarea', () => {
    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Enter for new line · Ctrl\/Cmd\+Enter to send/)).toBeInTheDocument();
  });

  it('appends transcription to existing textarea content and sends both', async () => {
    render(
      <MemoryRouter>
        <SeamlessChatSession session={dummySession} settings={dummySettings} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Speak above or type your answer/i);
    fireEvent.change(textarea, { target: { value: 'Typed first.' } });

    fireEvent.click(screen.getByRole('button', { name: /Simulate dictation/i }));
    expect(textarea.value).toBe('Typed first. Transcribed audio text');

    fireEvent.click(screen.getByRole('button', { name: /Send ▶/i }));
    await waitFor(() => {
      expect(screen.getByText('Typed first. Transcribed audio text')).toBeInTheDocument();
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
