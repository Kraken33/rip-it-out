# Spec Delta

## MODIFIED Requirements

### Requirement: Mobile-Responsive Translation Session Layout and Controls
The system SHALL provide an adaptive, touch-friendly layout for the Russian Translation Practice session that accommodates small mobile viewports without clipping content, causing horizontal overflow, or trapping focus, and SHALL maintain simultaneous visibility of the active Russian passage and the translation input when the software keyboard is active.

#### Scenario: Mobile viewport adaptive height and scrolling
- **WHEN** the translation practice session is viewed on a mobile device or narrow screen (<640px wide) with software keyboard open
- **THEN** the session container adapts dynamically to `window.visualViewport.height` without overflowing screen boundaries or causing window jumping
- **AND** the document body scroll is locked and focus scrolling is suppressed instantaneously (`preventScroll: true` / instant zero-scroll lock), eliminating sluggish scroll-back delays when opening the software keyboard
- **AND** the active Russian passage remains continuously visible and readable in the upper viewport while the learner is typing.

#### Scenario: Responsive session header and controls toolbar
- **WHEN** the translation practice session is displayed on a mobile viewport
- **THEN** the header elements (round indicator and title) wrap cleanly without horizontal overflow
- **AND** the translation textarea occupies full width while auxiliary actions (such as audio recording mic and secondary tools) are placed in a collapsible controls menu to maximize horizontal typing space.

#### Scenario: Touch-optimized translation input and guidance
- **WHEN** the translation practice session is rendered on a touch screen / mobile viewport
- **THEN** desktop-specific keyboard shortcut hints are replaced or hidden to maximize vertical space
- **AND** the translation textarea and submit controls render with minimum 16px font size (`text-base`) to prevent iOS zoom while remaining responsive and accessible when the virtual keyboard is active.
