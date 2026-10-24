# Spec Delta

## MODIFIED Requirements

### Requirement: Translation practice session artefact
The system SHALL save every finished seamless translation practice as a session record containing all rounds (passage, learner translation, verdict summary, per-target outcomes), timing, and practiced constructions, and SHALL surface it in Library and word/time statistics. Word statistics SHALL count ONLY the learner's translations.

#### Scenario: Finishing practice creates a session record
- **WHEN** the user finishes Seamless Translation Practice after completing at least one round (either by rating the final card in the queue or clicking Finish early)
- **THEN** the system creates a session with sourceType `translation-practice`, title containing date and round/construction counts, `messages` holding one entry per round (passage, translation, verdict summary, per-target states), `rawText` built ONLY from learner translations joined by blank lines, and `durationSeconds` measured from session start.

#### Scenario: Session appears in Library and stats
- **WHEN** a translation practice session record exists
- **THEN** it appears in the Library list with its title and construction count, its `rawText` (learner translations only) contributes to word metrics (total/unique words, vocabulary density), passages and verdicts stored in `messages`/`notes` are excluded from word counts, and its duration contributes an `activity_logs` entry linked to the session so Dashboard and Stats show its words and time.

#### Scenario: Empty practice saves nothing
- **WHEN** the user finishes a Seamless Translation Practice session without submitting any translation
- **THEN** no session record and no activity log entry are created, and the flow transitions directly to the session completion view.
