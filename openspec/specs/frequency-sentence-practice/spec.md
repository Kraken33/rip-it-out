# Frequency Sentence Practice Specification

## Purpose
Enables learners to stream frequency-ranked English-Russian sentence pairs page-by-page from Manythings, triage them into spaced repetition or discard them, and practice challenging sentences with AI-generated interactive mini-drills.

## Requirements

### Requirement: Dynamic Manythings Page Streaming and Deduplication
The system SHALL dynamically fetch sentence pairs for a requested page number from `https://www.manythings.org/bilingual/rus/{page}.js` without violating cross-origin resource sharing rules, and SHALL parse and deduplicate records into 1-to-1 English-Russian sentence pairs.

#### Scenario: Streaming a valid page
- **WHEN** user opens frequency practice or advances to the next page
- **THEN** system loads the corresponding Manythings script payload, parses the tab-separated sentence records, deduplicates pairs, and populates the current sentence queue

#### Scenario: Network error or failed script load
- **WHEN** loading `page.js` fails due to network outage or invalid page
- **THEN** system presents a descriptive error message and offers a "Retry Page" button and an option to change the target page number

### Requirement: Flashcard Practice and Direction Toggle
The system SHALL present the active sentence in a flashcard interface displaying the source prompt sentence, an audio pronunciation playback button, a "Reveal" action to expose the target translation, and a direction toggle between Russian-to-English and English-to-Russian.

#### Scenario: Reveal translation
- **WHEN** user views a sentence card and triggers "Reveal Translation" (or presses Space)
- **THEN** system displays the corresponding translation alongside its audio playback button and reveals the rating buttons

#### Scenario: Switching translation direction
- **WHEN** user toggles prompt direction from Russian-first to English-first
- **THEN** the active card and subsequent cards immediately display English on the front and reveal Russian upon flipping

### Requirement: First-Encounter SRS Triage
The system SHALL provide four rating actions on revealed cards (`Easy`, `Good`, `Hard`, `Again`) and apply immediate triage rules based on user rating.

#### Scenario: Rating Easy skips without saving to SRS
- **WHEN** user selects `Easy` on an unpracticed sentence
- **THEN** system advances immediately to the next sentence without creating an SRS card or initiating a drill

#### Scenario: Rating Good saves to SRS and advances
- **WHEN** user selects `Good` on an unpracticed sentence
- **THEN** system saves the sentence pair as an improvement and SRS card with initial review interval, and immediately advances to the next sentence

#### Scenario: Rating Hard or Again enters interactive drill
- **WHEN** user selects `Hard` or `Again` on a sentence
- **THEN** system saves the sentence pair to SRS with learning status and initiates an interactive mini-drill session for that sentence

### Requirement: Interactive AI Mini-Drill Session
The system SHALL initiate an interactive mini-drill session anchored directly to the active sentence when a user rates a card as `Again` or `Hard`. In Phase 1, the system SHALL immediately prompt the learner to translate the exact active sentence in the active study direction without preliminary AI generation latency, evaluate the attempt directly against the target sentence, and allow proceeding to the next card or invoking Phase 2. In Phase 2, the system SHALL generate a context variation strictly retaining and reinforcing the exact target construction or phrasal verb, and evaluate the user's attempt without substituting core vocabulary.

#### Scenario: Generating and completing a mini-drill
- **WHEN** user selects `Again` or `Hard` on an active frequency card
- **THEN** system immediately enters the mini-drill displaying the active card's prompt in the current session direction without network spinner delay, enabling text or microphone speech-to-text input for direct recall

#### Scenario: Submitting translation attempt
- **WHEN** user submits their translation text or voice transcription
- **THEN** system evaluates the response directly against the active sentence's reference translation, displaying naturalness verdict, corrected rewrite, and grammatical feedback while preserving the target phrase, alongside options to "Try another drill" or "Continue to next sentence"

#### Scenario: Triggering Phase 2 anchored variation drill
- **WHEN** user chooses to try a variation drill after Phase 1 evaluation
- **THEN** system prompts the AI to generate a new sentence strictly locked to the active card's target construction or phrasal verb, presents the variation prompt, and evaluates the learner's subsequent translation attempt against the anchored reference translation

### Requirement: Pagination State Persistence
The system SHALL persist the user's active page number and sentence index so learners resume practice exactly where they left off across browser sessions.

#### Scenario: Resuming session across page reload
- **WHEN** user reloads the application or returns to frequency practice
- **THEN** system restores the previously saved page number and sentence index
