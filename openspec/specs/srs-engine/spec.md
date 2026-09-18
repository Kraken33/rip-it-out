# SRS Engine Specification

## Purpose
Dynamically adjust flashcard review intervals using the SM-2 algorithm.

## Requirements

### Requirement: Review Rating Processing
Processing review ratings (1-4) must update card status, interval, and ease factor.

#### Scenario: Rating 1 (Again)
- **WHEN** user rates recall as 1 (Again)
- **THEN** status becomes learning, interval resets to 1 day, and lapses increment.

#### Scenario: Rating 2 (Hard)
- **WHEN** user rates recall as 2 (Hard)
- **THEN** ease factor decreases and interval scales conservatively.

#### Scenario: Rating 3 (Good)
- **WHEN** user rates recall as 3 (Good)
- **THEN** card advances through learning steps and graduates to reviewing.

#### Scenario: Rating 4 (Easy)
- **WHEN** user rates recall as 4 (Easy)
- **THEN** ease factor increases and bonus interval multiplier is applied.
