# Spec Delta: Library Search

## MODIFIED Requirements

### Requirement: Search Filtering
Vault items SHALL be filterable by construction search query, category, SRS status, spoken frequency, or specific session ID via URL parameter.

#### Scenario: Construction Search
- **WHEN** user enters search terms matching a construction
- **THEN** matching vault items are displayed.

#### Scenario: Session Filter via URL Parameter
- **WHEN** user navigates to the Library with a session query parameter (`?session=<id>`)
- **THEN** system automatically pre-filters and displays only vault items associated with that session ID
