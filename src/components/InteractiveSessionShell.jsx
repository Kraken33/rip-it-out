import React, { useState, useEffect, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import { useVisualViewport } from '../hooks/useVisualViewport';

const DEFAULT_MAX_INPUT_HEIGHT = 200;

/**
 * Inserts speech transcription into text at the current cursor/caret position,
 * preserving existing text with proper boundary spacing.
 */
export function insertTranscriptionAtCaret(inputEl, prevText = '', transcription = '') {
  if (!transcription) return prevText;
  const start = typeof inputEl?.selectionStart === 'number' ? inputEl.selectionStart : prevText.length;
  const end = typeof inputEl?.selectionEnd === 'number' ? inputEl.selectionEnd : start;
  const before = prevText.slice(0, start);
  const after = prevText.slice(end);
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  const trail = after && !/^\s/.test(after) ? ' ' : '';
  return `${before}${lead}${transcription}${trail}${after}`;
}

/**
 * InteractiveSessionShell: Unified layout and interaction container for practice sessions
 * (Free Dialogue, Story Translation, Russian Translation Practice).
 */
export default function InteractiveSessionShell({
  // Container & Viewport
  className,
  onKeyboardOpen,
  messagesEndRef: externalMessagesEndRef,

  // Header Slots
  headerLeft,
  headerRight,

  // Mobile Actions HUD Slots
  mobileRoundLabel,
  mobileHeaderContent,
  mobileToggleTestId = 'toggle-mobile-actions',
  mobileActionsTestId = 'mobile-actions-panel',
  mobileCloseTestId = 'close-mobile-actions',
  mobileSubmitTestId = 'mobile-story-translate-button',
  showMobileSubmit = true,
  mobileSubmitLabel,
  renderMobileActions,
  mobileActions,

  // Message Feed
  children,
  feedClassName,

  // Drawers & Error
  drawer,
  errorMsg,
  renderErrorAction,

  // Footer & Composer
  inputRef: externalInputRef,
  inputText = '',
  onInputChange,
  onInputFocus,
  onSubmit,
  canSubmit = false,
  submitLabel = 'Submit ▶',
  submitButtonId,
  submitButtonTestId,
  inputPlaceholder = 'Type or speak here...',
  inputRows = 2,
  inputDisabled = false,
  maxInputHeight = DEFAULT_MAX_INPUT_HEIGHT,
  shortcutHint = 'Enter adds a new line · Ctrl/⌘ + Enter sends',

  // Audio / Dictation
  settings,
  onTranscribed,
  onAudioError,
}) {
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;

  const internalMessagesEndRef = useRef(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  useVisualViewport({
    onKeyboardOpen,
  });

  // Auto-grow textarea up to maxInputHeight
  useEffect(() => {
    const el = inputRef?.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxInputHeight)}px`;
  }, [inputText, inputRef, maxInputHeight]);

  const handleTranscribe = (transcription) => {
    if (!transcription) return;
    if (onTranscribed) {
      onTranscribed(transcription);
    } else if (onInputChange && inputRef?.current) {
      onInputChange(insertTranscriptionAtCaret(inputRef.current, inputText, transcription));
    }
  };

  return (
    <div
      className={
        className ||
        'w-full flex flex-col h-full min-h-0 relative glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in'
      }
    >
      {/* Consolidated Session Top Header (Desktop only) */}
      <div className="hidden sm:flex px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">{headerLeft}</div>
        <div className="flex items-center gap-1.5 shrink-0">{headerRight}</div>
      </div>

      {/* Mobile Collapsible Actions Modal / Stack */}
      {mobileActionsOpen && (
        <div
          data-testid={mobileActionsTestId}
          className="sm:hidden absolute top-4 left-2 right-2 z-50 flex flex-col gap-2 p-3.5 rounded-xl bg-[#10111c] border border-purple-500/40 shadow-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              {mobileHeaderContent || headerLeft}
            </div>
            <button
              type="button"
              data-testid={mobileCloseTestId}
              onClick={() => setMobileActionsOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer shrink-0"
            >
              ✕ Close
            </button>
          </div>

          {/* Voice recording in mobile drawer */}
          {settings && (
            <div className="w-full flex justify-center py-1 bg-[#161726] rounded-xl border border-gray-800">
              <AudioRecorder
                settings={settings}
                onTranscribed={(text) => {
                  handleTranscribe(text);
                  setMobileActionsOpen(false);
                }}
                onError={onAudioError}
              />
            </div>
          )}

          {/* Submit action in mobile drawer */}
          {showMobileSubmit && (
            <button
              type="button"
              data-testid={mobileSubmitTestId}
              onClick={() => {
                if (!canSubmit) return;
                setMobileActionsOpen(false);
                onSubmit?.();
              }}
              disabled={!canSubmit}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>▶</span>
              <span>{mobileSubmitLabel || submitLabel}</span>
            </button>
          )}

          {/* Custom mobile actions */}
          {typeof renderMobileActions === 'function'
            ? renderMobileActions({ closeMenu: () => setMobileActionsOpen(false) })
            : mobileActions}
        </div>
      )}

      {/* Scrollable Feed Thread */}
      <div
        className={
          feedClassName ||
          'flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#0d0e15]/50'
        }
      >
        {children}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
          <span>⚠️ {errorMsg}</span>
          {renderErrorAction}
        </div>
      )}

      {/* Optional In-Session Drawer (e.g. Variety Matrix) */}
      {drawer && <div className="shrink-0">{drawer}</div>}

      {/* Docked Controls Footer */}
      <div className="p-2 sm:p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) {
              onSubmit?.();
            }
          }}
          className="space-y-1.5 sm:space-y-2"
        >
          {shortcutHint && (
            <div className="hidden sm:flex justify-between items-center text-[10px] text-gray-500 font-medium">
              <span>{shortcutHint}</span>
            </div>
          )}

          {/* Full-width auto-growing textarea */}
          <div className="w-full">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => onInputChange?.(e.target.value)}
              onFocus={onInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (canSubmit) {
                    onSubmit?.();
                  }
                }
              }}
              placeholder={inputPlaceholder}
              rows={inputRows}
              disabled={inputDisabled}
              className="w-full min-h-[46px] sm:min-h-[54px] max-h-[110px] sm:max-h-[140px] bg-[#0e0f17] border border-gray-800 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium resize-none disabled:opacity-60"
            />
          </div>

          {/* Controls Bar Under Textarea */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5">
              {/* Mobile Actions Drawer Toggle */}
              <button
                type="button"
                data-testid={mobileToggleTestId}
                onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                className="py-1 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700/70 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⚡</span>
                <span className="text-[11px] text-purple-300 font-bold">
                  {mobileRoundLabel ? `Actions · ${mobileRoundLabel}` : 'Actions'}{' '}
                  {mobileActionsOpen ? '▼' : '▲'}
                </span>
              </button>

              {/* Audio Recorder Button (Desktop only inline) */}
              {settings && (
                <div className="hidden sm:flex shrink-0 items-center">
                  <AudioRecorder
                    settings={settings}
                    onTranscribed={handleTranscribe}
                    onError={onAudioError}
                  />
                </div>
              )}
            </div>

            {/* Primary Submit Button (Desktop only inline) */}
            <button
              id={submitButtonId}
              data-testid={submitButtonTestId}
              type="submit"
              disabled={!canSubmit}
              className="hidden sm:inline-flex px-4 sm:px-6 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0 text-center"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
