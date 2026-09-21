import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TranslationPracticeSession from '../screens/TranslationPracticeSession';

vi.mock('../services/aiService', () => ({
  streamTranslationPracticeCompletion: vi.fn().mockImplementation(async (cards, messages, settings, onChunk) => {
    const reply = 'Вчера я [[пригласил друга в гости|invite over]], но он отказался.';
    if (onChunk) onChunk(reply);
    return reply;
  }),
  transcribeAudio: vi.fn().mockResolvedValue('I invited a friend over yesterday'),
}));

describe('TranslationPracticeSession Component', () => {
  const dummyCards = [
    { improvementId: 'c1', construction: 'invite over', improved: 'I invited him over' },
    { improvementId: 'c2', construction: 'plan on', improved: 'I plan on going' },
    { improvementId: 'c3', construction: 'turn down', improved: 'turned down the offer' },
    { improvementId: 'c4', construction: 'catch up', improved: 'caught up with him' },
    { improvementId: 'c5', construction: 'look forward to', improved: 'looking forward to it' },
  ];

  const dummySettings = { openaiApiKey: 'sk_test' };

  it('renders translation practice header and initial tagged Russian passage', async () => {
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Round 1 of 2/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    });
  });

  it('calls onFinish when Finish & Rate Recall button is clicked', async () => {
    const onFinishMock = vi.fn();
    render(
      <MemoryRouter>
        <TranslationPracticeSession allCards={dummyCards} settings={dummySettings} onFinish={onFinishMock} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('пригласил друга в гости')).toBeInTheDocument();
    });

    const finishBtn = screen.getByRole('button', { name: /Finish & Rate Recall →/i });
    fireEvent.click(finishBtn);

    expect(onFinishMock).toHaveBeenCalled();
  });
});
