import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track window.visualViewport height and width dynamically,
 * detecting when the mobile software keyboard opens and shrinks the viewport,
 * providing instant scroll reset and optional body scroll locking to prevent browser auto-scroll on input focus.
 */
export function useVisualViewport({ lockBodyScroll = false } = {}) {
  const getDimensions = () => {
    if (typeof window === 'undefined') {
      return { viewportHeight: 800, viewportWidth: 375, isKeyboardOpen: false };
    }

    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const width = vv ? vv.width : window.innerWidth;
    const isKeyboardOpen = vv ? window.innerHeight - vv.height > 150 : false;

    return {
      viewportHeight: height,
      viewportWidth: width,
      isKeyboardOpen,
    };
  };

  const [viewport, setViewport] = useState(getDimensions);

  const resetScroll = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // Preemptive body scroll lock on mobile
  useEffect(() => {
    if (!lockBodyScroll || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    const originalTop = document.body.style.top;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0px';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.style.top = originalTop;
    };
  }, [lockBodyScroll]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const handleResize = () => {
      const current = getDimensions();
      setViewport(current);
      if (current.isKeyboardOpen && typeof window.scrollTo === 'function' && window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };

    const handleWindowScroll = () => {
      if (typeof window.scrollTo === 'function' && (window.scrollY > 0 || (vv && vv.offsetTop > 0))) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };

    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }
    window.addEventListener('scroll', handleWindowScroll);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  return {
    ...viewport,
    resetScroll,
  };
}

export default useVisualViewport;
