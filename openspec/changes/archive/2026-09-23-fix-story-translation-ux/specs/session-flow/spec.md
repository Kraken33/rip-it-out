# Spec Delta

## MODIFIED Requirements

### Requirement: Session activity selection

The system SHALL let the user pick a session activity (`dialogue` or `translation`) at the TOP of the New Session setup form, before any other input, and SHALL render a different Step-2 interface per activity under the same Step-1/Step-4 shell. Step-1 detail fields SHALL be activity-conditional: title, source type, tags, and notes are shown only for the `dialogue` activity; the `translation` activity shows an optional story topic/demands field instead.

#### Scenario: Activity selector comes first
- **WHEN** the user opens the New Session setup step
- **THEN** the activity selector is the first control in the form, above every other input.

#### Scenario: Picking dialogue activity
- **WHEN** the user selects the dialogue activity
- **THEN** the title, source type, tags, and notes fields are displayed, and Step 2 displays the existing free-dialogue chat interface.

#### Scenario: Picking translation activity
- **WHEN** the user selects the translation activity
- **THEN** the title, source type, tags, and notes fields are NOT displayed, an optional story topic/demands field is displayed instead, and Step 2 displays the story-translation round interface.

#### Scenario: Activity is stored on the session
- **WHEN** a session is created with an activity selected
- **THEN** the session record carries the `activity` marker so Library replay and stats route to the matching viewer.

## ADDED Requirements

### Requirement: Optional story topic guidance at session setup

The system SHALL offer an optional free-text story topic/demands field on the New Session setup step when the translation activity is selected, and SHALL carry its value into the translation session.

#### Scenario: User provides story demands
- **WHEN** the user enters story topic/demands text and starts a translation session
- **THEN** the translation session receives the demands so generated stories can be grounded in them.

#### Scenario: User leaves story demands empty
- **WHEN** the user leaves the story topic/demands field blank and starts a translation session
- **THEN** the translation session starts without topic guidance and stories may cover any everyday topic.
