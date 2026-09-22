# Spec Delta

## MODIFIED Requirements

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
