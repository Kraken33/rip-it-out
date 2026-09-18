# Activity Tracking Specification Delta

## Requirements

### Requirement: Activity Duration Storage & Logging
The system SHALL persist activity log records in `rio_activity_logs` in localStorage. Each log record MUST contain `id`, `type` (`review` or `session`), `durationSeconds`, `createdAt`, and optional `sessionId` and `topicId`.

#### Scenario: Log activity session duration
- **WHEN** a session practice or review activity completes
- **THEN** an activity log entry is written to localStorage with the calculated duration in seconds.

#### Scenario: Export and Import round-trip
- **WHEN** data is exported via `exportAllData` and imported via `importData`
- **THEN** activity logs are preserved and merged/replaced cleanly.

### Requirement: Session & Practice Time Measurement
The system SHALL measure time elapsed from prompt copy / practice start until completion in `Session.jsx` and `Practice.jsx`.

#### Scenario: Practice Mode duration measurement
- **WHEN** user copies Prompt #3 or enters practice mode and later clicks "I'm Done Practicing"
- **THEN** the duration spent is recorded for that session and logged as a `session` activity log.

### Requirement: Flashcard Review Time Measurement
The system SHALL measure active time spent in the card review interface (`Review.jsx`) and log it upon queue completion or session exit.

#### Scenario: Review Queue duration measurement
- **WHEN** user completes a card review queue
- **THEN** total review duration is calculated and logged, attributed to the topics/sessions of the reviewed cards.

### Requirement: Topic and Session Time Aggregation
The system SHALL calculate and return total time spent per session and total time spent per topic (sum of session practice times and card review times for cards in that topic).

#### Scenario: Dashboard Topic Header display
- **WHEN** topics are retrieved with `getTopicsWithSessions()`
- **THEN** each topic includes a `totalTimeSeconds` formatted string (e.g., `45 mins` or `1h 15m`).

#### Scenario: Dashboard Session Row display
- **WHEN** a topic is expanded on the dashboard
- **THEN** each session row calculates its combined practice and review time via `getSessionTime(sessionId)` and displays its time badge (e.g., `⏱️ 45s`).

### Requirement: Statistics & Dashboard Metrics
The system SHALL provide statistics helper methods and UI components for displaying time spent today, total time spent, activity breakdown (review vs session), and top topics by time spent.

#### Scenario: Dashboard Stats Widget rendering
- **WHEN** Dashboard renders
- **THEN** it displays Today's time spent and Total learning time with a link to full Statistics.
