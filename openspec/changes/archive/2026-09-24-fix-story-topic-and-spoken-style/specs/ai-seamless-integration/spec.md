# Spec Delta

## MODIFIED Requirements

### Requirement: Story passage generation prompt

The system SHALL generate each translation-story round passage via OpenAI chat as ONE short natural Russian story in spoken, conversational register, grounded ONLY in the learner-provided story topic/demands (when given) and the learner level, on a topic not already used in the session, outputting only the Russian passage text. The session's auto-generated display title SHALL NOT be sent to the model as a topic or topic constraint.

#### Scenario: First story passage request
- **WHEN** a translation round starts with session level and formality available
- **THEN** the passage request instructs the model to write one short Russian story in natural spoken Russian at the learner level, with no English translation or commentary.

#### Scenario: Story passage honours learner demands
- **WHEN** the learner provided story topic/demands at session setup
- **THEN** the passage request includes those demands and requires the story to match them.

#### Scenario: Story passage without learner demands
- **WHEN** no story topic/demands were provided
- **THEN** the passage request asks for a fresh, concrete everyday topic at the learner level and carries no topic string derived from the session's auto-generated title.

#### Scenario: Auto-generated title never grounds the story
- **WHEN** the passage request is built for a session whose title was auto-generated from the current date (e.g. `Story — Sep 23, 2026`)
- **THEN** the request text contains no part of that title, and the story is chosen from a free everyday topic instead.

#### Scenario: Story passage uses spoken register
- **WHEN** a passage request is built
- **THEN** the request requires conversational, spoken-style Russian a native speaker would actually say out loud, and forbids literary, bookish, or formal narration.

#### Scenario: Story passage does not reference the calendar date
- **WHEN** a passage request is built
- **THEN** the request forbids mentioning the current date, current year, a month name, or a literal calendar date, while allowing ordinary relative time words such as "yesterday" or "this morning".

#### Scenario: Follow-up story avoids repeats
- **WHEN** a subsequent round starts with prior round topics in history
- **THEN** the passage request includes the used topics and requires a fresh topic.
