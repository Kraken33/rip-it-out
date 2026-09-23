# Session Flow Specification

## Purpose
Guide users through session setup, prompt copying, JSON pasting, and import confirmation.

## Requirements

### Requirement: Title Autofill
Selecting a previously used session title must pre-fill form fields and link to existing topic.
When a user selects a previously used title during session creation, the system SHALL pre-fill the source type, tags, and notes fields from the most recent session with that title AND transparently attach the new session to the existing topic entity for that title.

#### Scenario: Selecting Previous Title
- **WHEN** user selects a previous session title from the dropdown selector
- **THEN** Title, Source Type, Tags, and Notes are automatically populated from the matching session.

#### Scenario: Autofill pre-populates form from prior session
- **WHEN** a user selects an existing title from the title suggestions
- **THEN** the source type, tags, and notes fields are pre-filled from the most recent session with that title

#### Scenario: New session links to existing topic when title matches
- **WHEN** a user submits the new session form with a title matching an existing topic
- **THEN** the created session has its `topicId` set to the matching topic's id

#### Scenario: New session creates new topic when title is novel
- **WHEN** a user submits the new session form with a title that matches no existing topic
- **THEN** a new topic entity is created and the session's `topicId` references it

### Requirement: Optional raw conversation text input during import
The system SHALL provide an optional multi-line text input field on the session import step for users to paste their raw conversation text (`rawText`).

#### Scenario: User provides raw conversation text
- **WHEN** the user pastes text into the optional raw text field and confirms import
- **THEN** the session entity is saved with `rawText` containing the provided string.

#### Scenario: User skips optional raw conversation text
- **WHEN** the user leaves the optional raw text field blank and confirms import
- **THEN** the session entity is saved with `rawText` set to `null`.

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

### Requirement: Session activity selection

The system SHALL let the user pick a session activity (`dialogue` or `translation`) during New Session setup and SHALL render a different Step-2 interface per activity under the same Step-1/Step-4 shell.

#### Scenario: Picking dialogue activity
- **WHEN** the user selects the dialogue activity
- **THEN** Step 2 displays the existing free-dialogue chat interface.

#### Scenario: Picking translation activity
- **WHEN** the user selects the translation activity
- **THEN** Step 2 displays the story-translation round interface instead of the free-dialogue chat.

#### Scenario: Activity is stored on the session
- **WHEN** a session is created with an activity selected
- **THEN** the session record carries the `activity` marker so Library replay and stats route to the matching viewer.

### Requirement: Selective import of improvements

The system SHALL let the user select which parsed improvements to import on the Review & Confirm step for both seamless and prompt copy/paste paths, and SHALL import only selected items while discarding the rest.

#### Scenario: Selecting improvements before import
- **WHEN** the Review & Confirm list is shown with parsed improvements
- **THEN** each item shows a checkbox, a select-all/deselect-all control is available, and the confirm button displays the selected count (e.g. `Confirm Import (2 selected)`).

#### Scenario: Confirming a partial selection
- **WHEN** the user confirms import with a subset selected
- **THEN** only the selected improvements are written to the vault with SRS cards and unchecked items are discarded without vault or SRS writes.

#### Scenario: Deselecting everything
- **WHEN** zero improvements are selected
- **THEN** the confirm action is disabled and no import occurs.

#### Scenario: Shared picker for both import paths
- **WHEN** improvements arrive from seamless AI feedback or from pasted prompt JSON
- **THEN** the same selective picker is presented before any vault write.
