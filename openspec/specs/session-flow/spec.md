# Session Flow Specification

## Purpose
Guide users through session setup, prompt copying, JSON pasting, and import confirmation.

## Requirements

### Requirement: Title Autofill
Selecting a previously used session title must pre-fill form fields and link to existing topic.
When a user selects a previously used title during session creation, the system SHALL pre-fill the source type, tags, and notes fields from the most recent session with that title AND transparently attach the new session to the existing topic entity for that title.

#### Scenario: Selecting Previous Title
- **WHEN** user selects a previous session title from the dropdown selector
- **THEN** Title, Source Type, Tags, and Notes are automatically populated from the matching session.

#### Scenario: Autofill pre-populates form from prior session
- **WHEN** a user selects an existing title from the title suggestions
- **THEN** the source type, tags, and notes fields are pre-filled from the most recent session with that title

#### Scenario: New session links to existing topic when title matches
- **WHEN** a user submits the new session form with a title matching an existing topic
- **THEN** the created session has its `topicId` set to the matching topic's id

#### Scenario: New session creates new topic when title is novel
- **WHEN** a user submits the new session form with a title that matches no existing topic
- **THEN** a new topic entity is created and the session's `topicId` references it

### Requirement: Optional raw conversation text input during import
The system SHALL provide an optional multi-line text input field on the session import step for users to paste their raw conversation text (`rawText`).

#### Scenario: User provides raw conversation text
- **WHEN** the user pastes text into the optional raw text field and confirms import
- **THEN** the session entity is saved with `rawText` containing the provided string.

#### Scenario: User skips optional raw conversation text
- **WHEN** the user leaves the optional raw text field blank and confirms import
- **THEN** the session entity is saved with `rawText` set to `null`.
