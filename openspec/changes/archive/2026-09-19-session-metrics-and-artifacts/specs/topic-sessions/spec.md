# Spec Delta

## ADDED Requirements

### Requirement: Topic entity aggregates session word metrics
The system SHALL aggregate total word count and unique word count across all sessions under a topic entity that possess `rawText`.

#### Scenario: Displaying aggregated topic word metrics
- **WHEN** topic sessions are retrieved for dashboard display
- **THEN** each topic includes computed `totalWords` and `uniqueWords` derived from all sessions within that topic containing valid `rawText`.
