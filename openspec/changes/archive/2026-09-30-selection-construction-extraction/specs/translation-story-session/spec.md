# Spec Delta

## MODIFIED Requirements

### Requirement: Unlimited story-translation rounds

The system SHALL provide unlimited on-demand Russian story rounds inside a session, each round presenting one Russian story passage written in natural spoken Russian, accepting one English translation, and returning one improved version.

#### Scenario: Starting the first story round
- **WHEN** the user enters a translation activity session with seamless AI available
- **THEN** the system generates the first Russian story passage grounded in the session's optional story topic/demands (free-topic when none were given) and the learner level, written in natural spoken Russian, and presents it with a translation input.

#### Scenario: First round of a session without demands ignores the auto-generated title
- **WHEN** the user starts a translation session without entering story topic/demands, so the session carries an auto-generated date-based title
- **THEN** the first passage covers a fresh everyday topic in spoken Russian and is not about the current date, the session title, or a calendar event.

#### Scenario: Requesting the next story
- **WHEN** the user has submitted a translation and received its improved version, and clicks Next Round
- **THEN** the system generates a fresh Russian story passage on a topic not already used in this session, still honouring the session's story topic/demands when present and still in natural spoken Russian, and presents it as a new round.

#### Scenario: Finishing with no translations
- **WHEN** the user finishes the translation activity without submitting any translation
- **THEN** no improvements are produced and the flow returns without creating vault entries.

### Requirement: Per-round improved version for daily speaking

The system SHALL return, for each submitted translation, an improved version that is comprehensive, fluent, and optimized for daily speaking, preserving the learner's meaning, and SHALL NOT generate candidate constructions for the round.

#### Scenario: Improved version preserves meaning
- **WHEN** the learner submits an English translation of a story passage
- **THEN** the improved version keeps the learner's meaning and wording where natural, fixes errors, and uses fluent spoken phrasing rather than formal written style.

#### Scenario: Correct translation is affirmed
- **WHEN** the submitted translation is already natural and fluent
- **THEN** the system affirms success and presents no invented rewrite.

#### Scenario: Unparsable feedback is preserved
- **WHEN** the per-round feedback response cannot be parsed into the expected structure
- **THEN** the system displays the raw feedback text in the round thread, marks structured extraction as unavailable, and offers retry without discarding the learner's translation.

### Requirement: Translation session artefact

The system SHALL persist a finished translation-story session to the configured storage backend as a session record carrying the activity marker, all rounds (passage, learner translation, and improved version), timing measured from session start and logged as activity, and learner-only word metrics.

#### Scenario: Finished translation session is saved
- **WHEN** the user finishes after at least one submitted translation
- **THEN** the system creates a session with `activity` set to `translation`, `messages` or rounds holding one entry per round, `rawText` built ONLY from learner translations, and `durationSeconds` measured from session start.

#### Scenario: Finishing returns to the Dashboard
- **WHEN** the learner finishes the translation activity after submitting at least one translation
- **THEN** the session is saved and the flow returns to the Dashboard with no import or review step.

#### Scenario: Session time is logged as activity
- **WHEN** a translation-story session is finished
- **THEN** an activity log entry of type `session` with the measured duration is recorded so Dashboard and Stats time widgets include the session.

#### Scenario: Translation session appears in Library and stats
- **WHEN** a translation-story session record exists
- **THEN** it appears in Library under its title, constructions harvested from it are listed as vault items scoped to that session, its learner translations contribute to word metrics, and passages/improved versions are excluded from word counts.

## REMOVED Requirements

### Requirement: End-of-session aggregation shows all constructions

**Reason**: Candidate constructions are no longer generated automatically, so there is nothing to aggregate. Learners now harvest the specific phrases they choose from each round's improved version.

**Migration**: No data migration is required. Historical sessions keep whatever constructions were already stored in their `messages`; new sessions save rounds without a constructions list, and a finished story session presents no import picker.
