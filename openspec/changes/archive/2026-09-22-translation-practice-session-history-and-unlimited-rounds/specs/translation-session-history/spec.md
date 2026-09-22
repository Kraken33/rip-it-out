# Spec Delta

## Purpose

Persisting Russian translation practice as reviewable session artefacts so learners can track words practiced and time spent across every round.

## ADDED Requirements

### Requirement: Translation practice session artefact
The system SHALL save every finished seamless translation practice as a session record containing all rounds (passage, learner translation, verdict summary, per-target outcomes), timing, and practiced constructions, and SHALL surface it in Library and word/time statistics. Word statistics SHALL count ONLY the learner's translations.

#### Scenario: Finishing practice creates a session record
- **WHEN** the user clicks Finish Practice after completing at least one round
- **THEN** the system creates a session with sourceType `translation-practice`, title containing date and round/construction counts, `messages` holding one entry per round (passage, translation, verdict summary, per-target states), `rawText` built ONLY from learner translations joined by blank lines, and `durationSeconds` measured from session start.

#### Scenario: Session appears in Library and stats
- **WHEN** a translation practice session record exists
- **THEN** it appears in the Library list with its title and construction count, its `rawText` (learner translations only) contributes to word metrics (total/unique words, vocabulary density), passages and verdicts stored in `messages`/`notes` are excluded from word counts, and its duration contributes an `activity_logs` entry linked to the session so Dashboard and Stats show its words and time.

#### Scenario: Empty practice saves nothing
- **WHEN** the user finishes without submitting any translation
- **THEN** no session record and no activity log entry are created, and the flow proceeds directly to SRS recall rating.

### Requirement: Per-round response capture
The system SHALL capture each round's learner response together with its passage, target constructions, verdict, and timestamps so the saved artefact is complete even when the user continues to further rounds.

#### Scenario: Round data accumulates during practice
- **WHEN** the user submits a translation and receives a verdict (or unparsable feedback) for a round
- **THEN** the system appends that round's passage text, translation text, construction list, verdict or raw feedback, and round duration to the in-progress session payload.

#### Scenario: Finish uses accumulated rounds
- **WHEN** the user clicks Finish Practice
- **THEN** the saved session contains exactly the rounds submitted so far in order, with no placeholder or loading entries.
