import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabaseClient so store uses localStorage fallback
vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import Stats from '../screens/Stats';
import Dashboard from '../screens/Dashboard';
import { clearAllData, logActivity, createSession } from '../store';

describe('Stats Screen & Time Widgets', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders Stats page title and metric cards after loading', async () => {
    await logActivity({ type: 'session', durationSeconds: 180 });
    await logActivity({ type: 'review', durationSeconds: 120 });

    render(
      <MemoryRouter>
        <Stats />
      </MemoryRouter>
    );

    // Wait for async data to load and spinner to disappear
    await waitFor(() =>
      expect(screen.getByText(/Learning Activity & Statistics/i)).toBeInTheDocument()
    );

    expect(screen.getAllByText('5m').length).toBeGreaterThan(0); // Today's & Total time
    expect(screen.getAllByText('3m').length).toBeGreaterThan(0); // Session practice time
    expect(screen.getAllByText('2m').length).toBeGreaterThan(0); // Card review time
  });

  it('renders time widget on Dashboard', async () => {
    await logActivity({ type: 'session', durationSeconds: 300 });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Time Spent/i)).toBeInTheDocument()
    );

    expect(screen.getByText(/Full Stats →/i)).toBeInTheDocument();
  });
});
