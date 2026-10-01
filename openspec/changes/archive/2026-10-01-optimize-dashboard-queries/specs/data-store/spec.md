# Spec Delta

## ADDED Requirements

### Requirement: Efficient bulk data loading and in-memory aggregation
The data store SHALL provide bulk loading and in-memory computation helpers for dashboard, topic, session, and activity metrics to prevent repeated roundtrip queries over collections. When requesting topics with sessions or aggregated dashboard stats, the system MUST query each underlying database table at most once per operation.

#### Scenario: Topics with sessions loads in bulk
- **WHEN** `getTopicsWithSessions()` is invoked while connected to Supabase
- **THEN** it executes at most one query per distinct database table and returns fully aggregated session time, word counts, and phrase counts without issuing per-topic or per-session database requests.

#### Scenario: Dashboard data aggregation
- **WHEN** the dashboard screen loads all required metrics
- **THEN** all overall stats, today's word metrics, activity stats, and topic summaries are calculated without redundant duplicate table queries.
