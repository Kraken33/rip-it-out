import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TranslationStoryViewerModal from '../screens/TranslationStoryViewerModal';
import ConversationViewerModal from '../screens/ConversationViewerModal';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

const storySession = {
  id: 'sess_story',
  title: 'Morning Story',
  activity: 'translation',
  rawText: 'I invited a friend over and we talked.\n\nThe weather was nice today.',
  messages: [
    {
      role: 'story-round',
      round: 1,
      passage: 'Вчера я пригласил друга в гости.',
      translation: 'I invited a friend over and we talked.',
      improvedVersion: 'I had a friend over and we had a good chat.',
      constructions: [
        {
          construction: 'invite [someone] over',
          original: 'invited a friend to my house',
          improved: 'invited a friend over',
          explanation: 'Natural phrasing.',
          category: 'collocation',
          spoken_frequency: 'very_high',
        },
      ],
    },
    {
      role: 'story-round',
      round: 2,
      passage: 'Сегодня была хорошая погода.',
      translation: 'The weather was nice today.',
      improvedVersion: 'The weather was lovely today.',
      constructions: [],
    },
  ],
};

describe('TranslationStoryViewerModal', () => {
  it('replays every story round with passage, translation, and improved version', () => {
    render(<TranslationStoryViewerModal session={storySession} onClose={() => {}} />);

    expect(screen.getByText(/Story Translation: Morning Story/)).toBeInTheDocument();
    expect(screen.getByText(/Вчера я пригласил друга в гости/)).toBeInTheDocument();
    expect(screen.getByText(/Сегодня была хорошая погода/)).toBeInTheDocument();
    expect(screen.getByText(/I invited a friend over and we talked/)).toBeInTheDocument();
    expect(screen.getByText(/I had a friend over and we had a good chat/)).toBeInTheDocument();
    expect(screen.getByText(/2 Story Rounds/)).toBeInTheDocument();
  });

  it('lists candidate constructions per round', () => {
    render(<TranslationStoryViewerModal session={storySession} onClose={() => {}} />);

    expect(screen.getByText(/Constructions from this round/i)).toBeInTheDocument();
    expect(screen.getByText('invite [someone] over')).toBeInTheDocument();
  });

  it('counts words from learner translations only, excluding passages and feedback', () => {
    render(<TranslationStoryViewerModal session={storySession} onClose={() => {}} />);

    // rawText is "I invited a friend over and we talked.\n\nThe weather was nice today."
    // => 13 words; passages (Russian) and improved versions must not be counted.
    const totalLabel = screen.getByText(/translated words/i);
    expect(totalLabel).toHaveTextContent('13 translated words');
  });

  it('shows an empty state when no rounds were persisted', () => {
    render(
      <TranslationStoryViewerModal
        session={{ id: 'x', title: 'Empty', activity: 'translation', messages: [] }}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/No saved story rounds available/i)).toBeInTheDocument();
  });

  it('invokes onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<TranslationStoryViewerModal session={storySession} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ConversationViewerModal routing', () => {
  it('routes translation-activity sessions to the story-round replay view', () => {
    render(<ConversationViewerModal session={storySession} improvements={[]} onClose={() => {}} />);

    expect(screen.getByText(/Story Translation: Morning Story/)).toBeInTheDocument();
    expect(screen.queryByText(/Seamless Chat:/)).not.toBeInTheDocument();
  });

  it('keeps routing dialogue chat sessions to the seamless chat viewer', () => {
    const dialogueSession = {
      id: 'sess_chat',
      title: 'Chat',
      activity: 'dialogue',
      messages: [{ id: 'm1', role: 'assistant', content: 'Hello there' }],
    };
    render(<ConversationViewerModal session={dialogueSession} improvements={[]} onClose={() => {}} />);

    expect(screen.getByText(/Seamless Chat: Chat/)).toBeInTheDocument();
  });
});
