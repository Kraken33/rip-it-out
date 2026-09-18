import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../screens/Dashboard';
import { clearAllData, createSession, addImprovements, logActivity } from '../store';

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('renders empty state when no sessions exist', () => {
    renderDashboard();
    expect(screen.getByText(/Rip It Out/i)).toBeInTheDocument();
    expect(screen.getByText(/Due for Review/i)).toBeInTheDocument();
    expect(screen.getByText(/No learning sessions created yet/i)).toBeInTheDocument();
  });

  it('renders a topic group header when a session exists', () => {
    createSession({ title: 'Tech Article', sourceType: 'article' });
    renderDashboard();
    expect(screen.getByText('Tech Article')).toBeInTheDocument();
    // Session date row should not be visible (collapsed by default)
    expect(screen.queryByText('1 session')).toBeInTheDocument();
    // The expanded section (border-t div) should not be rendered
    expect(screen.queryByRole('button', { name: /topic-toggle/i })).toBeNull();
    // The session list content (phrases badge) should NOT be in the DOM
    const sessionRows = document.querySelectorAll('[id^="topic-toggle-"] + div');
    expect(sessionRows).toHaveLength(0);
  });

  it('clicking a topic header expands the session list', () => {
    createSession({ title: 'Friends S3', sourceType: 'video' });
    renderDashboard();

    const header = screen.getByText('Friends S3').closest('button');
    fireEvent.click(header);

    // After expanding, both header total and session row show "0 phrases"
    const badges = screen.getAllByText(/0 phrases/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('clicking an expanded header collapses the session list', () => {
    createSession({ title: 'Podcast EP1', sourceType: 'podcast' });
    renderDashboard();

    const header = screen.getByText('Podcast EP1').closest('button');
    // Expand
    fireEvent.click(header);
    // The session row's phrase count badge appears inside the expanded section
    const phraseBadges = screen.getAllByText(/0 phrases/i);
    // One badge in the group header (total), one in the session row
    expect(phraseBadges.length).toBeGreaterThanOrEqual(1);
    // Collapse
    fireEvent.click(header);
    // After collapse the session row is removed; only header-level badge remains
    const afterCollapse = screen.getAllByText(/0 phrases/i);
    expect(afterCollapse).toHaveLength(1);
  });

  it('groups two sessions with the same title under one header', () => {
    createSession({ title: 'Breaking Bad', sourceType: 'video' });
    createSession({ title: 'Breaking Bad', sourceType: 'video' });
    renderDashboard();

    // Only one group header with that title
    const headers = screen.getAllByText('Breaking Bad');
    expect(headers).toHaveLength(1);

    // Header shows "2 sessions"
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
  });

  it('shows separate group headers for different titles', () => {
    createSession({ title: 'Show A', sourceType: 'video' });
    createSession({ title: 'Show B', sourceType: 'podcast' });
    renderDashboard();

    expect(screen.getByText('Show A')).toBeInTheDocument();
    expect(screen.getByText('Show B')).toBeInTheDocument();
  });

  it('shows total phrase count in group header', () => {
    const s = createSession({ title: 'My Podcast', sourceType: 'podcast' });
    addImprovements(s.id, [
      { original: 'go to home', improved: 'go home', explanation: 'exp' },
      { original: 'very unique', improved: 'unique', explanation: 'exp' },
    ]);
    renderDashboard();

    expect(screen.getByText(/2 phrases/i)).toBeInTheDocument();
  });

  it('clicking a session row navigates to /library?session=<sessionId>', () => {
    const session = createSession({ title: 'Movie Night', sourceType: 'movie' });
    renderDashboard();

    // Expand topic group header
    const header = screen.getByText('Movie Night').closest('button');
    fireEvent.click(header);

    // Find session row button
    const sessionBtn = document.getElementById(`session-row-${session.id}`);
    expect(sessionBtn).toBeInTheDocument();

    fireEvent.click(sessionBtn);
    expect(window.location.pathname + window.location.search).toBe(`/library?session=${session.id}`);
  });

  it('renders time badge on expanded session row', () => {
    const session = createSession({ title: 'Timed Session', sourceType: 'video' });
    logActivity({ type: 'session', durationSeconds: 150, sessionId: session.id, topicId: session.topicId });

    renderDashboard();

    const header = screen.getByText('Timed Session').closest('button');
    fireEvent.click(header);

    expect(screen.getAllByText(/2m 30s/i).length).toBeGreaterThan(0);
  });
});
