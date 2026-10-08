# Spec Delta

## MODIFIED Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run a single-sentence translation exercise in Russian, embedding exactly 1 target construction per round without spoiler tags or inline English answers, awaiting English translation after each round, then offering feedback and immediate round progression on learner request.

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in stateless on-demand rounds of exactly 1 construction each. When zero cards are due today, the system SHALL select the top 20 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available. In seamless translation mode, the system SHALL send the active construction to the LLM without prior conversation history, receive a single natural Russian sentence with zero bracket tags or English clues, accept the learner's translation, and immediately evaluate and branch to the next round.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 20 upcoming cards when zero cards are due today) sorted by schedule and presents them for single-sentence practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches up to 20 upcoming ("coming soon") cards sorted by scheduled review date and initializes the practice candidate queue.

#### Scenario: Unlimited two-construction rounds
- **WHEN** the user practices in seamless translation mode
- **THEN** each round embeds exactly 1 target construction in a single Russian sentence without clues, the round count is not pre-computed, and after each evaluated translation the system branches immediately to retry or advance.

#### Scenario: Dynamic construction pool selection by the LLM
- **WHEN** a translation round sentence is requested in seamless translation mode
- **THEN** the system sends the current active target construction to the LLM without attaching prior message history
- **AND** the LLM generates a single natural Russian sentence without bracket tags, clues, or English annotations.

#### Scenario: Pool reduction per round
- **WHEN** a translation round completes and the learner's translation naturally used the target construction
- **THEN** that construction is marked passed and removed from the active queue, and the next round begins immediately with the next unpracticed construction.

#### Scenario: Construction queue beyond available cards
- **WHEN** the learner misses a target construction or requests further rounds
- **THEN** a missed construction remains active for an immediate retry with a fresh sentence, and once all queued constructions are passed, the session completes.

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app presents a single natural Russian sentence for the active target construction without clue annotations, accepts typed or dictated English translation, immediately returns an evaluation verdict, and branches directly into the next round.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces with 1-construction single-sentence instructions.

### Requirement: Translation Verdict Evaluation
The system SHALL evaluate each submitted English translation against the Russian sentence and the round's single target construction, and SHALL report the outcome together with a corrected version of the learner's own translation. The evaluation SHALL grade whether the learner used the target construction correctly and naturally.

#### Scenario: Evaluation covers every target of the round
- **WHEN** the user submits a translation for a round testing the active target construction
- **THEN** the evaluation reports whether that target construction was used naturally, awkwardly, or not at all, providing notes and a corrected version when warranted.

#### Scenario: Correct usage of the target construction is accepted
- **WHEN** the learner used the target construction grammatically and appropriately for the sentence's meaning
- **THEN** the evaluation classifies that target as used naturally and confirms successful recall.

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

## REMOVED Requirements

### Requirement: Construction Highlighting and Parsing
**Reason**: Replaced by pure natural Russian sentences with zero bracket clues or spoiler annotations to ensure authentic active recall.
**Migration**: Sentences are rendered directly as natural Russian text without interactive reveal tooltips or bracket annotations.
