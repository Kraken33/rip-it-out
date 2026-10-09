import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState, useRef } from 'react';
import InteractiveSessionShell, { insertTranscriptionAtCaret } from '../components/InteractiveSessionShell';

vi.mock('../components/AudioRecorder', () => ({
  default: ({ onTranscribed }) => (
    <button type="button" onClick={() => onTranscribed('test transcription')}>
      Simulate dictation
    </button>
  ),
}));

describe('insertTranscriptionAtCaret', () => {
  it('inserts transcription at cursor position with proper spaces', () => {
    const el = { selectionStart: 5, selectionEnd: 5 };
    const result = insertTranscriptionAtCaret(el, 'Hello world', 'brave');
    expect(result).toBe('Hello brave world');
  });

  it('appends with space if cursor is at the end', () => {
    const el = { selectionStart: 5, selectionEnd: 5 };
    const result = insertTranscriptionAtCaret(el, 'Hello', 'world');
    expect(result).toBe('Hello world');
  });

  it('returns prevText unchanged if transcription is empty', () => {
    const el = { selectionStart: 0, selectionEnd: 0 };
    expect(insertTranscriptionAtCaret(el, 'Hello', '')).toBe('Hello');
  });
});

describe('InteractiveSessionShell Component', () => {
  function TestHarness({ onSubmit, onAudioError, ...props }) {
    const [inputText, setInputText] = useState(props.initialText || '');
    const inputRef = useRef(null);

    return (
      <InteractiveSessionShell
        inputRef={inputRef}
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={onSubmit}
        settings={{ openaiApiKey: 'sk_test' }}
        onAudioError={onAudioError}
        headerLeft={<span data-testid="header-left">Header Left Title</span>}
        headerRight={<button data-testid="header-right-btn">Action Button</button>}
        {...props}
      >
        <div data-testid="feed-item">Message 1</div>
      </InteractiveSessionShell>
    );
  }

  it('renders desktop header and message feed children', () => {
    render(<TestHarness />);

    expect(screen.getByTestId('header-left')).toHaveTextContent('Header Left Title');
    expect(screen.getByTestId('header-right-btn')).toBeInTheDocument();
    expect(screen.getByTestId('feed-item')).toHaveTextContent('Message 1');
  });

  it('toggles mobile actions panel and executes actions', () => {
    const onMobileAction = vi.fn();
    render(
      <TestHarness
        renderMobileActions={({ closeMenu }) => (
          <button
            data-testid="custom-mobile-action"
            onClick={() => {
              onMobileAction();
              closeMenu();
            }}
          >
            Custom Action
          </button>
        )}
      />
    );

    // Panel is closed initially
    expect(screen.queryByTestId('mobile-actions-panel')).not.toBeInTheDocument();

    // Toggle open
    const toggleBtn = screen.getByTestId('toggle-mobile-actions');
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('mobile-actions-panel')).toBeInTheDocument();

    // Click custom action, which should trigger callback and close panel
    const customBtn = screen.getByTestId('custom-mobile-action');
    fireEvent.click(customBtn);
    expect(onMobileAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('mobile-actions-panel')).not.toBeInTheDocument();
  });

  it('dispatches onSubmit on Ctrl+Enter and button click, but not on plain Enter', () => {
    const onSubmit = vi.fn();
    render(<TestHarness onSubmit={onSubmit} canSubmit={true} initialText="Hello" />);

    const textarea = screen.getByPlaceholderText(/Type or speak here/i);

    // Plain Enter does not submit
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();

    // Ctrl+Enter submits
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Desktop submit button submits
    const submitBtn = screen.getByRole('button', { name: /Submit ▶/i });
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('inserts dictation via AudioRecorder into textarea', () => {
    render(<TestHarness initialText="Initial." />);

    const textarea = screen.getByPlaceholderText(/Type or speak here/i);
    expect(textarea.value).toBe('Initial.');

    // Click dictation button
    const dictBtn = screen.getAllByRole('button', { name: /Simulate dictation/i })[0];
    fireEvent.click(dictBtn);

    expect(textarea.value).toBe('Initial. test transcription');
  });

  it('displays error banner when errorMsg is provided', () => {
    const onRetry = vi.fn();
    render(
      <TestHarness
        errorMsg="Network error occurred"
        renderErrorAction={<button onClick={onRetry}>Retry</button>}
      />
    );

    expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
