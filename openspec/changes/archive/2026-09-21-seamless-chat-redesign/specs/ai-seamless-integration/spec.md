# Spec Delta: AI Seamless Integration & Conversational Coaching

## MODIFIED Requirements

### Requirement 3: Automated In-App Voice Recording & AI Analysis
The system SHALL support capturing spoken or typed input, streaming real-time conversational responses, evaluating individual user message turns on demand, displaying strikethrough original and highlighted improved badges with hover tooltips, and persisting full chat conversations with sentence context.

#### Scenario: User sends a message in Seamless Mode
- **WHEN** the user speaks or types a message in Seamless Mode
- **THEN** the system MUST stream the AI speaking coach response in real time
- **AND** append both user and assistant turns to the session's persisted `messages` array
- **AND** render an "Improve" action button on the user's message.

#### Scenario: User clicks Improve on a message turn
- **WHEN** the user clicks the "Improve" button on a specific user message
- **THEN** the system MUST send that message to the AI evaluator
- **AND** render the message text with original text in red strikethrough (`~~old~~`) and improved text in highlighted badges
- **AND** attach hover popover tooltips displaying pattern construction, original vs improved comparison, category, frequency, sentence context, and an `[Add to Study List]` button.

#### Scenario: User adds improvement to study list from tooltip
- **WHEN** the user clicks `Add to Study List` inside an improvement hover tooltip
- **THEN** the system MUST register the improvement and its full sentence context in the SRS vault (`srs_cards` and `improvements`)
- **AND** update the button state to indicate it has been added to the study list.

## ADDED Requirements

### Requirement: Sentence Context Tracking for Improvements
The system SHALL capture and store the full sentence or message context (`context`) alongside each improvement registered to the study list.

#### Scenario: SRS card created with sentence context
- **WHEN** an improvement is added from a seamless chat message turn
- **THEN** the created improvement record and corresponding SRS card MUST include the sentence context string.
