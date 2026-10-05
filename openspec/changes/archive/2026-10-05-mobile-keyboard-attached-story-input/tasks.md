# Tasks

## 1. Viewport & Navigation Layout

- [x] 1.1 Update `index.html` viewport meta tag to include `interactive-widget=resizes-content, viewport-fit=cover` and verify HTML structure.
- [x] 1.2 Update `src/App.jsx` to hide the fixed bottom navigation bar during active translation sessions, verifying bottom navigation is hidden when practicing.
- [x] 1.3 Update `src/screens/Session.jsx` container layout to provide a dynamic viewport flex container (`h-[calc(100dvh-4rem)] sm:h-auto`) for step 2 story translation sessions.

## 2. Composer Dock & Collapsible Vertical Actions

- [x] 2.1 Update `src/screens/TranslationStorySession.jsx` textarea to use `text-base sm:text-sm` and stable mobile height bounds (`min-h-[56px] max-h-[140px] sm:max-h-[200px]`), preventing iOS auto-zoom.
- [x] 2.2 Implement `mobileActionsOpen` state with a single compact toggle button (`⚡ Actions ▲` / `✕ Close Actions ▼`) on mobile screens (`sm:hidden`).
- [x] 2.3 Implement the expanded vertical actions stack (`flex flex-col gap-2 w-full`) displaying full-width buttons for `🎙️ Speak`, `✨ Flavor`, `Next Round →`, and `Finish Story ✓` on mobile, while retaining the desktop horizontal bar (`hidden sm:flex`).
- [x] 2.4 Add safe-area inset padding to the bottom footer dock (`pb-[env(safe-area-inset-bottom)]`).

## 3. Automated Testing & Verification

- [x] 3.1 Update `src/__tests__/TranslationStorySession.test.jsx` to cover the mobile action toggle expansion, vertical action buttons, and translation submission interactions.
- [x] 3.2 Run the full test suite (`npm test`) and verify all tests pass without regressions.
