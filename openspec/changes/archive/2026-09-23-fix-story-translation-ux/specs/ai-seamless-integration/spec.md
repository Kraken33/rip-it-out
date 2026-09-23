# Spec Delta

## MODIFIED Requirements

### Requirement: Story passage generation prompt

The system SHALL generate each translation-story round passage via OpenAI chat as ONE short natural Russian story grounded in the session's story topic/demands (when provided) and learner level, on a topic not already used in the session, outputting only the Russian passage text.

#### Scenario: First story passage request
- **WHEN** a translation round starts with session topic/demands, level, and formality available
- **THEN** the passage request instructs the model to write one short Russian story tied to the session topic, at the learner level, with no English translation or commentary.

#### Scenario: Story passage honours learner demands
- **WHEN** the learner provided story topic/demands at session setup
- **THEN** the passage request includes those demands and requires the story to match them.

#### Scenario: Story passage without learner demands
- **WHEN** no story topic/demands were provided
- **THEN** the passage request lets the model pick any everyday topic at the learner level.

#### Scenario: Follow-up story avoids repeats
- **WHEN** a subsequent round starts with prior round topics in history
- **THEN** the passage request includes the used topics and requires a fresh topic.

### Requirement: Per-round translation feedback prompt

The system SHALL evaluate each learner translation via OpenAI chat and return a structured result containing a fluent daily-speaking improved version plus candidate constructions in the vault improvement shape.

#### Scenario: Feedback returns improved version and constructions
- **WHEN** the learner submits an English translation for a story passage
- **THEN** the feedback response contains an improved version preserving the learner's meaning with fluent spoken phrasing, and a constructions list with construction, original, improved, explanation, category, and spoken frequency.

#### Scenario: Feedback caps constructions per round
- **WHEN** a round is evaluated
- **THEN** the feedback holds at most a small per-round number of constructions so each round's feedback stays focused.

### Requirement: Aggregation uses existing feedback shape

The system SHALL aggregate per-round constructions client-side by deduping on normalized construction text, keeping the earliest occurrence, and presenting ALL deduplicated candidates with no session-wide cap, reusing the existing improvement object shape with no new AI call.

#### Scenario: Dedupe keeps earliest occurrence
- **WHEN** two rounds yield the same normalized construction
- **THEN** the aggregated list keeps the earliest occurrence and drops later duplicates.

#### Scenario: Aggregation needs no extra AI call
- **WHEN** per-round constructions are aggregated
- **THEN** no additional model request is required unless a future change adds cross-round rewrite.
