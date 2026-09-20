import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../screens/Dashboard';
import { clearAllData, createSession, addImprovements, logActivity } from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe('Dashboard Component', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('renders empty state when no sessions exist', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Rip It Out/i)).toBeInTheDocument());
    expect(screen.getByText(/Due for Review/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/No learning sessions created yet/i)).toBeInTheDocument());
  });

  it('renders a topic group header when a session exists', async () => {
    await createSession({ title: 'Tech Article', sourceType: 'article' });
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Tech Article')).toBeInTheDocument());
    expect(screen.queryByText('1 session')).toBeInTheDocument();
  });

  it('clicking a topic header expands the session list', async () => {
    const session = await createSession({ title: 'Friends S3', sourceType: 'video' });
    renderDashboard();

    const header = await waitFor(() => screen.getByText('Friends S3').closest('button'));
    fireEvent.click(header);

    // After expanding, the session row (with relative date) should appear
    await waitFor(() => {
      expect(document.getElementById(`session-row-${session.id}`)).toBeInTheDocument();
    });
    // The header still shows the "0 phrases" badge
    expect(screen.getByText(/0 phrases/i)).toBeInTheDocument();
  });

  it('clicking an expanded header collapses the session list', async () => {
    await createSession({ title: 'Podcast EP1', sourceType: 'podcast' });
    renderDashboard();

    const header = await waitFor(() => screen.getByText('Podcast EP1').closest('button'));
    fireEvent.click(header);
    const phraseBadges = screen.getAllByText(/0 phrases/i);
    expect(phraseBadges.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(header);
    const afterCollapse = screen.getAllByText(/0 phrases/i);
    expect(afterCollapse).toHaveLength(1);
  });

  it('groups two sessions with the same title under one header', async () => {
    await createSession({ title: 'Breaking Bad', sourceType: 'video' });
    await createSession({ title: 'Breaking Bad', sourceType: 'video' });
    renderDashboard();

    await waitFor(() => expect(screen.getAllByText('Breaking Bad').length).toBe(1));
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
  });

  it('shows separate group headers for different titles', async () => {
    await createSession({ title: 'Show A', sourceType: 'video' });
    await createSession({ title: 'Show B', sourceType: 'podcast' });
    renderDashboard();

    await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());
    expect(screen.getByText('Show B')).toBeInTheDocument();
  });

  it('shows total phrase count in group header', async () => {
    const s = await createSession({ title: 'My Podcast', sourceType: 'podcast' });
    await addImprovements(s.id, [
      { original: 'go to home', improved: 'go home', explanation: 'exp' },
      { original: 'very unique', improved: 'unique', explanation: 'exp' },
    ]);
    renderDashboard();

    await waitFor(() => expect(screen.getByText(/2 phrases/i)).toBeInTheDocument());
  });

  it('clicking a session row navigates to /library?session=<sessionId>', async () => {
    const session = await createSession({ title: 'Movie Night', sourceType: 'movie' });
    renderDashboard();

    const header = await waitFor(() => screen.getByText('Movie Night').closest('button'));
    fireEvent.click(header);

    const sessionBtn = document.getElementById(`session-row-${session.id}`);
    expect(sessionBtn).toBeInTheDocument();
    fireEvent.click(sessionBtn);
    expect(window.location.pathname + window.location.search).toBe(`/library?session=${session.id}`);
  });

  it('renders time badge on expanded session row', async () => {
    const session = await createSession({ title: 'Timed Session', sourceType: 'video' });
    await logActivity({ type: 'session', durationSeconds: 150, sessionId: session.id, topicId: session.topicId });

    renderDashboard();

    const header = await waitFor(() => screen.getByText('Timed Session').closest('button'));
    fireEvent.click(header);

    expect(screen.getAllByText(/2m 30s/i).length).toBeGreaterThan(0);
  });
});
