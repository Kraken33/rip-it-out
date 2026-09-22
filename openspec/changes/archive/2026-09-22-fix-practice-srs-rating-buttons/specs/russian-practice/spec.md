# Spec Delta

## MODIFIED Requirements

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL transition the user to the manual SRS recall rating interface after translation practice completes. The rating interface MUST operate on the SRS card records corresponding to the practiced constructions, matched by improvement id — not on the improvement content records themselves. Every rating score (Again, Hard, Good, Easy) MUST be applicable to every queued card, MUST advance the rating queue, and MUST persist the updated SRS schedule for that card. Practiced constructions that have no corresponding SRS card MUST be excluded from the rating queue; if no practiced construction has an SRS card, the system MUST skip the rating step and present the practice completion state.

#### Scenario: Transition after practice completion
- **WHEN** all translation practice rounds are finished or the user ends the session
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall (Again, Hard, Good, Easy) for all practiced cards, with the queue built from those practiced cards' SRS records.

#### Scenario: Any rating score is accepted and persisted
- **WHEN** the user rates a practiced card with Hard, Good, or Easy (not only Again) after a translation practice session
- **THEN** the system applies the SM-2 update to that card's SRS record, persists it, and advances to the next practiced card or to the completion state.

#### Scenario: Rating persists the SRS schedule
- **WHEN** the user rates any practiced card with any score from 1 to 4
- **THEN** the stored SRS card for that improvement reflects the updated status, interval, ease factor, and next review date.

#### Scenario: Practiced construction without an SRS card
- **WHEN** a practiced construction has no corresponding SRS card record
- **THEN** that construction is excluded from the rating queue, and if no practiced construction has an SRS card the system presents the practice completion state instead of the rating interface.
