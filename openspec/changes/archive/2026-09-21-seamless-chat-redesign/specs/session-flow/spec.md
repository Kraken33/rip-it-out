# Spec Delta: Session Flow & Replay Modals

## ADDED Requirements

### Requirement: Separate Replay Modals (Prompt vs Seamless)
The system SHALL separate prompt copy/paste sessions and seamless AI chat sessions into distinct user flows, views, and conversation replay modals.

#### Scenario: User launches a Seamless AI Session
- **WHEN** the user starts a session with Seamless AI mode selected
- **THEN** the system MUST display the interactive `SeamlessChatSession` screen with audio/text streaming chat input
- **AND** save all message turns into the session's `messages` array.

#### Scenario: User views session replay for Seamless Session
- **WHEN** the user opens "View Conversation" for a Seamless AI session
- **THEN** the system MUST present the `SeamlessChatViewerModal` displaying the multi-turn chat transcript with saved annotated turns, hover tooltips, and context cards.

#### Scenario: User views session replay for Prompt Session
- **WHEN** the user opens "View Conversation" for a Prompt Copy/Paste session
- **THEN** the system MUST present the `PromptConversationViewerModal` displaying the static raw text and batch improvement list.
