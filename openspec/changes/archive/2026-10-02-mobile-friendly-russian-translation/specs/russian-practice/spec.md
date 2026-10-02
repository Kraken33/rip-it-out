# Spec Delta

## ADDED Requirements

### Requirement: Mobile-Responsive Translation Session Layout and Controls
The system SHALL provide an adaptive, touch-friendly layout for the Russian Translation Practice session that accommodates small mobile viewports without clipping content, causing horizontal overflow, or trapping focus.

#### Scenario: Mobile viewport adaptive height and scrolling
- **WHEN** the translation practice session is viewed on a mobile device or narrow screen (<640px wide)
- **THEN** the session container adapts dynamically to the viewport height without overflowing the screen boundaries
- **AND** the message history thread remains smoothly scrollable with visible Russian passages and feedback verdicts.

#### Scenario: Responsive session header and controls toolbar
- **WHEN** the translation practice session is displayed on a mobile viewport
- **THEN** the header elements (round indicator and title) wrap cleanly without horizontal overflow
- **AND** the bottom action toolbar (audio recorder, round controls, and translation submit button) arranges controls responsively with minimum 44px touch targets.

#### Scenario: Touch-optimized translation input and guidance
- **WHEN** the translation practice session is rendered on a touch screen / mobile viewport
- **THEN** desktop-specific keyboard shortcut hints are replaced or hidden to maximize vertical space
- **AND** the translation textarea and submit controls remain accessible and responsive when the virtual keyboard is active.
