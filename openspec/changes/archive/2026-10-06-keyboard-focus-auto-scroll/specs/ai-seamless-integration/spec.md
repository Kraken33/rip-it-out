# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-line Message Input for Seamless Sessions
The system SHALL provide a multi-line text area for typing chat messages in a Seamless AI session, so that long or multi-sentence answers can be comfortably read and edited before sending, and SHALL automatically scroll the chat thread to the latest assistant message upon input focus and virtual keyboard opening.

#### Scenario: User types a multi-line answer
- **GIVEN** the user is in an active Seamless AI session
- **WHEN** the user types text and presses Enter
- **THEN** a newline MUST be inserted into the text area
- **AND** the message MUST NOT be sent

#### Scenario: User submits a typed message
- **GIVEN** the user has typed a non-empty message into the text area
- **WHEN** the user clicks the Send button or presses Ctrl/Cmd+Enter
- **THEN** the message MUST be sent to the AI coach
- **AND** the text area MUST be cleared

#### Scenario: Transcribed speech lands in the text area
- **GIVEN** the user is in an active Seamless AI session with text already present in the text area
- **WHEN** a voice recording is transcribed
- **THEN** the transcription MUST be inserted into the text area content
- **AND** previously typed text MUST be preserved

#### Scenario: Auto-scrolling chat thread on input focus
- **GIVEN** an active Seamless AI session with multiple prior messages
- **WHEN** the user focuses the chat message input textarea
- **THEN** the chat thread container automatically scrolls to bring the latest message turn into view above the input dock.
