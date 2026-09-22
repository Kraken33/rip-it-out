import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../screens/Settings';
import { clearAllData, getSettings } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Settings Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders settings options', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Settings & Preferences/i)).toBeInTheDocument()
    );

    expect(screen.getByText('Semi-formal')).toBeInTheDocument();
  });

  it('labels the OpenAI key as required for Seamless AI and the Groq key as STT-only', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Settings & Preferences/i)).toBeInTheDocument()
    );

    expect(screen.getByText(/Required for Seamless AI text generation/i)).toBeInTheDocument();
    expect(screen.getByText(/Speech-to-Text only/i)).toBeInTheDocument();
  });

  it('renders the OpenAI Chat Model picker and persists the selection', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText('OpenAI Chat Model')).toBeInTheDocument()
    );

    expect(screen.getByText('gpt-4o-mini (Fast & Cheap)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('gpt-4o (Higher Quality)'));

    await waitFor(async () => {
      const saved = await getSettings();
      expect(saved.openaiModel).toBe('gpt-4o');
    });
  });
});
