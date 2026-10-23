# Frequency Sentence Practice Specification

## Purpose
Enables learners to stream frequency-ranked English-Russian sentence pairs page-by-page from Manythings, triage them into spaced repetition or discard them, and deeply study challenging sentences with an on-demand 3-tab explain and multi-exercise practice system.

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
The system SHALL present the active sentence in a flashcard interface displaying the source prompt sentence, an audio pronunciation playback button, a "Reveal" action to expose the target translation, a direction toggle between Russian-to-English and English-to-Russian, and an on-demand "Explain & Practice" action visible upon reveal.

#### Scenario: Reveal translation
- **WHEN** user views a sentence card and triggers "Reveal Translation" (or presses Space)
- **THEN** system displays the corresponding translation alongside its audio playback button, reveals the rating buttons, and displays the "Explain & Practice" action button

#### Scenario: Switching translation direction
- **WHEN** user toggles prompt direction from Russian-first to English-first
- **THEN** the active card and subsequent cards immediately display English on the front and reveal Russian upon flipping

### Requirement: First-Encounter SRS Triage
The system SHALL provide four rating actions on revealed cards (`Easy`, `Good`, `Hard`, `Again`) and apply immediate triage rules based on user rating without interrupting the card flow.

#### Scenario: Rating Easy skips without saving to SRS
- **WHEN** user selects `Easy` on an unpracticed sentence
- **THEN** system advances immediately to the next sentence without creating an SRS card or initiating a drill

#### Scenario: Rating Good saves to SRS and advances
- **WHEN** user selects `Good` on an unpracticed sentence
- **THEN** system saves the sentence pair as an improvement and SRS card with initial review interval, and immediately advances to the next sentence

#### Scenario: Rating Hard or Again enters interactive drill
- **WHEN** user selects `Hard` or `Again` on a sentence
- **THEN** system saves the sentence pair to SRS with learning status and immediately advances to the next sentence without initiating a mandatory drill

### Requirement: On-Demand Sentence Explain and Deep Practice System
The system SHALL provide a comprehensive, on-demand study system accessible via the "Explain & Practice" button on revealed cards. When triggered, the system SHALL display a tabbed modal interface with three sections ("Explanation", "Examples", "Practice") that learners can freely navigate between.

#### Scenario: Opening Explain & Practice modal
- **WHEN** user clicks "Explain & Practice" on a revealed sentence card
- **THEN** system opens the modal, immediately fetches or retrieves cached content for all three tabs in a unified payload, and presents the "Explanation" tab by default

#### Scenario: Navigating between tabs
- **WHEN** user selects the "Explanation", "Examples", or "Practice" tab
- **THEN** system switches view immediately without re-querying the AI for previously fetched content

#### Scenario: Session caching
- **WHEN** user closes the Explain & Practice modal and re-opens it for the same sentence within the active session
- **THEN** system displays the cached explanation, examples, and practice content without triggering new network or AI requests

### Requirement: Detailed Sentence Explanation
The system SHALL provide an in-depth linguistic and contextual explanation for the active sentence within the "Explanation" tab.

#### Scenario: Viewing explanation breakdown
- **WHEN** user views the "Explanation" tab
- **THEN** system displays the core meaning and nuances (literal vs. natural phrasing), a structured vocabulary and grammar table detailing key words, grammatical roles, cases, and verb aspect, and situational usage notes describing register and formality, along with audio playback buttons

### Requirement: Contextual Example Variations
The system SHALL generate and display contextual example variations illustrating the target sentence pattern within the "Examples" tab, strictly locking and preserving the target English construction or vocabulary without drift to colloquial synonyms.

#### Scenario: Displaying initial contextual examples
- **WHEN** user views the "Examples" tab
- **THEN** system displays 3 to 4 distinct sentence examples showing diverse frames (questions, negations, varied tenses or subjects) that strictly retain and reinforce the active English root construction (e.g. inflections of "weep" / "wept" without substituting "cry"), each with Russian and English text and audio playback buttons

#### Scenario: Generating additional examples
- **WHEN** user clicks "Generate More Examples"
- **THEN** system queries the AI for additional distinct example variations retaining the target English construction and appends them to the active list without discarding previously displayed examples

### Requirement: Multi-Exercise Practice and Evaluation
The system SHALL provide interactive practice exercises with immediate, detailed AI evaluation within the "Practice" tab, adapting to the active practice direction and generating contextual application sentences rather than duplicate card echoes.

#### Scenario: Practicing with translation drill
- **WHEN** user selects or engages with a translation exercise in the Practice tab
- **THEN** system presents a newly generated, comprehensive contextual sentence in the source language (reinforcing the target construction within realistic dialogue or narrative context) and accepts text or microphone input in the target language

#### Scenario: Practicing with fill-in-the-blank cloze exercise
- **WHEN** user selects or engages with a cloze exercise in the Practice tab
- **THEN** system presents a contextual sentence in the active target language with the target construction or grammatical inflection blanked out, alongside a full translation of the sentence in the source language for context, and accepts the learner's completion attempt

#### Scenario: Submitting practice attempt for evaluation
- **WHEN** user submits their translation or cloze answer
- **THEN** system evaluates the attempt against both the contextual drill sentence and the root card anchor, displaying an accuracy verdict, a natural target-language rewrite with audio playback, and a granular grammatical explanation of any mistakes or alternative phrasings

#### Scenario: Retrying or requesting a new exercise
- **WHEN** user clicks "Retry" or "Try Another Exercise" after receiving evaluation
- **THEN** system resets the input field for another attempt or generates a new practice exercise

### Requirement: Pagination State Persistence
The system SHALL persist the user's active page number and sentence index so learners resume practice exactly where they left off across browser sessions.

#### Scenario: Resuming session across page reload
- **WHEN** user reloads the application or returns to frequency practice
- **THEN** system restores the previously saved page number and sentence index
