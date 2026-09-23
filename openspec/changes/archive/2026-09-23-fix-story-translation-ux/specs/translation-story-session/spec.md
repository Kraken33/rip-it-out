# Spec Delta

## MODIFIED Requirements

### Requirement: Unlimited story-translation rounds

The system SHALL provide unlimited on-demand Russian story rounds inside a session, each round presenting one Russian story passage, accepting one English translation, and returning one improved version with candidate constructions.

#### Scenario: Starting the first story round
- **WHEN** the user enters a translation activity session with seamless AI available
- **THEN** the system generates the first Russian story passage grounded in the session's optional story topic/demands (free-topic when none were given) and the learner level, and presents it with a translation input.

#### Scenario: Requesting the next story
- **WHEN** the user has submitted a translation and received its improved version, and clicks Next Round
- **THEN** the system generates a fresh Russian story passage on a topic not already used in this session, still honouring the session's story topic/demands when present, and presents it as a new round.

#### Scenario: Finishing with no translations
- **WHEN** the user finishes the translation activity without submitting any translation
- **THEN** no improvements are produced and the flow returns without creating vault entries.

### Requirement: Translation session artefact

The system SHALL persist a finished translation-story session to the configured storage backend as a session record carrying the activity marker, all rounds (passage, learner translation, improved version, candidate constructions), timing measured from session start and logged as activity, and learner-only word metrics.

#### Scenario: Finished translation session is saved
- **WHEN** the user finishes after at least one submitted translation
- **THEN** the system creates a session with `activity` set to `translation`, `messages` or rounds holding one entry per round, `rawText` built ONLY from learner translations, and `durationSeconds` measured from session start.

#### Scenario: Session time is logged as activity
- **WHEN** a translation-story session is finished
- **THEN** an activity log entry of type `session` with the measured duration is recorded so Dashboard and Stats time widgets include the session.

#### Scenario: Translation session appears in Library and stats
- **WHEN** a translation-story session record exists
- **THEN** it appears in Library with its title and construction count, its learner translations contribute to word metrics, and passages/feedback are excluded from word counts.

## ADDED Requirements

### Requirement: End-of-session aggregation shows all constructions

The system SHALL aggregate ALL candidate constructions from all completed rounds into a single deduplicated import list when the user finishes the translation activity, with no session-wide cap; the selective import picker is the only filter before vault writes.

#### Scenario: Aggregation across rounds
- **WHEN** the user finishes after completing two or more rounds
- **THEN** the aggregated list contains deduplicated constructions from every round in order, each with construction, original, improved, explanation, category, and spoken frequency.

#### Scenario: Aggregation shows every round's candidates
- **WHEN** the aggregated candidates exceed `settings.maxImprovements`
- **THEN** the system still presents all deduplicated candidates from every round, including the latest round, and the user chooses which to import via the selective picker.

## REMOVED Requirements

### Requirement: End-of-session aggregation of constructions

**Reason**: The `settings.maxImprovements` session-wide cap hid later rounds' candidates (per-round cap of 3 plus earliest-rounds-first dedupe meant rounds after round 1 never surfaced). Users should see everything and filter via the selective import picker.

**Migration**: Replaced by "End-of-session aggregation shows all constructions". `settings.maxImprovements` continues to govern the dialogue session path; no data migration needed.
