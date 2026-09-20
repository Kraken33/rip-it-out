import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
