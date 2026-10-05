# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in unlimited on-demand rounds of exactly 2 constructions each. When zero cards are due today, the system SHALL select the top 20 upcoming ("coming soon") cards sorted by scheduled review date so multi-round practice mode is always available. In seamless translation mode, the system SHALL provide a candidate pool of unpracticed constructions to the LLM, which SHALL select 2 constructions that fit together naturally and return a structured JSON response containing the picked constructions and the tagged Russian passage, after which the picked constructions SHALL be removed from the candidate pool for subsequent rounds.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 20 upcoming cards when zero cards are due today) sorted by schedule and presents them for practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches up to 20 upcoming ("coming soon") cards sorted by scheduled review date and initializes the practice candidate pool.

#### Scenario: Unlimited two-construction rounds
- **WHEN** the user practices in seamless translation mode
- **THEN** each round embeds exactly 2 target constructions selected by the LLM from the unpracticed pool, the round count is not pre-computed, and after each evaluated translation the user may request Next Round (a fresh 2-construction passage) or Finish Practice at any time.

#### Scenario: Dynamic construction pool selection by the LLM
- **WHEN** a translation round passage is requested in seamless translation mode
- **THEN** the system sends the current pool of unpracticed candidate constructions to the LLM
- **AND** the LLM selects 2 constructions from the pool that naturally complement each other, generates a short Russian passage embedding them with `[[Russian phrase|target construction]]` tags, and returns a structured JSON response containing the picked constructions and the passage.

#### Scenario: Pool reduction per round
- **WHEN** a translation round completes and the user requests Next Round
- **THEN** the 2 constructions picked for that round are removed from the candidate pool
- **AND** the next round's generation request is sent with the updated candidate pool, preventing reuse of those constructions and avoiding conversation history leakage.

#### Scenario: Construction queue beyond available cards
- **WHEN** the user requests a round when fewer than 2 unpracticed constructions remain in the candidate pool
- **THEN** the candidate pool is repopulated starting from the least-recently-practiced constructions in the session, never repeating a construction until every queued construction has been practiced once.
