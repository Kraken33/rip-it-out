# Spec Delta

## Purpose

Enables learners to stream frequency-ranked English-Russian sentence pairs page-by-page from Manythings, triage them into spaced repetition or discard them, and practice challenging sentences with AI-generated interactive mini-drills.

## ADDED Requirements

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
The system SHALL invoke the AI service to generate a similar Russian practice sentence reinforcing the difficult pattern or vocabulary, accept user translation through text or voice transcription, evaluate the user's attempt, and provide immediate actionable feedback.

#### Scenario: Generating and completing a mini-drill
- **WHEN** user enters a drill for a difficult sentence
- **THEN** system prompts the AI to generate a new contextually similar sentence, displays it to the user, and enables text or microphone speech-to-text input

#### Scenario: Submitting translation attempt
- **WHEN** user submits their translation text or voice transcription
- **THEN** system evaluates the response via AI, displaying naturalness verdict, corrected rewrite, and grammatical notes, alongside options to "Try another drill" or "Continue to next sentence"

### Requirement: Pagination State Persistence
The system SHALL persist the user's active page number and sentence index so learners resume practice exactly where they left off across browser sessions.

#### Scenario: Resuming session across page reload
- **WHEN** user reloads the application or returns to frequency practice
- **THEN** system restores the previously saved page number and sentence index
