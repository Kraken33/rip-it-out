# Spec Delta

## MODIFIED Requirements

### Requirement: Pagination State Persistence
The system SHALL persist the user's active page number, current sentence index, and session progress counts (completed, skipped, and saved counts) to the remote database when authenticated and to local storage as an optimistic cache, synchronizing state across devices.

#### Scenario: Resuming session across page reload
- **WHEN** user reloads the application or returns to frequency practice
- **THEN** system restores the previously saved page number, sentence index, and session progress counts from database or local storage

#### Scenario: Resuming session across device switch
- **WHEN** user signs in or opens frequency practice on another device
- **THEN** system restores the latest page number, sentence index, and progress counts from the database using timestamp conflict resolution

#### Scenario: Offline progress persistence
- **WHEN** user practices while disconnected from the network or unauthenticated
- **THEN** system persists progress to local storage and synchronizes with the remote database upon subsequent network reconnect or user authentication

## ADDED Requirements

### Requirement: Unified Practice Shell and Design Paradigm
The system SHALL embed frequency sentence practice within a shared practice navigation shell featuring segmented mode tabs for Translation Practice and Frequency Practice, and SHALL style cards, progress indicators, and rating actions in alignment with the core practice design tokens.

#### Scenario: Navigating between practice modes
- **WHEN** user views frequency practice
- **THEN** system displays the shared practice navigation header with "Translation Practice" and "Frequency Sentences" mode tabs, allowing instant navigation between practice modes

#### Scenario: Standardized rating actions
- **WHEN** user reveals a frequency sentence card
- **THEN** system displays standardized SRS rating actions (Again, Hard, Good, Easy) conforming to the unified practice rating button palette and keyboard shortcuts (1-4)
