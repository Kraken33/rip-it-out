import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Practice from '../screens/Practice';
import { clearAllData, createSession, addImprovements } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

vi.mock('../services/aiService', () => ({
  streamTranslationPracticeCompletion: vi.fn().mockImplementation(async (cards, messages, settings, onChunk) => {
    const reply = 'Вчера я [[пригласил друга в гости|invite over]].';
    if (onChunk) onChunk(reply);
    return reply;
  }),
  transcribeAudio: vi.fn().mockResolvedValue('I invited a friend over'),
}));

describe('Practice Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders empty state when no cards are due', async () => {
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument()
    );
  });

  it('renders translation practice mode by default when cards are due', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Finish & Rate Recall →/i })).toBeInTheDocument();
  });

  it('switches between translation practice and scenario practice mode', async () => {
    const s = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Russian Translation Practice/i)).toBeInTheDocument()
    );

    // Switch to Scenario Q&A (Prompt #3)
    const scenarioTab = screen.getByRole('button', { name: /Scenario Q&A/i });
    fireEvent.click(scenarioTab);

    expect(screen.getByText(/Russian Scenario Practice Mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Prompt #3/i })).toBeInTheDocument();

    // Switch to Copy Prompt #5 submode
    const transTab = screen.getByRole('button', { name: /Translation Practice/i });
    fireEvent.click(transTab);

    const prompt5Tab = screen.getByRole('button', { name: /📋 Copy Prompt #5/i });
    fireEvent.click(prompt5Tab);

    expect(screen.getByText(/Russian Translation Practice \(Prompt #5\)/i)).toBeInTheDocument();
    expect(document.getElementById('btn-copy-prompt-5')).toBeInTheDocument();
  });
});
