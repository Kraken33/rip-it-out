# Capability Spec: Seamless AI Integration & Voice Coaching

## Purpose
The `ai-seamless-integration` capability enables direct API integration with Groq (Speech-to-Text) and OpenAI (text generation, AI LLM evaluation, and Text-to-Speech audio playback) services, operating in tandem with browser-native Web Speech APIs and existing prompt copy/paste workflows.

## Requirements

### Requirement 1: API Keys & Integrations Configuration
The system SHALL provide configuration settings for AI services and audio playback preferences. The OpenAI API key SHALL be the primary key required for all AI text generation and evaluation features; the Groq API key SHALL be used exclusively for speech-to-text.

#### Scenario: User saves an OpenAI API key
- **GIVEN** the user is on the Settings screen
- **WHEN** the user inputs a valid OpenAI API Key and clicks save
- **THEN** the key MUST be stored in application settings
- **AND** the Seamless AI mode MUST become unlocked and available across session screens

#### Scenario: User selects an OpenAI chat model
- **GIVEN** the user has saved an OpenAI API Key
- **WHEN** the user selects a chat model in Settings (default `gpt-4o-mini`)
- **THEN** the selection MUST be stored in application settings
- **AND** subsequent text generation and evaluation requests MUST use the selected OpenAI model

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

### Requirement 2: Dual Mode Navigation (Seamless AI vs Prompt Copy/Paste)
The system SHALL provide a mode switcher allowing users to choose between automated AI processing and manual prompt copy/paste.

#### Scenario: User has no OpenAI API key set
- **GIVEN** no OpenAI key is present in settings (regardless of whether a Groq key is present)
- **WHEN** the user opens a Session or Practice screen
- **THEN** the default mode MUST be `Prompt Copy/Paste`
- **AND** selecting `Seamless AI` MUST display an informative callout inviting the user to configure an OpenAI key in Settings

#### Scenario: User with configured OpenAI key toggles interaction mode
- **GIVEN** the user has saved an OpenAI API Key
- **WHEN** the user views the Session screen
- **THEN** the system MUST display a mode switch button showing `[ ✨ Seamless AI | 📋 Prompt Copy/Paste ]`
- **AND** the user can freely toggle to `Prompt Copy/Paste` to manually copy prompts if desired

### Requirement 3: Automated In-App Voice Recording & AI Analysis
The system SHALL support capturing spoken audio and sending requests directly to the OpenAI Chat Completions API to generate structured improvements upon completing a session.

#### Scenario: User completes seamless session and triggers end-of-session evaluation
- **GIVEN** the user is in a session with `Seamless AI` mode active and has recorded or typed multiple message turns
- **WHEN** the user clicks "Finish Conversation"
- **THEN** the system MUST join all user messages into a single text block
- **AND** send the combined text to the OpenAI Chat Completions API (`generateSeamlessSessionFeedback`) using the configured OpenAI chat model
- **AND** automatically parse the JSON response into improvement items for review in Step 4

#### Scenario: Text generation is attempted without an OpenAI key
- **GIVEN** only a Groq API key is configured and no OpenAI key is present
- **WHEN** any AI text generation or evaluation action is attempted (session feedback, coach chat reply, translation passage generation, translation evaluation)
- **THEN** the system MUST NOT call the Groq chat completions API
- **AND** MUST surface an error directing the user to configure an OpenAI API key in Settings

### Requirement 4: Audio Playback for Spoken English Constructions
The system SHALL allow users to listen to spoken pronunciation of constructions and sentences.

#### Scenario: User clicks play audio using browser TTS
- **GIVEN** `Browser Default` TTS is selected in settings
- **WHEN** the user clicks the `🔊 Play Audio` button on an improvement card
- **THEN** the system MUST invoke `window.speechSynthesis` with English voice synthesis

#### Scenario: User clicks play audio using OpenAI realistic TTS
- **GIVEN** an OpenAI API Key is configured and `OpenAI Neural TTS` is active
- **WHEN** the user clicks `🔊 Play Audio` on an improvement card
- **THEN** the system MUST fetch speech audio from `https://api.openai.com/v1/audio/speech`
- **AND** stream or play the audio directly in the browser

### Requirement: Sentence Context Tracking for Improvements
The system SHALL capture and store the full sentence or message context (`context`) alongside each improvement registered to the study list.

#### Scenario: SRS card created with sentence context
- **WHEN** an improvement is added from a seamless chat message turn
- **THEN** the created improvement record and corresponding SRS card MUST include the sentence context string.

### Requirement: Speech-to-Text Provider Routing
The system SHALL transcribe recorded audio using the Groq Whisper API when a Groq API key is configured, and SHALL fall back to the OpenAI Whisper API when only an OpenAI key is configured.

#### Scenario: Transcription with a Groq API key configured
- **GIVEN** a Groq API key is present in settings
- **WHEN** the user records audio and transcription is requested
- **THEN** the system MUST send the audio to `https://api.groq.com/openai/v1/audio/transcriptions` using the `whisper-large-v3` model

#### Scenario: Transcription with only an OpenAI API key configured
- **GIVEN** no Groq key is present but an OpenAI API key is configured
- **WHEN** the user records audio and transcription is requested
- **THEN** the system MUST send the audio to `https://api.openai.com/v1/audio/transcriptions` using the `whisper-1` model

#### Scenario: Transcription without any API key
- **GIVEN** neither a Groq nor an OpenAI key is configured
- **WHEN** transcription is requested
- **THEN** the system MUST surface an error prompting the user to configure an API key in Settings
