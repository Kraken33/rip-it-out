# Spec Delta

## MODIFIED Requirements

### Requirement: Harvested construction is saved to the vault

The system SHALL persist an accepted construction as a vault improvement linked to the active session, SHALL create its SRS card, SHALL record the source block text as its sentence context, and SHALL present explicit error feedback if persistence fails rather than silently aborting or falsely indicating success.

#### Scenario: Accepting a construction
- **WHEN** the learner chooses the add action on a preview card
- **THEN** the construction is stored as a vault improvement linked to the active session, its SRS card is created, and the card reports that it was saved.

#### Scenario: Harvested construction appears in Library
- **WHEN** a construction has been harvested from a session
- **THEN** it is listed in the Library as a vault item scoped to that session.

#### Scenario: Sentence context is stored
- **WHEN** a construction is harvested
- **THEN** its vault record carries the full source block text as its sentence context.

#### Scenario: Several harvests from one block
- **WHEN** the learner extracts more than one construction from the same block
- **THEN** each accepted construction becomes its own vault improvement and SRS card.

#### Scenario: Persistence failure surfaces explicit error
- **WHEN** saving an extracted construction fails due to a missing session ID, network issue, or database rejection
- **THEN** an error message is presented on the extraction card, the card does not transition to a saved state, and the learner is offered an option to retry.
