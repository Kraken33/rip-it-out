# Flashcard Review Specification

## Purpose
Display target constructions on card front and reveal natural example sentence on card back.

## Requirements

### Requirement: Card Display
The front of the card must display the construction pattern. The review session SHALL remain available even when zero cards are due by falling back to upcoming ("coming soon") cards.

#### Scenario: Card Front Rendering
- **WHEN** a due card is rendered
- **THEN** the target construction pattern is displayed prominently on the front.

#### Scenario: Fallback Review When Zero Cards Are Due
- **WHEN** user launches Flashcard Review when zero cards are due today but cards exist in the vault
- **THEN** the system fetches the top 5 upcoming ("coming soon") cards sorted by scheduled review date and allows the user to review them.

#### Scenario: Answer Reveal
- **WHEN** user clicks Show Answer
- **THEN** natural example sentence, explanation, and SRS rating buttons are revealed.
