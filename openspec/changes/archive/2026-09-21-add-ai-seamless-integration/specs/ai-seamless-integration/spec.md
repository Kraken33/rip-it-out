# Capability Spec: Seamless AI Integration & Voice Coaching

## Capability Overview
The `ai-seamless-integration` capability enables direct API integration with Groq and OpenAI services to automate Speech-to-Text (STT), AI LLM evaluation, and Text-to-Speech (TTS) audio playback, operating in tandem with browser-native Web Speech APIs and existing prompt copy/paste workflows.

---

## Requirement 1: API Keys & Integrations Configuration
The system SHALL provide configuration settings for AI services and audio playback preferences.

### Scenario: User saves a Groq API key
- GIVEN the user is on the Settings screen
- WHEN the user inputs a valid Groq API Key and clicks save
- THEN the key MUST be stored in application settings
- AND the Seamless AI mode MUST become unlocked and available across session screens

### Scenario: User saves an OpenAI API key and selects neural TTS voice
- GIVEN the user has entered an OpenAI API Key in Settings
- WHEN the user selects `OpenAI Neural TTS` engine and chooses voice `nova`
- THEN subsequent audio play requests MUST route to OpenAI's TTS API (`tts-1`) using the `nova` voice

---

## Requirement 2: Dual Mode Navigation (Seamless AI vs Prompt Copy/Paste)
The system SHALL provide a mode switcher allowing users to choose between automated AI processing and manual prompt copy/paste.

### Scenario: User has no API key set
- GIVEN no Groq or OpenAI key is present in settings
- WHEN the user opens a Session or Practice screen
- THEN the default mode MUST be `Prompt Copy/Paste`
- AND selecting `Seamless AI` MUST display an informative callout inviting the user to configure keys in Settings

### Scenario: User with configured key toggles interaction mode
- GIVEN the user has saved a Groq API Key
- WHEN the user views the Session screen
- THEN the system MUST display a mode switch button showing `[ ✨ Seamless AI | 📋 Prompt Copy/Paste ]`
- AND the user can freely toggle to `Prompt Copy/Paste` to manually copy prompts if desired

---

## Requirement 3: Automated In-App Voice Recording & AI Analysis
The system SHALL support capturing spoken audio and sending requests directly to AI models to generate structured improvements.

### Scenario: User speaks a description in Seamless Mode
- GIVEN the user is in a session with `Seamless AI` mode active
- WHEN the user clicks the microphone button and speaks their description
- THEN the system MUST transcribe the speech using STT (Whisper API or Web Speech API)
- AND send the description directly to Groq LLM (`llama-3.3-70b-versatile`)
- AND parse the JSON response automatically into improvement items and SRS cards without user copy/pasting

---

## Requirement 4: Audio Playback for Spoken English Constructions
The system SHALL allow users to listen to spoken pronunciation of constructions and sentences.

### Scenario: User clicks play audio using browser TTS
- GIVEN `Browser Default` TTS is selected in settings
- WHEN the user clicks the `🔊 Play Audio` button on an improvement card
- THEN the system MUST invoke `window.speechSynthesis` with English voice synthesis

### Scenario: User clicks play audio using OpenAI realistic TTS
- GIVEN an OpenAI API Key is configured and `OpenAI Neural TTS` is active
- WHEN the user clicks `🔊 Play Audio` on an improvement card
- THEN the system MUST fetch speech audio from `https://api.openai.com/v1/audio/speech`
- AND stream or play the audio directly in the browser
