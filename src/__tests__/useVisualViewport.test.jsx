import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualViewport, scrollToElementBottom } from '../hooks/useVisualViewport';

describe('useVisualViewport', () => {
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    vi.useFakeTimers();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(typeof result.current.scrollToBottom).toBe('function');
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

    const onKeyboardOpen = vi.fn();
    const { result } = renderHook(() => useVisualViewport({ onKeyboardOpen }));

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

    // Simulate keyboard opening again
    act(() => {
      window.visualViewport.height = 400;
      if (listeners['resize']) listeners['resize']();
    });

    expect(result.current.isKeyboardOpen).toBe(true);
    expect(onKeyboardOpen).toHaveBeenCalled();
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

  it('does NOT intercept or reset window scroll when lockBodyScroll is false', () => {
    Object.defineProperty(window, 'scrollY', { value: 250, writable: true, configurable: true });
    renderHook(() => useVisualViewport({ lockBodyScroll: false }));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('resets window scroll to top on window scroll when lockBodyScroll is true', () => {
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true, configurable: true });
    renderHook(() => useVisualViewport({ lockBodyScroll: true }));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('does not reset window scroll on keyboard resize when lockBodyScroll is false', () => {
    const listeners = {};
    window.innerHeight = 800;
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    window.visualViewport = {
      height: 800,
      width: 375,
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event) => {
        delete listeners[event];
      }),
    };

    renderHook(() => useVisualViewport({ lockBodyScroll: false }));

    // Simulate keyboard open
    act(() => {
      window.visualViewport.height = 400;
      if (listeners['resize']) listeners['resize']();
    });

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('scrollToElementBottom scrolls target immediately and on subsequent delays', () => {
    const mockScrollIntoView = vi.fn();
    const mockEl = { scrollIntoView: mockScrollIntoView };

    const cleanup = scrollToElementBottom(mockEl, { delays: [0, 100, 200] });

    expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockScrollIntoView).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockScrollIntoView).toHaveBeenCalledTimes(3);

    cleanup();
  });
});

