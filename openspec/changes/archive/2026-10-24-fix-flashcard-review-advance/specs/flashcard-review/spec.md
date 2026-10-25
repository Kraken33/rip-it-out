# Spec Delta

## ADDED Requirements

### Requirement: Review Queue Progression
The review session SHALL advance to the next card in the queue when an SRS rating (Again, Hard, Good, or Easy) is selected without crashing or getting stuck on the evaluated card. When all cards in the queue (including any cards requeued via the Again rating) have been evaluated, the session SHALL display the session completion summary.

#### Scenario: Advance to Next Card
- **WHEN** user evaluates the currently displayed card with any SRS rating (Again, Hard, Good, Easy) and additional cards remain in the queue
- **THEN** the interface transitions to the next card with the answer hidden.

#### Scenario: Session Completion
- **WHEN** user evaluates the final card in the queue with an SRS rating and no further cards remain
- **THEN** the session completion screen is displayed showing the summary statistics for the review session.
