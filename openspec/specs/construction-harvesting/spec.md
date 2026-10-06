# Capability Spec: Construction Harvesting

## Purpose

Lets a learner turn a phrase they select in AI-written session text into one reusable spoken construction and save it straight to their vault.

## Requirements

### Requirement: Selection-scoped extraction control

The system SHALL present a construction-extraction control inside each Russian story passage and improved-version block of a story-translation round and with each AI coach reply in a free-dialogue session, and SHALL enable that control only while the learner's current text selection lies inside the block it belongs to across both mouse and touch-based (mobile) selection interactions.

#### Scenario: Control presented on a Russian story passage
- **WHEN** a story-translation round displays its Russian story passage
- **THEN** an extraction control is presented within or adjacent to that story passage block.

#### Scenario: Control presented on an improved version
- **WHEN** a story-translation round displays its improved version
- **THEN** an extraction control is presented within that improved-version block.

#### Scenario: Control presented with a coach reply
- **WHEN** a free-dialogue session displays an AI coach reply
- **THEN** an extraction control is presented with that reply.

#### Scenario: Control enabled only for a selection inside its own block
- **WHEN** the learner selects text inside one story passage block, improved-version block, or coach reply
- **THEN** that block's extraction control becomes enabled and every other block's control stays disabled.

#### Scenario: Touch-based text selection on mobile devices
- **WHEN** the learner selects text using touch handles or long-press gestures on a mobile device inside a story passage, improved version, or coach reply
- **THEN** the extraction control is presented and enabled with the selected phrase.

#### Scenario: Control disabled without a usable selection
- **WHEN** the current selection is empty, collapsed, or lies outside the block
- **THEN** the extraction control is disabled.

#### Scenario: Extraction unavailable without an OpenAI key
- **WHEN** no OpenAI API key is configured
- **THEN** the extraction control is not presented and no extraction request is made.

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

### Requirement: Harvested construction is saved to the vault

The system SHALL persist an accepted construction as a vault improvement linked to the active session, SHALL create its SRS card, SHALL record the source block text as its sentence context, and SHALL present explicit error feedback if persistence fails rather than silently aborting or falsely indicating success.

#### Scenario: Accepting a construction
- **WHEN** the learner chooses the add action on a preview card
- **THEN** the construction is stored as a vault improvement linked to the active session, its SRS card is created, and the card reports that it was saved.

#### Scenario: Harvested construction appears in Library
- **WHEN** a construction has been harvested from a session
- **THEN** it is listed in the Library as a vault item scoped to that session.

#### Scenario: Sentence context is stored
- **WHEN** a construction is harvested
- **THEN** its vault record carries the full source block text as its sentence context.

#### Scenario: Several harvests from one block
- **WHEN** the learner extracts more than one construction from the same block
- **THEN** each accepted construction becomes its own vault improvement and SRS card.

#### Scenario: Persistence failure surfaces explicit error
- **WHEN** saving an extracted construction fails due to a missing session ID, network issue, or database rejection
- **THEN** an error message is presented on the extraction card, the card does not transition to a saved state, and the learner is offered an option to retry.

### Requirement: Duplicate construction guard

The system SHALL compare an extracted construction against the constructions already stored in the vault, ignoring case and surrounding whitespace, and SHALL report the match instead of creating a duplicate vault entry and SRS card.

#### Scenario: Duplicate construction reported
- **WHEN** an extracted construction already exists in the vault
- **THEN** the preview reports that it is already saved and the add action creates neither a second vault entry nor an SRS card.

#### Scenario: Distinct construction saved
- **WHEN** an extracted construction differs from every construction in the vault
- **THEN** the add action saves it normally.

### Requirement: Unparsable extraction response

The system SHALL keep the selection and its context available and SHALL display the raw model response with a retry action when an extraction response cannot be interpreted as one construction.

#### Scenario: Raw response shown with retry
- **WHEN** an extraction response cannot be interpreted
- **THEN** the raw response text is displayed with a retry action and no vault write occurs.

#### Scenario: Retry after an unparsable response
- **WHEN** the learner retries after an unparsable response
- **THEN** a new extraction request is sent for the same selection and context.
