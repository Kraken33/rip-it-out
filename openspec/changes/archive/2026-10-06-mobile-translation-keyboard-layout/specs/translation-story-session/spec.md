# Spec Delta

## MODIFIED Requirements

### Requirement: Mobile viewport keyboard-attached composer and collapsible action menu

The system SHALL provide a mobile-responsive story translation interface that pins the translation composer dock directly above the software keyboard within dynamic visual viewport bounds (`window.visualViewport.height`), prevents iOS Safari automatic focus zoom by ensuring a minimum 16px font size on mobile viewports, keeps the active Russian story passage continuously visible and readable in the upper pane during active translation, locks document body scrolling and suppresses browser auto-scroll animations instantaneously on input focus, provides a full-width translation textarea, and consolidates secondary session controls under a collapsible menu to preserve maximum space for simultaneous reading and typing.

#### Scenario: Mobile input composer remains attached above software keyboard
- **WHEN** the user opens or focuses the translation text area on a mobile viewport and the software keyboard appears
- **THEN** the session container height dynamically adjusts to match `window.visualViewport.height`
- **AND** the document body scrolling is locked and focus auto-scroll is suppressed instantaneously (`preventScroll: true` / instant position lock), preventing sluggish scrolling delays and layout stutter
- **AND** the composer dock remains attached directly above the software keyboard and bottom safe area without jumping, and the translation textarea occupies full width.

#### Scenario: Preventing iOS Safari auto-zoom on mobile text input
- **WHEN** the user taps or focuses the translation input text area on a mobile device
- **THEN** the input text area renders with a font size of at least 16px (`text-base`), preventing automatic browser zoom and horizontal viewport shifting.

#### Scenario: Collapsible action controls display a single toggle button when collapsed on mobile
- **WHEN** the story translation session is viewed on a mobile viewport in default or typing mode
- **THEN** secondary action controls are collapsed behind an action toggle button or collapsible drawer, keeping the composer compact, allowing the textarea to take full width, and maximizing reading room for the Russian passage.

#### Scenario: Collapsible action controls display vertical full-width buttons when expanded on mobile
- **WHEN** the user taps the action menu toggle to expand controls on a mobile viewport
- **THEN** the system displays the action controls (`🎙️ Speak`, `✨ Flavor`, `Next Round →`, `Finish Story ✓`) cleanly as collapsible drawer items without obstructing active typing.

#### Scenario: Desktop view preserves standard horizontal controls
- **WHEN** the story translation session is viewed on desktop viewports
- **THEN** the action buttons are displayed directly in the composer footer without requiring expansion toggles.
