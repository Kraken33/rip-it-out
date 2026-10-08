# Spec Delta

## MODIFIED Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run a single-sentence translation exercise in Russian, embedding exactly 1 target construction per round without spoiler tags or inline English answers, awaiting English translation after each round, repeating the target construction ONLY if the target construction itself was omitted or used incorrectly, and providing feedback while advancing to the next construction whenever the target construction was used correctly (even when unrelated errors exist elsewhere in the translation).

### Requirement: Translation Verdict Evaluation
The system SHALL evaluate each submitted English translation against the Russian sentence and the round's single target construction, and SHALL report the outcome together with a corrected version of the learner's own translation. The evaluation SHALL grade whether the learner used the target construction correctly and naturally.

#### Scenario: Evaluation covers every target of the round
- **WHEN** the user submits a translation for a round testing the active target construction
- **THEN** the evaluation reports whether that target construction was used naturally, awkwardly, or not at all, providing notes and a corrected version when warranted.

#### Scenario: Correct usage of the target construction is accepted
- **WHEN** the learner used the target construction grammatically and appropriately for the sentence's meaning
- **THEN** the evaluation classifies that target as used naturally and confirms successful recall, even when the translation contains unrelated errors, typos, or grammatical flaws in other parts of the sentence.

#### Scenario: Unrelated sentence errors do not trigger construction repetition
- **WHEN** the submitted translation contains errors, typos, or awkward phrasing outside the target construction while the target construction itself was used grammatically and appropriately
- **THEN** the evaluation classifies the target construction as used naturally (`quality: "natural"`), includes a corrected version of the learner's own sentence in the rewrite without marking the construction awkward, and does NOT trigger a repetition of that target construction in the session.

#### Scenario: Slash-separated alternatives in a target
- **WHEN** a target construction lists alternatives separated by "/" (for example "be actively looking / be actively job hunting")
- **THEN** using any one of the alternatives correctly counts as using the target construction naturally.

#### Scenario: Corrections keep the target construction
- **WHEN** a target is classified as awkward or not used and the evaluation provides a corrected example for it
- **THEN** the corrected example MUST use that same target construction (or one of its slash-separated alternatives) correctly.

#### Scenario: Corrected version of the learner's own translation
- **WHEN** the submitted translation has the target classified as awkward or not used
- **THEN** the evaluation presents a rewritten natural version of the learner's own translation demonstrating the target construction.

#### Scenario: Rewrite withheld when the translation is already natural
- **WHEN** the submitted translation is already natural and the target construction is used correctly
- **THEN** the evaluation reports success and does not invent unnecessary rewrites.

#### Scenario: Evaluation shown as a round verdict
- **WHEN** an evaluation result is available for the current round
- **THEN** the round thread displays it as a verdict containing an overall summary, coverage status, and the natural version when warranted.

#### Scenario: Evaluation result cannot be interpreted
- **WHEN** the evaluation response does not conform to the expected verdict structure
- **THEN** the system displays the response text as plain feedback and offers a way to retry the evaluation.

#### Scenario: Reaching the existing SRS rating step
- **WHEN** the practice session is finished or the user ends the session
- **THEN** the system transitions all practiced cards to the manual SRS recall rating interface.
