# Spec Delta

## MODIFIED Requirements

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support exclusively interactive in-app Seamless AI card sessions for Russian-to-English translation practice, removing manual Prompt #5 copy/paste workflows and prompt-mode tabs.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice
- **THEN** the app presents a card displaying a single natural Russian sentence for the active target construction without clue annotations and a pre-focused translation input, accepts typed or dictated English translation, immediately renders the evaluation verdict on the card, and allows the learner to either generate another sentence for the same construction or rate their recall to move to the next card.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user opens Practice mode
- **THEN** no external LLM Prompt #5 generation or copy interfaces are provided and the app directly initializes the card-style Seamless AI Translation Practice.

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL persist SRS recall ratings (`Again`, `Hard`, `Good`, `Easy`) for practiced cards inline on each card immediately after evaluation during Seamless AI translation practice, and SHALL NOT display post-session sequential rating screens for external prompt sessions.

#### Scenario: Transition after practice completion
- **WHEN** a translation on the active card is evaluated in Seamless AI mode
- **THEN** the system presents the manual SRS rating controls (`Again`, `Hard`, `Good`, `Easy`) allowing the user to score recall immediately on the evaluated card
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

## REMOVED Requirements

### Requirement: Russian Practice Prompt
**Reason**: Scenario Questions (Prompt #3) and Multi-Round Translation (Prompt #5) copy/paste interfaces are removed in favor of seamless in-app AI exercises.
**Migration**: Users practice target constructions directly in-app using card-style Seamless AI Translation Practice.
