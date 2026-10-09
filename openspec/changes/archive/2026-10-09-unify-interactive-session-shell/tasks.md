# Tasks

## 1. InteractiveSessionShell Component

- [x] 1.1 Create `src/components/InteractiveSessionShell.jsx` implementing the responsive viewport layout (`100dvh` mobile, `max-w-4xl` desktop), desktop header (`hidden sm:flex`), scrollable message feed, collapsible mobile `⚡ Actions` HUD, auto-growing docked footer with keyboard shortcuts, and caret-aware audio transcription insertion.
- [x] 1.2 Create `src/__tests__/InteractiveSessionShell.test.jsx` covering desktop header rendering, mobile HUD toggle and actions, textarea Enter vs Ctrl/Cmd+Enter dispatch, and caret-based dictation insertion.

## 2. Free Dialogue & Session Screen Migration

- [x] 2.1 Refactor `src/screens/SeamlessChatSession.jsx` to mount `InteractiveSessionShell.jsx`, moving `Finish Conversation →` into header and mobile actions HUD, and replacing legacy stacked layout with docked composer.
- [x] 2.2 Update `src/screens/Session.jsx` so Step 2 seamless dialogue (`activity === 'dialogue' && mode === 'seamless'`) activates the fullscreen immersive layout and locks body scroll on mobile, hiding the wizard header and stepper.
- [x] 2.3 Run `src/__tests__/SeamlessChatSession.test.jsx` and `src/__tests__/Session.test.jsx` to verify all chat behavior, test IDs, and transition expectations pass.

## 3. Translation Story & Practice Session Migration

- [x] 3.1 Refactor `src/screens/TranslationStorySession.jsx` to delegate container framing, mobile HUD, and composer dock to `InteractiveSessionShell.jsx`, passing the Variety Matrix into the drawer slot.
- [x] 3.2 Refactor `src/screens/TranslationPracticeSession.jsx` to delegate container framing, mobile HUD, and composer dock to `InteractiveSessionShell.jsx`.
- [x] 3.3 Run `src/__tests__/TranslationStorySession.test.jsx` and `src/__tests__/TranslationPracticeSession.test.jsx` to verify both translation suites pass without regressions.

## 4. Verification & Integration

- [x] 4.1 Run full test suite (`npm test`) and verify that all test suites pass with zero regressions.
