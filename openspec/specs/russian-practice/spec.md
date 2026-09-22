# Russian Practice Specification

## Purpose
Prompt external LLMs with 5 Russian scenario questions for practicing English constructions.

## Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run a 4-5 round exercise in Russian, embedding 3-5 target constructions per round with visual bracket tags `[[Russian phrase|target construction]]`, awaiting English translation after each round.

### Requirement: Multi-Round Russian Translation Practice
The system SHALL batch top upcoming or due SRS cards into rounds for practice. When zero cards are due today, the system SHALL select the top 5 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 5 upcoming cards when zero cards are due today) sorted by schedule and presents them for practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches the top 5 upcoming ("coming soon") cards sorted by scheduled review date and generates prompts/sessions for practice.

### Requirement: Construction Highlighting and Parsing
The system SHALL parse and render target construction annotations in generated Russian passages into visual UI badges with English target tooltips.

#### Scenario: Rendering highlighted constructions in Russian text
- **WHEN** a Russian passage containing tagged constructions `[[Russian phrase|target construction]]` is received or generated
- **THEN** the UI highlights the Russian phrase visually and displays the associated target English construction.

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app presents Russian passages with highlighted constructions, accepts a multi-line typed or dictated English translation of the passage, returns a per-round evaluation verdict for that translation, and auto-advances through rounds.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces.

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL present the SRS recall rating for the same cards that were practiced once translation practice completes.

#### Scenario: Transition after practice completion
- **WHEN** all translation practice rounds are finished or the user ends the session
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall (Again, Hard, Good, Easy) for all practiced cards
- **AND** each rating button updates that card's SRS schedule exactly once and advances to the next practiced card.

#### Scenario: Rating persists the SRS schedule
- **WHEN** the user selects any rating (Again, Hard, Good, or Easy) for a practiced card
- **THEN** the system persists the updated SRS card fields (status, easeFactor, intervalDays, nextReview) for that card's improvementId
- **AND** the rating interface remains responsive for the remaining practiced cards.

#### Scenario: No matching SRS cards after practice
- **WHEN** practice finishes but none of the practiced items has a matching SRS card record
- **THEN** the system does not present the rating interface for those items and instead presents the practice completion state.

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
The system SHALL evaluate each submitted English translation against the Russian passage and the round's target constructions, and SHALL report the outcome per target construction together with a corrected version of the learner's own translation. The evaluation SHALL grade only whether the learner used each target construction correctly — not whether a different construction would have been more idiomatic.

#### Scenario: Evaluation covers every target of the round
- **WHEN** the user submits a translation for a round whose passage embeds N target constructions
- **THEN** the evaluation reports exactly one outcome per target construction, each classified as used naturally, used awkwardly, or not used at all, and every target classified as awkward or not used also carries the learner's own phrase where one exists and a corrected example using that same target construction.

#### Scenario: Correct usage of the target construction is accepted
- **WHEN** the learner used a target construction grammatically and appropriately for the passage's meaning
- **THEN** the evaluation MUST classify that target as used naturally, even when a different construction would be more idiomatic, and MUST NOT propose replacing the target construction with a different one.

#### Scenario: Slash-separated alternatives in a target
- **WHEN** a target construction lists alternatives separated by "/" (for example "be actively looking / be actively job hunting")
- **THEN** using any one of the alternatives correctly counts as using the target construction naturally.

#### Scenario: Corrections keep the target construction
- **WHEN** a target is classified as awkward or not used and the evaluation provides a corrected example for it
- **THEN** the corrected example MUST use that same target construction (or one of its slash-separated alternatives) correctly, and MUST NOT substitute a different construction.

#### Scenario: Corrected version of the learner's own translation
- **WHEN** the submitted translation has at least one target classified as awkward or not used
- **THEN** the evaluation presents a rewritten version of the learner's own translation that preserves the learner's meaning and wording, keeps every correctly used target construction as-is, fixes only the actual errors, and uses the missing or misused targets naturally, together with short notes explaining what changed.

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
