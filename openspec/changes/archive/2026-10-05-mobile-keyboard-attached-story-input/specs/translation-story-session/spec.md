# Spec Delta

## ADDED Requirements

### Requirement: Mobile viewport keyboard-attached composer and collapsible action menu

The system SHALL provide a mobile-responsive story translation interface that pins the translation composer dock above the software keyboard within dynamic viewport bounds (`100dvh`), prevents iOS Safari automatic focus zoom by ensuring a minimum 16px font size on mobile viewports, keeps the active Russian story passage continuously visible and scrollable in the upper viewport, and collapses secondary session controls into a single toggle on mobile screens that reveals full-width vertical buttons when expanded.

#### Scenario: Mobile input composer remains attached above software keyboard
- **WHEN** the user opens or focuses the translation text area on a mobile viewport
- **THEN** the composer dock remains attached directly above the software keyboard and bottom safe area without jumping, erratic resizing, or obscuring the Russian story passage.

#### Scenario: Preventing iOS Safari auto-zoom on mobile text input
- **WHEN** the user taps or focuses the translation input text area on a mobile device
- **THEN** the input text area renders with a font size of at least 16px (`text-base`), preventing automatic browser zoom and horizontal viewport shifting.

#### Scenario: Collapsible action controls display a single toggle button when collapsed on mobile
- **WHEN** the story translation session is viewed on a mobile viewport in default or typing mode
- **THEN** secondary action controls are collapsed behind a single action toggle button (`Actions ▲`), keeping the composer compact and maximizing reading room for the Russian passage.

#### Scenario: Collapsible action controls display vertical full-width buttons when expanded on mobile
- **WHEN** the user taps the action toggle button to expand controls on a mobile viewport
- **THEN** the system displays the action controls (`🎙️ Speak`, `✨ Flavor`, `Next Round →`, `Finish Story ✓`) as a vertical stack of full-width buttons.

#### Scenario: Desktop view preserves standard horizontal controls
- **WHEN** the story translation session is viewed on desktop viewports
- **THEN** the action buttons are displayed directly in the composer footer without requiring expansion toggles.
