# Spec Delta

## MODIFIED Requirements

### Requirement 3: Automated In-App Voice Recording & AI Analysis
The system SHALL support capturing spoken audio and sending requests directly to AI models to generate structured improvements upon completing a session.

#### Scenario: User completes seamless session and triggers end-of-session evaluation
- **GIVEN** the user is in a session with `Seamless AI` mode active and has recorded or typed multiple message turns
- **WHEN** the user clicks "Finish Conversation"
- **THEN** the system MUST join all user messages into a single text block
- **AND** send the combined text to the AI model (`generateSeamlessSessionFeedback`)
- **AND** automatically parse the JSON response into improvement items for review in Step 4

## REMOVED Requirements

### Requirement: Improvement Annotation Interaction
**Reason**: Per-message improvement evaluation and inline annotated popovers are removed in favor of end-of-session evaluation.
**Migration**: Users analyze and review improvements for all chat turns at once at the end of the session in Step 4.
