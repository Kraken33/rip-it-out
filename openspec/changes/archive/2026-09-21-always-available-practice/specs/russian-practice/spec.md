# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-Round Russian Translation Practice
The system SHALL batch top upcoming or due SRS cards into rounds for practice. When zero cards are due today, the system SHALL select the top 5 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 5 upcoming cards when zero cards are due today) sorted by schedule and presents them for practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches the top 5 upcoming ("coming soon") cards sorted by scheduled review date and generates prompts/sessions for practice.
