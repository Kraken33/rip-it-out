# Spec Delta

## ADDED Requirements

### Requirement: Optional raw conversation text input during import
The system SHALL provide an optional multi-line text input field on the session import step for users to paste their raw conversation text (`rawText`).

#### Scenario: User provides raw conversation text
- **WHEN** the user pastes text into the optional raw text field and confirms import
- **THEN** the session entity is saved with `rawText` containing the provided string.

#### Scenario: User skips optional raw conversation text
- **WHEN** the user leaves the optional raw text field blank and confirms import
- **THEN** the session entity is saved with `rawText` set to `null`.
