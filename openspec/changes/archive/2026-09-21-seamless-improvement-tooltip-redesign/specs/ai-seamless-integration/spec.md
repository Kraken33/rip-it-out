# Spec Delta

## MODIFIED Requirements

### Requirement: Improvement Annotation Interaction
The system SHALL present AI-generated improvement annotations in the seamless chat session by highlighting the original erroneous text with a distinct visual treatment (red colour) in the message body. The improved version and full improvement detail (category, pattern, original/improved comparison, explanation, context, and study list action) SHALL be revealed only when the user explicitly clicks the highlighted text. The popover MUST remain open until the user clicks outside it or uses the explicit close control.

#### Scenario: User sees annotated message after requesting improvements
- **GIVEN** the user has clicked "Improve Message" and improvements have been returned
- **WHEN** the annotated message is rendered
- **THEN** the message body MUST display the original text with erroneous segments visually flagged in red with a dashed underline
- **AND** no improved text SHALL be shown inline in the message body

#### Scenario: User clicks a flagged word to view improvement detail
- **GIVEN** an annotated message is displayed with at least one red-flagged segment
- **WHEN** the user clicks a flagged word
- **THEN** a popover MUST appear showing the improvement category, improved text, original/improved comparison, explanation, any context note, and an "Add to Study List" button
- **AND** the popover MUST remain open while the user interacts with it (including clicking the "Add to Study List" button)

#### Scenario: User dismisses the popover by clicking outside
- **GIVEN** a popover is open on a flagged word
- **WHEN** the user clicks anywhere outside the popover and its trigger span
- **THEN** the popover MUST close

#### Scenario: User dismisses the popover using the close button
- **GIVEN** a popover is open on a flagged word
- **WHEN** the user clicks the × close button inside the popover
- **THEN** the popover MUST close
