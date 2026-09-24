# Spec Delta

## ADDED Requirements

### Requirement: Auto-generated story session title is display-only

The system SHALL save a story-translation session created without learner story topic/demands with an auto-generated date-based display title used only for Library and replay labelling, and SHALL NOT use any part of that title as AI prompt input; the learner-provided story topic/demands remain the only topic source for generated stories.

#### Scenario: Empty demands still produce a display title
- **WHEN** the user starts a translation session without entering story topic/demands
- **THEN** the session is saved with a date-based display title and the translation session receives empty topic guidance.

#### Scenario: Date title never grounds the story
- **WHEN** a story passage is generated for a session whose title was auto-generated from the date
- **THEN** the story prompt contains no part of that title and the passage is chosen from a free everyday topic.

#### Scenario: Learner demands remain the topic source
- **WHEN** the user entered story topic/demands at session setup
- **THEN** the saved session title is the demands text and the generated stories are grounded in those demands.

#### Scenario: Display title stays in Library
- **WHEN** a finished story-translation session with an auto-generated title is viewed in Library
- **THEN** the session is still listed and replayable under that display title with its construction count.
