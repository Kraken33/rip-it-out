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
- **THEN** the transcription MUST be inserted into the text area at the current cursor/caret position (or appended if no caret is active)
- **AND** previously typed text MUST be preserved.

#### Scenario: Auto-scrolling chat thread on input focus
- **GIVEN** an active Seamless AI session with multiple prior messages
- **WHEN** the user focuses the chat message input textarea or the virtual keyboard opens
- **THEN** the chat thread container automatically scrolls to bring the latest message turn into view above the input dock.

## ADDED Requirements

### Requirement: Mobile Viewport Keyboard-Attached Composer and Collapsible Actions Menu for Seamless Chat Sessions
The system SHALL provide a full-screen, mobile-responsive interaction layout for seamless AI chat sessions that pins the message composer dock directly above the software keyboard within dynamic visual viewport bounds (`window.visualViewport.height`), suppresses browser bounce and locks document body scrolling on mobile viewports while the session is active, suppresses the top session header and wizard stepper on mobile screens (< 640px), and consolidates session actions and speech recording into a collapsible Actions HUD (`⚡ Actions`).

#### Scenario: Fullscreen immersive takeover for seamless chat session
- **WHEN** the user enters Step 2 of a new practice session with the dialogue activity in seamless AI mode
- **THEN** the wizard setup header and step progress indicator are hidden
- **AND** the seamless chat session occupies the full responsive viewport container matching the translation story session experience.

#### Scenario: Mobile input composer remains attached above software keyboard in chat session
- **WHEN** the user opens or focuses the chat input text area on a mobile viewport
- **THEN** document body scrolling is locked and position lock is applied instantaneously
- **AND** the session container height dynamically conforms to `window.visualViewport.height`
- **AND** the composer dock remains pinned above the virtual keyboard.

#### Scenario: Collapsible Actions HUD for seamless chat session
- **WHEN** the seamless chat session is viewed on a mobile viewport (< 640px)
- **THEN** the top session header is hidden
- **AND** the footer provides a collapsible `⚡ Actions` toggle button
- **AND** opening the Actions HUD presents quick accessible controls to dictate speech via AudioRecorder and to trigger "Finish Conversation →".
