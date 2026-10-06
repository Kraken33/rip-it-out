import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualViewport } from '../hooks/useVisualViewport';

describe('useVisualViewport', () => {
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    window.visualViewport = originalVisualViewport;
    window.innerHeight = originalInnerHeight;
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  it('falls back to window.innerHeight and window.innerWidth when visualViewport is undefined', () => {
    window.visualViewport = undefined;
    window.innerHeight = 800;
    window.innerWidth = 375;

    const { result } = renderHook(() => useVisualViewport());

    expect(result.current.viewportHeight).toBe(800);
    expect(result.current.viewportWidth).toBe(375);
    expect(result.current.isKeyboardOpen).toBe(false);
    expect(typeof result.current.resetScroll).toBe('function');
  });

  it('reads dimensions and detects keyboard when visualViewport is present', () => {
    const listeners = {};
    window.innerHeight = 800;
    window.visualViewport = {
      height: 450,
      width: 375,
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event) => {
        delete listeners[event];
      }),
    };

    const { result } = renderHook(() => useVisualViewport());

    expect(result.current.viewportHeight).toBe(450);
    expect(result.current.viewportWidth).toBe(375);
    expect(result.current.isKeyboardOpen).toBe(true);

    // Call resetScroll
    act(() => {
      result.current.resetScroll();
    });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });

    // Simulate keyboard closing (viewport expanding)
    act(() => {
      window.visualViewport.height = 800;
      if (listeners['resize']) listeners['resize']();
    });

    expect(result.current.viewportHeight).toBe(800);
    expect(result.current.isKeyboardOpen).toBe(false);
  });

  it('preemptively locks document body scroll when lockBodyScroll is true and restores on unmount', () => {
    const initialOverflow = document.body.style.overflow;
    const initialPosition = document.body.style.position;

    const { unmount } = renderHook(() => useVisualViewport({ lockBodyScroll: true }));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.width).toBe('100%');

    unmount();

    expect(document.body.style.overflow).toBe(initialOverflow);
    expect(document.body.style.position).toBe(initialPosition);
  });
});
