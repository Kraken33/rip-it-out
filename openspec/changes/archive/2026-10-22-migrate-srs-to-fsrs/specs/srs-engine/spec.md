# Spec Delta

## MODIFIED Requirements

### Requirement: Review Rating Processing
Processing review ratings (1-4) SHALL update card state, stability, difficulty, scheduled days, and due timestamp using the Free Spaced Repetition Scheduler (FSRS) with intraday learning steps.

#### Scenario: Rating 1 (Again)
- **WHEN** user rates recall as 1 (Again) on a new, learning, or review card
- **THEN** card enters or remains in learning/relearning state, lapses increment, and next review is scheduled for the immediate short-term step (1 minute) rather than 24 hours later.

#### Scenario: Rating 2 (Hard)
- **WHEN** user rates recall as 2 (Hard)
- **THEN** card difficulty increases, stability adjusts conservatively, and next review is scheduled with a conservative short interval.

#### Scenario: Rating 3 (Good)
- **WHEN** user rates recall as 3 (Good) on a new or learning card
- **THEN** card advances through the short-term learning sequence (10 minutes) before graduating to long-term review.

#### Scenario: Rating 4 (Easy)
- **WHEN** user rates recall as 4 (Easy) on a new or learning card
- **THEN** card immediately graduates to long-term review state with an accelerated multi-day stability interval.

## ADDED Requirements

### Requirement: Legacy Card Backward Compatibility
The SRS engine SHALL transparently accept legacy card structures (containing `easeFactor`, `intervalDays`, `status`, `repetitions`) and convert them into valid FSRS states with positive stability and calibrated difficulty without data loss.

#### Scenario: Legacy card processed through FSRS
- **WHEN** a card saved prior to the FSRS migration is reviewed
- **THEN** its historical interval is mapped to initial stability, status is mapped to the corresponding FSRS state, and the resulting review persists modern FSRS properties.
