# Proposal: Mobile Translation Keyboard-Aware Split Viewport

## Why

During mobile translation sessions (both Story Translation in `/session/new` and Vault Translation Practice in `/practice`), focusing the translation textarea opens the software keyboard. When the browser attempts native focus auto-scrolling, or when reactive scroll-backs are delayed with timeouts and smooth scrolling, the screen experiences sluggish scrolling animations and layout stutter. Additionally, without full-width inputs and collapsible controls, the typing area felt cramped.

Fixing this now delivers a silky smooth, instantaneous keyboard experience by preemptively locking document body scroll, eliminating sluggish delayed scroll animations, providing a spacious full-width translation input, and tucking auxiliary controls into a collapsible drawer.

## What Changes

- **Preemptive Body Scroll Lock & Instant Focus Scroll Suppression**: Lock `document.body` (`overflow: hidden; position: fixed`) during mobile translation sessions and use instant focus scroll suppression (`preventScroll: true`, `behavior: 'instant'`) to eliminate sluggish scroll-back delays and layout stutter when opening the software keyboard.
- **Full-Width Mobile Translation Composer**: Dedicate 100% width to the translation textarea, eliminating horizontal cramping from inline buttons.
- **Collapsible Action Controls**: Group auxiliary actions (*Audio Mic*, *Tune Flavor*, *Reroll Story*, *Finish Session*) under a collapsible drawer that expands on demand without crowding the typing area.
- **Pinned Source Passage during Active Translation**: Keep the active Russian passage card pinned and readable in the upper portion of the visual viewport while the full-width composer sits locked above the virtual keyboard.
- **Synchronized Support for Practice & Story Sessions**: Apply the instant scroll lock, full-width composer, and collapsible controls consistently to both `TranslationStorySession` and `TranslationPracticeSession`.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `translation-story-session`: Enhance the mobile viewport requirement to provide instantaneous body scroll locking, full-width translation textarea, and collapsible action menu when the software keyboard opens.
- `russian-practice`: Enhance the mobile responsive requirement to provide instantaneous body scroll locking, full-width translation textarea, and collapsible controls during keyboard entry.

## Impact

- **Affected Components**: `src/screens/TranslationStorySession.jsx`, `src/screens/TranslationPracticeSession.jsx`, `src/screens/Session.jsx`, `src/screens/Practice.jsx`, and `src/hooks/useVisualViewport.js`.
- **APIs & Dependencies**: Uses browser `window.visualViewport` and DOM body scroll locking. No new external packages.
- **Tests**: Updates unit and responsive component tests in `src/__tests__/TranslationStorySession.test.jsx`, `src/__tests__/TranslationPracticeSession.test.jsx`, and `src/__tests__/useVisualViewport.test.jsx`.
