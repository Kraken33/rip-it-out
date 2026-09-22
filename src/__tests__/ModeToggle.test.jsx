import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModeToggle from '../components/ModeToggle';

describe('ModeToggle Component', () => {
  it('shows the locked callout when only a Groq API key is configured', () => {
    render(
      <ModeToggle mode="seamless" onChange={vi.fn()} settings={{ groqApiKey: 'gsk_123' }} />
    );

    expect(screen.getByText('(No Key)')).toBeInTheDocument();
    expect(screen.getByText(/Add an OpenAI API key in Settings to unlock/i)).toBeInTheDocument();
  });

  it('renders the unlocked mode switch when an OpenAI API key is configured', () => {
    render(
      <ModeToggle mode="seamless" onChange={vi.fn()} settings={{ openaiApiKey: 'sk_123' }} />
    );

    expect(screen.queryByText('(No Key)')).not.toBeInTheDocument();
    expect(screen.queryByText(/Add an OpenAI API key in Settings to unlock/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Seamless AI/i)).toBeInTheDocument();
  });
});
