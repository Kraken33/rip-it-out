# Spec Delta — Russian Practice

## MODIFIED Requirements

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app presents Russian passages with highlighted constructions, accepts a multi-line typed or dictated English translation of the passage, returns a per-round evaluation verdict for that translation, and auto-advances through rounds.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces.

## ADDED Requirements

### Requirement: Multi-Line Translation Input
The system SHALL provide a multi-line translation input in which a passage-length English answer can be written and reviewed in full before submission, and SHALL submit only on an explicit action rather than on a plain newline.

#### Scenario: Writing and reviewing a passage-length translation
- **WHEN** the user types a translation containing several sentences and line breaks
- **THEN** the input displays the text across multiple visible lines without horizontal scrolling, preserves the line breaks verbatim, and can be resized by the user or grows with the content up to a maximum height that keeps the round's Russian passage visible.

#### Scenario: Pressing Enter inside the translation input
- **WHEN** the user presses Enter while the translation input has focus
- **THEN** a newline is inserted into the translation and no request is sent; the translation is submitted only by activating the Translate control or by pressing its keyboard submit shortcut, and the submitted text preserves the newlines the user typed.

#### Scenario: Adding dictated speech to an existing translation
- **WHEN** the user has already written text in the translation input and then completes a voice recording
- **THEN** the transcription MUST be inserted at the current caret position instead of being appended to the end of the text, and a later submission MUST include both the typed and the dictated text.

#### Scenario: Submitting an empty or in-flight translation
- **WHEN** the translation input contains only whitespace, or an evaluation is already in progress for the current round
- **THEN** the system MUST NOT send an evaluation request and MUST retain the translation text.

### Requirement: Translation Verdict Evaluation
The system SHALL evaluate each submitted English translation against the Russian passage and the round's target constructions, and SHALL report the outcome per target construction together with a corrected version of the learner's own translation.

#### Scenario: Evaluation covers every target of the round
- **WHEN** the user submits a translation for a round whose passage embeds N target constructions
- **THEN** the evaluation reports exactly one outcome per target construction, each classified as used naturally, used awkwardly, or not used at all, and every target classified as awkward or not used also carries the learner's own phrase where one exists and a natural alternative for that target.

#### Scenario: Corrected version of the learner's own translation
- **WHEN** the submitted translation has at least one target classified as awkward or not used
- **THEN** the evaluation presents a rewritten version of the learner's own translation that preserves the learner's meaning and wording while using the targets naturally, together with short notes explaining what changed.

#### Scenario: Rewrite withheld when the translation is already natural
- **WHEN** the submitted translation is already natural and every target construction is used correctly
- **THEN** the evaluation MUST report success, MUST NOT present a rewritten version, and MUST NOT invent corrections for correct sentences.

#### Scenario: Evaluation shown as a round verdict
- **WHEN** an evaluation result is available for the current round
- **THEN** the round thread displays it as a verdict containing an overall summary, the per-target coverage, the corrected version when one is warranted, and notes only for the targets classified as awkward or not used.

#### Scenario: Evaluation result cannot be interpreted
- **WHEN** the evaluation response does not conform to the expected verdict structure, including a response that was cut off before it completed
- **THEN** the system MUST still display the response text in the round thread as plain feedback, MUST indicate that structured evaluation was unavailable, and MUST offer a way to retry the evaluation without discarding the learner's submitted translation.

#### Scenario: Reaching the existing SRS rating step
- **WHEN** the last round is completed or the user ends the session
- **THEN** the system still hands all cards encountered so far to the manual SRS recall rating interface, unaffected by the verdict evaluation.
