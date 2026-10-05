# Proposal

## Why

When learners practice Russian story translation on mobile devices (such as iPhone Safari / iOS WebKit), opening the software keyboard causes the translation input area to jump around, change sizes erratically, and push the Russian story passage off-screen. Additionally, iOS Safari automatically zooms into the page because the input font size is below 16px, and the cluster of footer action buttons (`Speak`, `Flavor`, `Next Round`, `Finish`) clutters the limited mobile viewport. 

Learners need a clean, stable mobile composer that stays securely attached directly above the software keyboard with the Russian story passage visible and scrollable in the upper viewport, paired with a collapsible action menu displaying full-width vertical buttons when expanded.

## What Changes

- **Keyboard-Attached Mobile Layout**: Configure the story translation session container to respect dynamic visual viewport bounds (`100dvh` / `interactive-widget=resizes-content`) and pin the translation composer dock directly above the software keyboard and bottom safe area (`env(safe-area-inset-bottom)`).
- **Prevent iOS Safari Auto-Zoom**: Ensure the translation `<textarea>` font size is at least 16px (`text-base sm:text-sm`) on mobile viewports so iOS does not trigger unwanted zoom or horizontal viewport displacement on focus.
- **Collapsible Action Controls on Mobile**:
  - Replace the crowded horizontal button cluster on mobile with a single compact toggle button (`Actions ▲` / `✕ Close ▼`) when collapsed.
  - When expanded on mobile, present the session action controls (`🎙️ Speak / Dictate`, `✨ Story Flavor Matrix`, `➡️ Next Round`, `✓ Finish Story`) as large, thumb-friendly vertical buttons (one button per row).
- **Dedicated Scrollable Passage Area**: Keep the round thread and Russian story passage scrollable in the upper viewport flex container (`flex-1 overflow-y-auto`) so learners can continuously reference the source story while typing translations.
- **Hide Conflicting Global Bottom Navigation**: Hide the global application bottom tab bar during active translation sessions to prevent layout overlap and maximize usable screen space on mobile.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `translation-story-session`: Add requirements for keyboard-docked mobile input composer, prevention of mobile auto-zoom, and collapsible vertical action controls for mobile viewports.

## Impact

- **Affected Code**:
  - `src/screens/TranslationStorySession.jsx`: Update footer layout, collapsible mobile actions state, and mobile responsive classes.
  - `src/screens/Session.jsx`: Adjust session container sizing for full viewport height during active story sessions.
  - `src/App.jsx`: Hide bottom tab bar during active session step.
  - `index.html`: Update viewport meta tag with `interactive-widget=resizes-content, viewport-fit=cover`.
- **APIs & Dependencies**: No backend or external package changes required. Standard CSS (`100dvh`, visual viewport) and Tailwind utilities.
- **Tests**: Update and add unit tests in `src/__tests__/TranslationStorySession.test.jsx` covering the collapsible action menu, button states, and translation submission.
