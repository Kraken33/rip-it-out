# Session Flow Specification

## Purpose
Orchestrates session creation, activity selection, step transitions, and import handling across dialogue and translation activities.

## Requirements

### Requirement: Session activity selection
The system SHALL let the user pick a session activity (`dialogue` or `translation`) at the TOP of the New Session setup form, before any other input, and SHALL render a different Step-2 interface per activity. Both activities SHALL operate exclusively via interactive Seamless AI interfaces and complete back to the application dashboard or history without intermediate prompt copy/paste or manual JSON import steps. Step-1 detail fields SHALL be activity-conditional: title, source type, tags, and notes are shown only for the `dialogue` activity; the `translation` activity shows an optional story topic/demands field instead.

#### Scenario: Activity selector comes first
- **WHEN** the user opens the New Session setup step
- **THEN** the activity selector is the first control in the form, above every other input.

#### Scenario: Picking dialogue activity
- **WHEN** the user selects the dialogue activity
- **THEN** the title, source type, tags, and notes fields are displayed, and Step 2 displays the interactive free-dialogue chat interface (`SeamlessChatSession`).

#### Scenario: Picking translation activity
- **WHEN** the user selects the translation activity
- **THEN** the title, source type, tags, and notes fields are NOT displayed, an optional story topic/demands field is displayed instead, and Step 2 displays the story-translation round interface.

#### Scenario: Activity is stored on the session
- **WHEN** a session is created with an activity selected
- **THEN** the session record carries the `activity` marker so Library replay and stats route to the matching viewer.

#### Scenario: Story activity completes without an import step
- **WHEN** the user finishes the translation activity after submitting at least one translation
- **THEN** the session is saved and the flow returns to the Dashboard without presenting any prompt export or import steps.

#### Scenario: Import step stays exclusive to the prompt dialogue path
- **WHEN** the dialogue activity finishes in Seamless AI mode
- **THEN** no prompt export or import steps are presented and the flow returns directly to the Dashboard or Library without any Prompt #2 export or JSON import step.
