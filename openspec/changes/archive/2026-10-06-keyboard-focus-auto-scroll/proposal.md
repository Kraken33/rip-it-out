# Proposal

## Why

When users conduct multi-round sessions in Russian Story Translation, Russian Translation Practice, or Seamless AI Dialogue on mobile devices, the message thread accumulates previous passages, user translations, and feedback cards. When the user taps the translation/chat input to begin typing, the virtual software keyboard opens and shrinks the viewport height. Because the scroll position within the message container remains unchanged and scroll-to-latest is only triggered on round/message state changes, the active Russian passage or latest message is pushed off-screen, leaving earlier dialogue history in view.

Automatically aligning the message scroll container to the latest passage or message upon input focus and virtual keyboard expansion ensures the active prompt remains immediately visible and readable while typing.

## What Changes

- **Auto-scroll to latest round/message on input focus**: When the user taps/focuses the input textarea in Translation Story, Translation Practice, and Seamless Chat sessions, the message scroll container automatically scrolls to display the active Russian passage and latest thread item.
- **Viewport resize & keyboard-open scroll synchronization**: When the mobile visual viewport height changes due to the software keyboard opening (tracked via `useVisualViewport` or viewport resize events), trigger scroll alignment immediately and after keyboard expansion animation completes (~150-250ms).
- **Smooth / instant scroll alignment**: Ensure scrolling targets the latest message anchor / active passage card cleanly above the keyboard composer without window jank or layout stutter.

## Capabilities

### Modified Capabilities
- `translation-story-session`: Enhance the mobile viewport requirement to explicitly specify auto-scrolling the message container to the active Russian passage / latest round upon input focus and software keyboard opening.
- `russian-practice`: Enhance the mobile-responsive layout requirement to specify auto-scrolling the message container to the active practice passage upon input focus and software keyboard opening.
- `ai-seamless-integration`: Enhance the chat viewport requirement to ensure the conversation thread automatically scrolls to the latest assistant message upon input focus when the software keyboard is active.

## Impact

- `src/screens/TranslationStorySession.jsx`: Add focus and viewport resize auto-scroll handling to keep the active round's passage visible.
- `src/screens/TranslationPracticeSession.jsx`: Add focus and viewport resize auto-scroll handling to keep the active practice passage visible.
- `src/screens/SeamlessChatSession.jsx`: Add focus and viewport resize auto-scroll handling.
- `src/hooks/useVisualViewport.js`: Provide callback/event hooks or expose keyboard state changes cleanly if needed.
- Existing tests in Vitest for mobile viewport and session interactions.
