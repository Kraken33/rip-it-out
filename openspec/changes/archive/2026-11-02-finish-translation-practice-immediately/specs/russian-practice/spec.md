# Spec Delta

## MODIFIED Requirements

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL persist SRS recall ratings (`Again`, `Hard`, `Good`, `Easy`) for practiced cards inline on each card immediately after evaluation during Seamless AI translation practice, and SHALL NOT display post-session sequential rating screens. When the learner finishes the practice session early via the finish control, the system SHALL finish the session immediately and transition directly to the completion state without presenting a post-session rating screen, ignoring any currently unrated card.

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

#### Scenario: Finishing practice early via finish control
- **WHEN** the learner activates the Finish Practice control while a card is active (whether not yet submitted, in evaluation, or evaluated without an inline recall rating selected)
- **THEN** the system terminates the practice session immediately and transitions directly to the completion state without displaying a batch recall rating screen
- **AND** any active card that has not been rated inline is excluded from SRS schedule updates
- **AND** the saved translation session artefact and activity logs record all rounds evaluated prior to finishing.
