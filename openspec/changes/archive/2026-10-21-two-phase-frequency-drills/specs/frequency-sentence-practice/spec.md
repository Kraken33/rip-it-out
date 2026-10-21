# Spec Delta

## MODIFIED Requirements

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
