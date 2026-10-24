# Spec Delta

## MODIFIED Requirements

### Requirement: Dual Mode Navigation (Seamless AI vs Prompt Copy/Paste)
The system SHALL operate exclusively in Seamless AI mode across all session and practice workflows, removing the dual-mode switcher and manual prompt copy/paste alternatives. When an OpenAI API key is missing or not configured, the system SHALL display an inline configuration reminder or error guidance directing the user to configure their OpenAI API key in Settings rather than offering a fallback prompt copy/paste mode.

#### Scenario: User has no OpenAI API key set
- **GIVEN** no OpenAI key is configured in settings
- **WHEN** the user opens a dialogue session or interactive practice screen
- **THEN** the system MUST NOT display a mode toggle or prompt copy/paste interface
- **AND** the system MUST display a callout directing the user to configure an OpenAI API key in Settings to use interactive AI sessions.

#### Scenario: User with configured OpenAI key toggles interaction mode
- **GIVEN** the user has configured an OpenAI API key
- **WHEN** the user views the Session or Practice screens
- **THEN** the system MUST NOT render any mode switcher button
- **AND** the session MUST run directly in Seamless AI interactive mode.
