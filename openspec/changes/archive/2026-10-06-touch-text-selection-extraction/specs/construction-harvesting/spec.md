# Spec Delta

## MODIFIED Requirements

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
