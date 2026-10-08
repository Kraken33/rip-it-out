# Russian Practice Specification

## Purpose
Prompt external LLMs with Russian scenario questions and single-sentence translation exercises for practicing English constructions.

## Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run a single-sentence translation exercise in Russian, embedding exactly 1 target construction per round without spoiler tags or inline English answers, awaiting English translation after each round, repeating the target construction ONLY if the target construction itself was omitted or used incorrectly, and providing feedback while advancing to the next construction whenever the target construction was used correctly (even when unrelated errors exist elsewhere in the translation).

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in stateless on-demand rounds of exactly 1 construction each. When zero cards are due today, the system SHALL select the top 20 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available. In seamless translation mode, the system SHALL send the active construction and its conceptual nuance explanation to the LLM without concrete narrative sentence examples and without prior conversation history, receive a single natural Russian sentence with zero bracket tags or English clues, accept the learner's translation, and immediately evaluate and branch to the next round.

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
- **THEN** the system sends the target construction and its conceptual nuance explanation (without embedding concrete narrative sentence examples) to the LLM without attaching prior message history
- **AND** the LLM generates a single natural, conversational Russian sentence without bracket tags, clues, or English annotations.

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

#### Scenario: Rating covers distinct practiced constructions
- **WHEN** the user ends an unlimited-round session in which some constructions were practiced more than once
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall for every distinct construction practiced in the session, and the saved translation session artefact remains available independent of the rating outcome.

### Requirement: Multi-Line Translation Input
The system SHALL provide a multi-line translation input in which an English answer can be written and reviewed in full before submission, and SHALL submit only on an explicit action rather than on a plain newline.

#### Scenario: Writing and reviewing a passage-length translation
- **WHEN** the user types a translation containing several sentences and line breaks
- **THEN** the input displays the text across multiple visible lines without horizontal scrolling, preserves the line breaks verbatim, and can be resized by the user or grows with the content up to a maximum height that keeps the round's Russian sentence visible.

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

### Requirement: Mobile-Responsive Translation Session Layout and Controls
The system SHALL provide an adaptive, touch-friendly, and decluttered layout for the Russian Translation Practice session that accommodates small mobile viewports without clipping content, causing horizontal overflow, or trapping focus, SHALL maintain simultaneous visibility of the active Russian passage and the translation input when the software keyboard is active, SHALL automatically scroll the message container to the active Russian passage upon input focus and virtual keyboard opening/viewport resize, and SHALL suppress the top session header on mobile devices while consolidating all session controls and status within a collapsible Actions HUD.

#### Scenario: Mobile viewport adaptive height and scrolling
- **WHEN** the translation practice session is viewed on a mobile device or narrow screen (<640px wide) with software keyboard open
- **THEN** the session container adapts dynamically to `window.visualViewport.height` without overflowing screen boundaries or causing window jumping
- **AND** the document body scroll is locked and focus scrolling is suppressed instantaneously (`preventScroll: true` / instant zero-scroll lock), eliminating sluggish scroll-back delays when opening the software keyboard
- **AND** the active Russian passage remains continuously visible and readable in the upper viewport while the learner is typing.

#### Scenario: Auto-scrolling to active practice passage on focus and keyboard opening
- **WHEN** the user focuses the translation input text area or the virtual keyboard opens in a translation practice session
- **THEN** the message thread container automatically scrolls to bring the current round's Russian passage into view above the composer dock
- **AND** the active passage remains visible in the shrunken viewport instead of showing earlier rounds.

#### Scenario: Mobile top header suppression and ultra-compact dock
- **WHEN** the translation practice session is rendered on a mobile device or screen width below 640px
- **THEN** the top session header bar (including round count, practiced badge, next round, and finish buttons) is completely hidden
- **AND** the bottom composer dock renders an ultra-compact toolbar containing only the full-width translation textarea and a single Actions toggle button displaying the active round count (e.g. `⚡ Actions (Round 1)`), omitting inline dictation and translate submit buttons.

#### Scenario: Mobile Actions HUD consolidated controls
- **WHEN** the user opens the collapsible Actions HUD on a mobile viewport
- **THEN** the HUD panel displays the round indicator and practiced cards count in its header alongside a close control
- **AND** the HUD panel renders full-width action buttons for `🎙️ Speak Answer` (audio dictation), `▶ Translate Translation` (submit), `➡️ Next Round`, `✓ Finish Practice & Rate Recall`, and optional `Exit to Practice Modes`.

#### Scenario: Desktop view preserves standard header and composer toolbar
- **WHEN** the translation practice session is viewed on a desktop viewport (>= 640px wide)
- **THEN** the top header bar displays the round count, practiced count, Next Round, and Finish buttons directly
- **AND** the bottom composer toolbar displays inline dictation recording and the Translate submit button beside the textarea.

#### Scenario: Touch-optimized translation input and guidance
- **WHEN** the translation practice session is rendered on a touch screen / mobile viewport
- **THEN** desktop-specific keyboard shortcut hints are replaced or hidden to maximize vertical space
- **AND** the translation textarea and submit controls render with minimum 16px font size (`text-base`) to prevent iOS zoom while remaining responsive and accessible when the virtual keyboard is active.
