# Spec Delta: Russian Practice

## MODIFIED Requirements

### Requirement: Construction Highlighting and Parsing
The system SHALL parse and render target construction annotations in generated Russian passages as interactive highlighted spans that reveal the English target construction on-demand when clicked or tapped, rather than permanently occupying inline text space.

#### Scenario: Rendering highlighted constructions in Russian text
- **WHEN** a Russian passage containing tagged constructions `[[Russian phrase|target construction]]` is received or generated
- **THEN** the UI highlights the Russian phrase visually as an interactive element.

#### Scenario: Revealing target construction on demand
- **WHEN** the user clicks or taps on an interactive highlighted Russian phrase
- **THEN** the UI reveals the corresponding target English construction via an interactive popover or badge tooltip.

### Requirement: Mobile-Responsive Translation Session Layout and Controls
The system SHALL provide an adaptive, touch-friendly, and decluttered layout for the Russian Translation Practice session that accommodates small mobile viewports without clipping content, causing horizontal overflow, or trapping focus, and SHALL maintain simultaneous visibility of the active Russian passage and the translation input when the software keyboard is active by eliminating redundant header layers, avatar gutters, and persistent chip bars.

#### Scenario: Mobile viewport adaptive height and scrolling
- **WHEN** the translation practice session is viewed on a mobile device or narrow screen (<640px wide) with software keyboard open
- **THEN** the session container adapts dynamically to `window.visualViewport.height` without overflowing screen boundaries or causing window jumping
- **AND** the document body scroll is locked and focus scrolling is suppressed instantaneously (`preventScroll: true` / instant zero-scroll lock), eliminating sluggish scroll-back delays when opening the software keyboard
- **AND** the active Russian passage remains continuously visible and readable in the upper viewport while the learner is typing.

#### Scenario: Responsive session header and controls toolbar
- **WHEN** the translation practice session is displayed in an active practice session
- **THEN** outer mode selector tabs, sub-mode selector tabs, separate target chip bars, and redundant screen titles are suppressed in favor of a single compact header bar displaying only the round count and essential controls
- **AND** the Russian passage card renders full width without robot avatars or side gutters
- **AND** the translation textarea occupies full width while auxiliary actions (such as audio recording mic and secondary tools) are placed in a collapsible controls menu to maximize typing space.

#### Scenario: Touch-optimized translation input and guidance
- **WHEN** the translation practice session is rendered on a touch screen / mobile viewport
- **THEN** desktop-specific keyboard shortcut hints are replaced or hidden to maximize vertical space
- **AND** the translation textarea and submit controls render with minimum 16px font size (`text-base`) to prevent iOS zoom while remaining responsive and accessible when the virtual keyboard is active.
