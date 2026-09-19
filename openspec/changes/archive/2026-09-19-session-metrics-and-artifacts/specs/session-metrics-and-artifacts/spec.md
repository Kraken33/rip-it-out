# Spec Delta

## Purpose

Provides interactive text artifact viewing with inline phrase corrections and comprehensive word volume metrics for sessions, topics, dashboard widgets, and the statistics page.

## ADDED Requirements

### Requirement: Interactive conversation text viewer
The system SHALL provide an interactive text artifact viewer modal for sessions containing `rawText`, displaying the user's raw text with inline phrase corrections where original phrases matching `improvement.original` are styled with red strikethrough followed by the improved phrasing in green.

#### Scenario: Opening text artifact viewer
- **WHEN** user clicks "View Conversation" on a session with `rawText`
- **THEN** a modal opens displaying the raw text parsed with matched improvements highlighted inline as red strikethrough (original) and green text (improved).

#### Scenario: Tooltip on inline correction
- **WHEN** user hovers or taps an inline correction in the artifact viewer
- **THEN** a tooltip or popover displays the improvement's explanation text.

### Requirement: On-the-fly word metrics computation
The system SHALL compute total words, unique words, and vocabulary density on-the-fly from a session's `rawText`.

#### Scenario: Session with raw text computes metrics
- **WHEN** word metrics are requested for a session with non-null `rawText`
- **THEN** `totalWords` equals the count of words, `uniqueWords` equals distinct case-insensitive words, and `vocabularyDensity` equals `uniqueWords / totalWords`.

#### Scenario: Session without raw text handles missing metrics
- **WHEN** word metrics are requested for a session with null `rawText`
- **THEN** word metrics return zero/null values gracefully without throwing errors.

### Requirement: Dashboard stats widget displays words today
The system SHALL include a "Words Today" metric in the Dashboard stats widget showing the sum of words from sessions created today that contain `rawText`.

#### Scenario: Dashboard stats widget renders daily words
- **WHEN** the dashboard stats widget is rendered
- **THEN** it displays "Words Today" matching total words from sessions logged on the current calendar date.

### Requirement: Statistics page writing metrics section
The system SHALL display a dedicated "Writing Metrics" section on the Statistics page presenting all-time total words, unique words, average vocabulary density, and a per-topic writing metrics table.

#### Scenario: Viewing statistics page writing metrics
- **WHEN** user navigates to the Stats screen
- **THEN** all-time word counts, vocabulary density, and per-topic word metrics table are displayed.
