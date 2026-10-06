# Spec Delta

## MODIFIED Requirements

### Requirement: Mobile-Responsive Translation Session Layout and Controls
The system SHALL provide an adaptive, touch-friendly, and decluttered layout for the Russian Translation Practice session that accommodates small mobile viewports without clipping content, causing horizontal overflow, or trapping focus, SHALL maintain simultaneous visibility of the active Russian passage and the translation input when the software keyboard is active, and SHALL suppress the top session header on mobile devices while consolidating all session controls and status within a collapsible Actions HUD.

#### Scenario: Mobile viewport adaptive height and scrolling
- **WHEN** the translation practice session is viewed on a mobile device or narrow screen (<640px wide) with software keyboard open
- **THEN** the session container adapts dynamically to `window.visualViewport.height` without overflowing screen boundaries or causing window jumping
- **AND** the document body scroll is locked and focus scrolling is suppressed instantaneously (`preventScroll: true` / instant zero-scroll lock), eliminating sluggish scroll-back delays when opening the software keyboard
- **AND** the active Russian passage remains continuously visible and readable in the upper viewport while the learner is typing.

#### Scenario: Mobile top header suppression and ultra-compact dock
- **WHEN** the translation practice session is rendered on a mobile device or screen width below 640px
- **THEN** the top session header bar (including round count, practiced badge, next round, and finish buttons) is completely hidden
- **AND** the bottom composer dock renders an ultra-compact toolbar containing only the full-width translation textarea and a single Actions toggle button displaying the active round count (e.g. `⚡ Actions (Round 1)`), omitting inline dictation and translate submit buttons.

#### Scenario: Mobile Actions HUD consolidated controls
- **WHEN** the user opens the collapsible Actions HUD on a mobile viewport
- **THEN** the HUD panel displays the round indicator and practiced cards count in its header alongside a close control
- **AND** the HUD panel renders full-width action buttons for `🎙️ Speak Answer` (audio dictation), `▶ Translate Translation` (submit), `➡️ Next Round`, `✓ Finish Practice & Rate Recall`, and optional `Exit to Practice Modes`.

#### Scenario: Desktop view preserves standard header and composer toolbar
- **WHEN** the translation practice session is viewed on a desktop viewport (>= 640px wide)
- **THEN** the top header bar displays the round count, practiced count, Next Round, and Finish buttons directly
- **AND** the bottom composer toolbar displays inline dictation recording and the Translate submit button beside the textarea.

#### Scenario: Touch-optimized translation input and guidance
- **WHEN** the translation practice session is rendered on a touch screen / mobile viewport
- **THEN** desktop-specific keyboard shortcut hints are replaced or hidden to maximize vertical space
- **AND** the translation textarea and submit controls render with minimum 16px font size (`text-base`) to prevent iOS zoom while remaining responsive and accessible when the virtual keyboard is active.
