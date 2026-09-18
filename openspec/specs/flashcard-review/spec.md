# Flashcard Review Specification

## Purpose
Display target constructions on card front and reveal natural example sentence on card back.

## Requirements

### Requirement: Card Display
The front of the card must display the construction pattern.

#### Scenario: Card Front Rendering
- **WHEN** a due card is rendered
- **THEN** the target construction pattern is displayed prominently on the front.

#### Scenario: Answer Reveal
- **WHEN** user clicks Show Answer
- **THEN** natural example sentence, explanation, and SRS rating buttons are revealed.
