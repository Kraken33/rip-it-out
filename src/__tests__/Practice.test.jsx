import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Practice from '../screens/Practice';
import { clearAllData, createSession, addImprovements } from '../store';

describe('Practice Component', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('renders empty state when no cards are due', () => {
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument();
  });

  it('renders Russian scenario practice prompt when cards are due', () => {
    const s = createSession({ title: 'S1', sourceType: 'video' });
    addImprovements(s.id, [{ construction: 'catch up on', original: 'caught up', improved: 'catch up on work', explanation: 'exp' }]);

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    );

    expect(screen.getByText(/Russian Scenario Practice Mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Prompt #3/i })).toBeInTheDocument();
  });
});
