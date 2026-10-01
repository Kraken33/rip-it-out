# Spec Delta

## MODIFIED Requirements

### Requirement: Extraction turns a selection into one construction

The system SHALL send the selected phrase, the complete source block it was selected from, the learner's level, and — for a story round — that round's Russian passage, to the configured OpenAI chat model, and SHALL interpret the response as exactly one construction in the existing vault improvement shape whose `original` is empty because no learner error is being corrected and whose `improved` is a complete, natural spoken English sentence illustrating the construction in context.

#### Scenario: Request carries the selection and its block
- **WHEN** an extraction runs for a selection
- **THEN** the request contains the selected phrase and the complete block it was selected from.

#### Scenario: Request carries level and passage context
- **WHEN** an extraction runs with a learner level configured
- **THEN** the request carries that level, and for a story round it also carries the round's Russian passage.

#### Scenario: One construction returned
- **WHEN** the model responds to an extraction request
- **THEN** the result is one construction, never a list of candidates.

#### Scenario: Short reusable pattern required
- **WHEN** an extraction request is built
- **THEN** it requires the construction to be a single-clause pattern of roughly 2-7 words using bracket slots, and forbids whole sentences and multi-clause patterns.

#### Scenario: Full natural example sentence required
- **WHEN** an extraction response is produced
- **THEN** its `improved` field is a complete, natural spoken sentence in context containing the construction rather than just the selected phrase snippet.

#### Scenario: Empty original
- **WHEN** a construction is extracted from AI-written text
- **THEN** its `original` is empty.

#### Scenario: Category and frequency constrained
- **WHEN** an extraction response is interpreted
- **THEN** its category is one of grammar, vocabulary, collocation, idiom, pronunciation, or structure and its spoken frequency is one of very_high, high, or medium, each falling back to a default when the model omits or invents a value.

### Requirement: Extraction preview before saving

The system SHALL present an extracted construction as a read-only card beneath its source block showing the construction, its improved example, its explanation, its category, and its spoken frequency, offering an add action and a discard action, and SHALL write nothing until the add action is chosen. Upon saving, the extraction preview SHALL clear the active selection lock so subsequent selections in the same source block can be immediately extracted.

#### Scenario: Preview appears beneath its source block
- **WHEN** an extraction succeeds
- **THEN** a preview card for that construction is displayed directly beneath the block the phrase was selected from.

#### Scenario: Pending state blocks a second request
- **WHEN** an extraction request is in flight
- **THEN** the control shows a pending state and cannot start another extraction.

#### Scenario: Discarding a preview
- **WHEN** the learner discards a preview card
- **THEN** the card is removed and no vault or SRS write occurs for it.

#### Scenario: Nothing saved without the add action
- **WHEN** a preview card is displayed and the add action is not chosen
- **THEN** the vault and the SRS state remain unchanged.

#### Scenario: Save clears preview to allow another selection
- **WHEN** the learner saves an extracted construction
- **THEN** the vault record is created and the extractor clears its active preview state so selecting another phrase in the same block enables the extraction trigger.
