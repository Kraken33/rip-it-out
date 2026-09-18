import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../screens/Settings';
import { clearAllData, getSettings } from '../store';

describe('Settings Component', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('renders settings options and allows updating preferences', () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    expect(screen.getByText(/Settings & Preferences/i)).toBeInTheDocument();

    const semiFormalBtn = screen.getByText('Semi-formal');
    fireEvent.click(semiFormalBtn);

    expect(getSettings().formality).toBe('Semi-formal');
  });
});
