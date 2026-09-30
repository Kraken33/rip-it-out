# Spec Delta

## MODIFIED Requirements

### Requirement 3: Automated In-App Voice Recording & AI Analysis
The system SHALL support capturing spoken audio and sending requests directly to the OpenAI Chat Completions API as a conversational coaching chat during a seamless session, and SHALL NOT generate a structured improvement batch when that session is finished.

#### Scenario: Session completes by saving and exiting
- **WHEN** the user finishes a seamless session after one or more message turns
- **THEN** the learner's message text and the measured duration are saved to the session, an activity log entry is recorded, and the flow returns to the Dashboard without any end-of-session improvement batch.

#### Scenario: Text generation is attempted without an OpenAI key
- **GIVEN** only a Groq API key is configured and no OpenAI key is present
- **WHEN** any AI text generation or evaluation action is attempted (coach chat reply, translation passage generation, translation evaluation, construction extraction)
- **THEN** the system MUST NOT call the Groq chat completions API
- **AND** MUST surface an error directing the user to configure an OpenAI API key in Settings

### Requirement: Sentence Context Tracking for Improvements
The system SHALL capture and store the full sentence or message context (`context`) alongside each improvement registered to the study list.

#### Scenario: SRS card created with sentence context
- **WHEN** an improvement is harvested from a selected phrase in a session text block
- **THEN** the created improvement record and corresponding SRS card MUST include the source block text as the sentence context string.

## ADDED Requirements

### Requirement: Per-round improved-version feedback

The system SHALL evaluate each learner translation via OpenAI chat and return a structured result containing a summary and a fluent daily-speaking improved version of the learner's own translation, and SHALL NOT request candidate constructions.

#### Scenario: Feedback returns the improved version without constructions
- **WHEN** the learner submits an English translation of a story passage
- **THEN** the feedback response contains a summary and an improved version preserving the learner's meaning with fluent spoken phrasing, and contains no construction list.

#### Scenario: Correct translation needs no rewrite
- **WHEN** the submitted translation is already natural and fluent
- **THEN** the response marks it as already natural, leaves the improved version empty, and proposes nothing to change.

## REMOVED Requirements

### Requirement: Per-round translation feedback prompt

**Reason**: It required candidate constructions in every per-round feedback response. Those automatic candidates are removed; replaced by "Per-round improved-version feedback", which returns the improved version only.

**Migration**: None. Existing stored rounds keep any constructions they already hold; new rounds are saved with summary and improved version only, and constructions are added to the vault when the learner harvests them.

### Requirement: Aggregation uses existing feedback shape

**Reason**: Client-side aggregation existed only to pool per-round candidate constructions into one session-wide import list. Per-round feedback no longer produces candidates, and neither session activity presents an aggregated import list.

**Migration**: None. A finished session stores its rounds (passage, translation, improved version) with no constructions list; constructions reach the vault individually when the learner harvests them, as vault improvements scoped to that session.

### Requirement: Concise Construction Patterns in AI Evaluation

**Reason**: This requirement constrained the end-of-session evaluation request, which is removed. The same constraint now governs the on-demand construction-extraction request.

**Migration**: None. The short single-clause 2-7 word bracket-slot pattern rule, with its multi-clause counter-example, is required by the `construction-harvesting` extraction requirement.
