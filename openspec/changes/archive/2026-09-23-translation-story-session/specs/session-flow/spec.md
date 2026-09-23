# Spec Delta

## ADDED Requirements

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
