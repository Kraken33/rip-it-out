import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Session from '../screens/Session';
import { clearAllData, createSession } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Session Wizard Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders Step 1 form correctly', () => {
    render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    expect(screen.getByText(/New Practice Session/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Atomic Habits/i)).toBeInTheDocument();
  });

  it('submits Step 1 form and advances to Step 2 with Prompt #1', async () => {
    render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText(/Atomic Habits/i);
    fireEvent.change(titleInput, { target: { value: 'My Video Session' } });

    const videoButton = screen.getByText('Video');
    fireEvent.click(videoButton);

    const submitBtn = screen.getByRole('button', { name: /(Generate Prompt #1|Start Seamless Voice Session)/i });
    fireEvent.click(submitBtn);

    // createSession is now async, so wait for step 2 content
    await waitFor(() =>
      expect(screen.getByText(/(Seamless Voice Session|Step 1: Describe Content)/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/My Video Session/i)).toBeInTheDocument();
  });

  it('autofills previous session details when selecting a title from dropdown', async () => {
    await createSession({ title: 'Previous Session', sourceType: 'book', tags: ['habits'], notes: 'book note' });

    const { container } = render(
      <BrowserRouter>
        <Session />
      </BrowserRouter>
    );

    await waitFor(() => {
      const selector = container.querySelector('#select-prev-title');
      expect(selector).toBeTruthy();
    });

    const selector = container.querySelector('#select-prev-title');
    fireEvent.change(selector, { target: { value: 'Previous Session' } });

    expect(screen.getByPlaceholderText(/Atomic Habits/i)).toHaveValue('Previous Session');
    expect(screen.getByPlaceholderText(/productivity/i)).toHaveValue('habits');
  });
});
