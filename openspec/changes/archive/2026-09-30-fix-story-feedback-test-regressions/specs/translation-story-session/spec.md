# Spec Delta

## MODIFIED Requirements

### Requirement: Per-round improved version for daily speaking

The system SHALL return, for each submitted translation, an improved version that is comprehensive, fluent, and optimized for daily speaking, preserving the learner's meaning, and SHALL NOT require or generate candidate constructions for the round.

#### Scenario: Improved version preserves meaning
- **WHEN** the learner submits an English translation of a story passage
- **THEN** the improved version keeps the learner's meaning and wording where natural, fixes errors, and uses fluent spoken phrasing rather than formal written style.

#### Scenario: Correct translation is affirmed
- **WHEN** the submitted translation is already natural and fluent
- **THEN** the system affirms success and presents no invented rewrite.

#### Scenario: Unparsable feedback is preserved
- **WHEN** the per-round feedback response cannot be parsed into the expected structure
- **THEN** the system displays the raw feedback text in the round thread, marks structured extraction as unavailable, and offers retry without discarding the learner's translation.

#### Scenario: Feedback rendering handles missing constructions safely
- **WHEN** the per-round feedback object lacks a `constructions` array
- **THEN** the UI renders the summary and improved version without runtime errors.
