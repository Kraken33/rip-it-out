# Spec Delta

## MODIFIED Requirements

### Requirement: Session activity selection

The system SHALL let the user pick a session activity (`dialogue` or `translation`) at the TOP of the New Session setup form, before any other input, and SHALL render a different Step-2 interface per activity. The story-translation activity SHALL complete within its Step-2 interface and return to the Dashboard, while the Review & Confirm import step remains exclusive to the Prompt Copy/Paste dialogue path. Step-1 detail fields SHALL be activity-conditional: title, source type, tags, and notes are shown only for the `dialogue` activity; the `translation` activity shows an optional story topic/demands field instead.

#### Scenario: Activity selector comes first
- **WHEN** the user opens the New Session setup step
- **THEN** the activity selector is the first control in the form, above every other input.

#### Scenario: Picking dialogue activity
- **WHEN** the user selects the dialogue activity
- **THEN** the title, source type, tags, and notes fields are displayed, and Step 2 displays the existing free-dialogue chat interface.

#### Scenario: Picking translation activity
- **WHEN** the user selects the translation activity
- **THEN** the title, source type, tags, and notes fields are NOT displayed, an optional story topic/demands field is displayed instead, and Step 2 displays the story-translation round interface.

#### Scenario: Activity is stored on the session
- **WHEN** a session is created with an activity selected
- **THEN** the session record carries the `activity` marker so Library replay and stats route to the matching viewer.

#### Scenario: Story activity completes without an import step
- **WHEN** the user finishes the translation activity after submitting at least one translation
- **THEN** the session is saved and the flow returns to the Dashboard without presenting the Review & Confirm import step.

#### Scenario: Import step stays exclusive to the prompt dialogue path
- **WHEN** the dialogue activity reaches its export step in Prompt Copy/Paste mode
- **THEN** the pasted JSON is parsed and the selective import picker is presented.

## ADDED Requirements

### Requirement: Selective import of pasted prompt improvements

The system SHALL let the user select which parsed improvements to import on the Review & Confirm step of the Prompt Copy/Paste path, and SHALL import only the selected items while discarding the rest.

#### Scenario: Selecting improvements before import
- **WHEN** the Review & Confirm list is shown with parsed improvements
- **THEN** each item shows a checkbox, a select-all/deselect-all control is available, and the confirm button displays the selected count (e.g. `Confirm Import (2 selected)`).

#### Scenario: Confirming a partial selection
- **WHEN** the user confirms import with a subset selected
- **THEN** only the selected improvements are written to the vault with SRS cards and unchecked items are discarded without vault or SRS writes.

#### Scenario: Deselecting everything
- **WHEN** zero improvements are selected
- **THEN** the confirm action is disabled and no import occurs.

#### Scenario: Picker belongs to the prompt path
- **WHEN** improvements arrive from pasted prompt JSON
- **THEN** the selective picker is presented before any vault write.

## REMOVED Requirements

### Requirement: Selective import of improvements

**Reason**: The Review & Confirm picker now serves the Prompt Copy/Paste path only; the story activity finishes back on the Dashboard, and the seamless dialogue path no longer produces a parsed improvement list. Replaced by "Selective import of pasted prompt improvements".

**Migration**: None. Pasted prompt JSON is still imported through the same picker with identical selection behaviour.

