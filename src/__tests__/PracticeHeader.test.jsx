import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PracticeHeader from '../components/PracticeHeader';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PracticeHeader component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders translation mode active by default and navigates to frequency on click', () => {
    render(
      <MemoryRouter>
        <PracticeHeader activeMode="translation" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('tab-translation-active')).toHaveTextContent('Translation Practice');
    const freqBtn = screen.getByTestId('tab-frequency-inactive');
    expect(freqBtn).toBeInTheDocument();

    fireEvent.click(freqBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/frequency-practice');
  });

  it('renders frequency mode active and navigates to translation on click', () => {
    render(
      <MemoryRouter>
        <PracticeHeader activeMode="frequency" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('tab-frequency-active')).toHaveTextContent('Frequency Sentences');
    const transBtn = screen.getByTestId('tab-translation-inactive');
    expect(transBtn).toBeInTheDocument();

    fireEvent.click(transBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/practice');
  });

  it('renders rightContent slot when provided', () => {
    render(
      <MemoryRouter>
        <PracticeHeader
          activeMode="frequency"
          rightContent={<span data-testid="custom-right">Page 42</span>}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('custom-right')).toHaveTextContent('Page 42');
  });
});
