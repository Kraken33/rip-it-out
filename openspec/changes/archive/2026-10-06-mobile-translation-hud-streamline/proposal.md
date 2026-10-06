# Proposal

## Why

On mobile devices, vertical viewport space during Russian translation practice and story sessions is severely constrained, especially when the software keyboard is active (often leaving < 350px of visible height). The persistent top header bar (containing round count, badges, and finish buttons) and inline composer buttons (mic and translate) consume critical vertical real estate that should be dedicated to reading the Russian passage and viewing feedback. 

Removing the top header bar on mobile viewports and moving all session actions and metadata into the collapsible Actions HUD maximizes reading room and creates an uncluttered, distraction-free translation interface.

## What Changes

- **Hide Top Header Bar on Mobile**: Suppress the top session header bar completely on mobile screens (`< 640px` / `< sm`) across both Russian Translation Practice (`TranslationPracticeSession.jsx`) and Russian Translation Story (`TranslationStorySession.jsx`) sessions. Desktop viewports (`>= 640px`) continue to display the standard top header bar.
- **Move Session Status into Actions HUD**: Relocate the Round counter, practiced count, and vibe/flavor badges into the header of the mobile Actions HUD drawer.
- **Move Mobile Primary Actions into HUD**: On mobile viewports, move the AudioRecorder (Speak / Dictate) and the Translate submit button inside the Actions HUD drawer instead of rendering them inline on the composer bar.
- **Ultra-Compact Mobile Composer Dock**: Reduce the mobile composer bottom dock to only the full-width translation `<textarea>` and the `⚡ Actions (Round N)` toggle trigger.
- **Unified Story & Practice Experience**: Standardize this HUD behavior across both Translation Practice Session and Translation Story Session components.

## Capabilities

### Modified Capabilities
- `russian-practice`: Update `Mobile-Responsive Translation Session Layout and Controls` to require hiding the top header bar on mobile screens and consolidating all session actions (Translate, Dictation, Next Round, Finish, Exit) and round status inside the collapsible Actions HUD.
- `translation-story-session`: Update `Mobile viewport keyboard-attached composer and collapsible action menu` to require hiding the top header bar on mobile screens and housing all action controls (Translate, Dictate, Flavor Matrix, Next Round, Finish Story) and round vibe/status inside the Actions HUD.

## Impact

- **Affected Code**: `src/screens/TranslationPracticeSession.jsx`, `src/screens/TranslationStorySession.jsx`, and their associated unit/integration tests in `src/__tests__/TranslationPracticeSession.test.jsx` and `src/__tests__/TranslationStorySession.test.jsx`.
- **Dependencies & APIs**: No external dependency changes or API changes.
