# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in stateless on-demand card-style exercises of 1 target construction per card. When zero cards are due today, the system SHALL select the top 20 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available. In seamless translation mode, the system SHALL present one active card at a time, send the active construction and its conceptual nuance explanation to the LLM without concrete narrative sentence examples and without prior conversation history, display the generated natural Russian sentence on the card with zero bracket tags or English clues alongside a pre-focused translation input, accept the learner's translation, and immediately display the evaluation verdict on the same card together with inline SRS recall rating controls and an option to generate another Russian sentence for the same construction.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 20 upcoming cards when zero cards are due today) sorted by schedule and presents them one card at a time for single-sentence translation practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches up to 20 upcoming ("coming soon") cards sorted by scheduled review date and initializes the practice candidate queue.

#### Scenario: Unlimited two-construction rounds
- **WHEN** the user practices in seamless translation mode
- **THEN** each card exercise embeds exactly 1 target construction in a single Russian sentence without clues, the total number of generated sentences is not pre-computed, and after each evaluated translation the learner can generate additional sentences for the current construction or rate recall to advance.

#### Scenario: Dynamic construction pool selection by the LLM
- **WHEN** a translation sentence is requested for the active card in seamless translation mode
- **THEN** the system sends the target construction and its conceptual nuance explanation (without embedding concrete narrative sentence examples) to the LLM without attaching prior message history
- **AND** the LLM generates a single natural, conversational Russian sentence without bracket tags, clues, or English annotations, framed as a realistic dialogue reaction or situational premise (e.g. declining an offer, answering an implicit question, explaining a reason, or reacting to a friend) rather than a bare isolated literal translation of the target construction.

#### Scenario: Pool reduction per round
- **WHEN** a translation attempt on the active card is evaluated and the learner selects an SRS recall rating (`Again`, `Hard`, `Good`, or `Easy`)
- **THEN** that construction's SRS schedule is updated and the active card advances immediately to the next unpracticed construction in the queue.

#### Scenario: Construction queue beyond available cards
- **WHEN** the learner wants additional practice on the active construction after seeing the evaluation verdict and clicks "Generate another sentence"
- **THEN** the current construction remains active on the card, a fresh Russian sentence is generated for that same construction, the translation input is cleared and pre-focused, and once all queued constructions are rated, the session completes.

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI card sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app presents a card displaying a single natural Russian sentence for the active target construction without clue annotations and a pre-focused translation input, accepts typed or dictated English translation, immediately renders the evaluation verdict on the card, and allows the learner to either generate another sentence for the same construction or rate their recall to move to the next card.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces with 1-construction single-sentence instructions.

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL persist SRS recall ratings (`Again`, `Hard`, `Good`, `Easy`) for practiced cards either inline on each card immediately after evaluation during Seamless AI translation practice or via a post-session rating screen after Prompt-based practice.

#### Scenario: Transition after practice completion
- **WHEN** a translation on the active card is evaluated in Seamless AI mode (or when the user finishes Prompt-based practice)
- **THEN** the system presents the manual SRS rating controls (`Again`, `Hard`, `Good`, `Easy`) allowing the user to score recall immediately on the evaluated card (or sequentially for Prompt-based sessions)
- **AND** each rating button updates that card's SRS schedule and advances to the next card.

#### Scenario: Rating persists the SRS schedule
- **WHEN** the user selects any rating (`Again`, `Hard`, `Good`, or `Easy`, or presses keys `1`–`4` on an evaluated card) for a practiced card
- **THEN** the system persists the updated SRS card fields (`status`, `easeFactor`, `intervalDays`, `nextReview`) for that card's `improvementId`
- **AND** advances to the next card in the queue (or completes the session when the final card is rated).

#### Scenario: No matching SRS cards after practice
- **WHEN** practice finishes (either after inline rating in Seamless AI mode or when none of the practiced items has a matching unrated SRS card record)
- **THEN** the system does not present a redundant batch rating screen and instead presents the practice completion state.

#### Scenario: Rating covers distinct practiced constructions
- **WHEN** the user generates multiple sentences for the same construction on a card before rating recall or ends the session
- **THEN** each distinct construction is rated once to advance to the next card, and the saved translation session artefact records all submitted rounds independent of the rating outcome.

### Requirement: Multi-Line Translation Input
The system SHALL provide a pre-focused, multi-line translation input inside the active practice card in which an English answer can be written and reviewed in full before submission, and SHALL submit only on an explicit action rather than on a plain newline.

#### Scenario: Pre-focusing the translation input when a sentence loads
- **WHEN** a Russian sentence finishes loading on the active practice card (on initial card load, after advancing to the next card, or after clicking "Generate another sentence")
- **THEN** the multi-line translation input is automatically focused so the learner can start typing immediately without clicking the field.

#### Scenario: Writing and reviewing a passage-length translation
- **WHEN** the user types a translation containing several sentences and line breaks
- **THEN** the input displays the text across multiple visible lines without horizontal scrolling, preserves the line breaks verbatim, and keeps the card's Russian sentence visible.

#### Scenario: Pressing Enter inside the translation input
- **WHEN** the user presses Enter while the translation input has focus
- **THEN** a newline is inserted into the translation and no request is sent; the translation is submitted only by activating the Translate control or by pressing its keyboard submit shortcut (`Ctrl+Enter` / `Cmd+Enter`), and the submitted text preserves the newlines the user typed.

#### Scenario: Adding dictated speech to an existing translation
- **WHEN** the user has already written text in the translation input and then completes a voice recording
- **THEN** the transcription MUST be inserted at the current caret position instead of being appended to the end of the text, and a later submission MUST include both the typed and the dictated text.

#### Scenario: Submitting an empty or in-flight translation
- **WHEN** the translation input contains only whitespace, or an evaluation is already in progress for the current round
- **THEN** the system MUST NOT send an evaluation request and MUST retain the translation text.

### Requirement: Translation Verdict Evaluation
The system SHALL evaluate each submitted English translation against the Russian sentence and the card's single target construction, and SHALL report the outcome on the active card together with a corrected version of the learner's own translation. The evaluation SHALL grade whether the learner used the target construction correctly and naturally.

#### Scenario: Evaluation covers every target of the round
- **WHEN** the user submits a translation for a card testing the active target construction
- **THEN** the evaluation reports whether that target construction was used naturally, awkwardly, or not at all, providing notes and a corrected version when warranted.

#### Scenario: Correct usage of the target construction is accepted
- **WHEN** the learner used the target construction grammatically and appropriately for the sentence's meaning
- **THEN** the evaluation classifies that target as used naturally and confirms successful recall, even when the translation contains unrelated errors, typos, or grammatical flaws in other parts of the sentence.

#### Scenario: Unrelated sentence errors do not trigger construction repetition
- **WHEN** the submitted translation contains errors, typos, or awkward phrasing outside the target construction while the target construction itself was used grammatically and appropriately
- **THEN** the evaluation classifies the target construction as used naturally (`quality: "natural"`), includes a corrected version of the learner's own sentence in the rewrite without marking the construction awkward, and does NOT force an automatic repetition of that target construction.

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
- **WHEN** an evaluation result is available for the current attempt
- **THEN** the active card displays the learner's submitted translation alongside the verdict summary, target coverage badge, natural version when warranted, target construction reference details, the control to generate another sentence, and the inline SRS recall rating buttons.

#### Scenario: Evaluation result cannot be interpreted
- **WHEN** the evaluation response does not conform to the expected verdict structure
- **THEN** the system displays the response text as plain feedback on the card and offers a way to retry the evaluation as well as the controls to generate another sentence or rate recall.

#### Scenario: Reaching the existing SRS rating step
- **WHEN** an evaluation completes on the active card in Seamless AI mode (or when a Prompt-based session is finished)
- **THEN** the learner can immediately rate recall (`Again`, `Hard`, `Good`, `Easy`) on the card (or in the post-session rating view for Prompt-based mode).

## REMOVED Requirements

### Requirement: Mobile-Responsive Translation Session Layout and Controls
**Reason**: The scrolling chat thread (`InteractiveSessionShell`) and its mobile-specific collapsible chat Actions HUD are replaced by a self-contained single-card interface where the Russian sentence, translation input, inline verdict, and rating/retry buttons fit directly within the card layout across desktop and mobile viewports.
**Migration**: Render the active Russian sentence, translation textarea, dictation button, and post-evaluation actions directly inside the responsive card container in `TranslationPracticeSession`.
