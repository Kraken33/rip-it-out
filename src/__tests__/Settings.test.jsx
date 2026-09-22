import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../screens/Settings';
import { clearAllData, getSettings, updateSettings } from '../store';

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

  it('renders the OpenAI Chat Model selector and persists the selection', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText('OpenAI Chat Model')).toBeInTheDocument()
    );

    const select = screen.getByLabelText('OpenAI Chat Model');
    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('gpt-4o-mini');

    fireEvent.change(select, { target: { value: 'gpt-5.5' } });

    await waitFor(async () => {
      const saved = await getSettings();
      expect(saved.openaiModel).toBe('gpt-5.5');
    });
  });

  it('keeps a legacy openaiModel value visible and selected in the selector', async () => {
    await updateSettings({ openaiModel: 'gpt-4o' });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.getByText('OpenAI Chat Model')).toBeInTheDocument()
    );

    const select = screen.getByLabelText('OpenAI Chat Model');
    expect(screen.getByRole('option', { name: /gpt-4o \(current — not in catalog\)/ })).toBeInTheDocument();
    expect(select.value).toBe('gpt-4o');
  });
});
