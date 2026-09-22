# Delta Spec: Seamless AI Integration & Voice Coaching

## MODIFIED Requirements

### Requirement 1: API Keys & Integrations Configuration
The system SHALL provide configuration settings for AI services and audio playback preferences. The OpenAI API key SHALL be the primary key required for all AI text generation and evaluation features; the Groq API key SHALL be used exclusively for speech-to-text. The OpenAI chat model SHALL be selected from a dropdown selector listing the supported model catalog: `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.5-pro`, `gpt-5.4`, `gpt-5.4-pro`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.3-codex`, `gpt-5.2`, `gpt-5.2-pro`, `gpt-5.1`, `gpt-5`, `gpt-5-pro`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o-mini`.

#### Scenario: User saves an OpenAI API key
- **GIVEN** the user is on the Settings screen
- **WHEN** the user inputs a valid OpenAI API Key and clicks save
- **THEN** the key MUST be stored in application settings
- **AND** the Seamless AI mode MUST become unlocked and available across session screens

#### Scenario: User selects an OpenAI chat model
- **GIVEN** the user has saved an OpenAI API Key
- **WHEN** the user selects a chat model from the dropdown selector in Settings (default `gpt-4o-mini`)
- **THEN** the selection MUST be stored in application settings
- **AND** subsequent text generation and evaluation requests MUST use the selected OpenAI model

#### Scenario: Stored model is not in the catalog
- **GIVEN** settings contain an `openaiModel` value that is not part of the current catalog (e.g. legacy `gpt-4o`)
- **WHEN** the user opens the Settings screen
- **THEN** the selector MUST display the stored value as the current selection (as an additional option)
- **AND** the stored value MUST continue to be sent to the OpenAI API unchanged until the user picks a catalog model

#### Scenario: User saves an OpenAI API key and selects neural TTS voice
- **GIVEN** the user has entered an OpenAI API Key in Settings
- **WHEN** the user selects `OpenAI Neural TTS` engine and chooses voice `nova`
- **THEN** subsequent audio play requests MUST route to OpenAI's TTS API (`tts-1`) using the `nova` voice

#### Scenario: User saves a Groq API key
- **GIVEN** the user is on the Settings screen
- **WHEN** the user inputs a valid Groq API Key and clicks save
- **THEN** the key MUST be stored in application settings
- **AND** speech-to-text transcription MUST become available
- **AND** the Groq key MUST NOT unlock or be used for AI text generation or evaluation features

## ADDED Requirements

### Requirement: Multi-line Message Input for Seamless Sessions
The system SHALL provide a multi-line text area for typing chat messages in a Seamless AI session, so that long or multi-sentence answers can be comfortably read and edited before sending.

#### Scenario: User types a multi-line answer
- **GIVEN** the user is in an active Seamless AI session
- **WHEN** the user types text and presses Enter
- **THEN** a newline MUST be inserted into the text area
- **AND** the message MUST NOT be sent

#### Scenario: User submits a typed message
- **GIVEN** the user has typed a non-empty message into the text area
- **WHEN** the user clicks the Send button or presses Ctrl/Cmd+Enter
- **THEN** the message MUST be sent to the AI coach
- **AND** the text area MUST be cleared

#### Scenario: Transcribed speech lands in the text area
- **GIVEN** the user is in an active Seamless AI session with text already present in the text area
- **WHEN** a voice recording is transcribed
- **THEN** the transcription MUST be inserted into the text area content
- **AND** previously typed text MUST be preserved
