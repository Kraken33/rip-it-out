# Spec Delta

## MODIFIED Requirements

### Requirement: Card Display
The front of the card must display the construction pattern. The review session SHALL remain available even when zero cards are due by falling back to upcoming ("coming soon") cards, while cards due intraday (including 1m and 10m steps) SHALL be presented immediately as due for review.

#### Scenario: Card Front Rendering
- **WHEN** a due card is rendered
- **THEN** the target construction pattern is displayed prominently on the front.

#### Scenario: Fallback Review When Zero Cards Are Due
- **WHEN** user launches Flashcard Review when zero cards are due today but cards exist in the vault
- **THEN** the system fetches the top 5 upcoming ("coming soon") cards sorted by scheduled review date and allows the user to review them.

#### Scenario: Answer Reveal
- **WHEN** user clicks Show Answer
- **THEN** natural example sentence, explanation, and SRS rating buttons are revealed.

#### Scenario: Intraday Learning Step In-Session Repetition
- **WHEN** user completes a review rating of 1 (Again) during a review session
- **THEN** the card is requeued within the current session and its scheduled due date reflects the 1-minute intraday step so it remains active today.
