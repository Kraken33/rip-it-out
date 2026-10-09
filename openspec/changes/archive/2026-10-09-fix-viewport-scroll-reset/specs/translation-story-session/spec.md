# Spec Delta

## MODIFIED Requirements

### Requirement: Mobile viewport keyboard-attached composer and collapsible action menu

The system SHALL provide a mobile-responsive story translation interface that pins the translation composer dock directly above the software keyboard within dynamic visual viewport bounds (`window.visualViewport.height`), prevents iOS Safari automatic focus zoom by ensuring a minimum 16px font size on mobile viewports, keeps the active Russian story passage continuously visible and readable in the upper pane during active translation, automatically scrolls the message thread to the active round's Russian passage upon translation textarea focus and upon virtual keyboard opening/viewport resize, locks document body scrolling and suppresses browser auto-scroll animations instantaneously on input focus strictly while the full-screen translation session is active, preserves standard page and window scrolling whenever body scroll locking is not active (including session configuration and review steps), suppresses the top session header on mobile screens (< 640px), and consolidates all session actions and metadata under a collapsible Actions HUD to preserve maximum space for simultaneous reading and typing.

#### Scenario: Mobile input composer remains attached above software keyboard
- **WHEN** the user opens or focuses the translation text area on a mobile viewport and the software keyboard appears
- **THEN** the session container height dynamically adjusts to match `window.visualViewport.height`
- **AND** the document body scrolling is locked and focus auto-scroll is suppressed instantaneously (`preventScroll: true` / instant position lock), preventing sluggish scrolling delays and layout stutter
- **AND** the composer dock remains attached directly above the software keyboard and bottom safe area without jumping, and the translation textarea occupies full width.

#### Scenario: Normal page scrolling is preserved when body scroll lock is disabled
- **WHEN** a user navigates to practice session setup (Step 1 Details, Free Dialogue configuration, Story Translation configuration), export, or import review screens where body scroll lock is inactive
- **THEN** window scroll events SHALL NOT be intercepted or reset to top (`0, 0`)
- **AND** the user can scroll to the bottom of the page to access all form inputs and the session start or confirm buttons.

#### Scenario: Auto-scrolling to active story passage on input focus and keyboard opening
- **WHEN** the user focuses the translation input text area or the virtual keyboard opens in a translation story session
- **THEN** the message scroll container automatically scrolls to display the active round's Russian story passage directly above the composer dock
- **AND** the active passage remains visible in the shrunken viewport instead of showing earlier dialogue history.

#### Scenario: Mobile top header suppression and minimal composer bar
- **WHEN** the story translation session is viewed on a mobile viewport (< 640px)
- **THEN** the top session header (displaying round count, vibe badge, flavor button, next round, and finish buttons) is completely hidden
- **AND** the bottom composer toolbar renders only the full-width textarea and the `⚡ Actions (Round N)` toggle button, hiding inline dictation and translate submit buttons on mobile.

#### Scenario: Mobile Actions HUD consolidated story controls
- **WHEN** the user taps the Actions HUD toggle on a mobile viewport
- **THEN** the HUD panel opens displaying the round index and vibe badge in the header
- **AND** the HUD provides full-width accessible controls for `🎙️ Speak Answer` (audio dictation), `▶ Translate Translation` (submit), `✨ Tune Story Flavor` (matrix drawer toggle), `➡️ Next Round`, and `✓ Finish Story`.

#### Scenario: Preventing iOS Safari auto-zoom on mobile text input
- **WHEN** the user taps or focuses the translation input text area on a mobile device
- **THEN** the input text area renders with a font size of at least 16px (`text-base`), preventing automatic browser zoom and horizontal viewport shifting.

#### Scenario: Desktop view preserves standard horizontal controls
- **WHEN** the story translation session is viewed on desktop viewports (>= 640px)
- **THEN** the top session header bar and bottom composer toolbar display standard inline buttons (`Next Round`, `Finish Story`, `Flavor`, `Translate`, `Speak`) without requiring collapsible expansion.
