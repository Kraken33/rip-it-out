# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in stateless on-demand rounds of exactly 1 construction each. When zero cards are due today, the system SHALL select the top 20 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available. In seamless translation mode, the system SHALL send the active construction and its conceptual nuance explanation to the LLM without concrete narrative sentence examples and without prior conversation history, receive a single natural Russian sentence with zero bracket tags or English clues, accept the learner's translation, and immediately evaluate and branch to the next round.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 20 upcoming cards when zero cards are due today) sorted by schedule and presents them for single-sentence practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches up to 20 upcoming ("coming soon") cards sorted by scheduled review date and initializes the practice candidate queue.

#### Scenario: Unlimited two-construction rounds
- **WHEN** the user practices in seamless translation mode
- **THEN** each round embeds exactly 1 target construction in a single Russian sentence without clues, the round count is not pre-computed, and after each evaluated translation the system branches immediately to retry or advance.

#### Scenario: Dynamic construction pool selection by the LLM
- **WHEN** a translation round sentence is requested in seamless translation mode
- **THEN** the system sends the target construction and its conceptual nuance explanation (without embedding concrete narrative sentence examples) to the LLM without attaching prior message history
- **AND** the LLM generates a single natural, conversational Russian sentence without bracket tags, clues, or English annotations.

#### Scenario: Pool reduction per round
- **WHEN** a translation round completes and the learner's translation naturally used the target construction
- **THEN** that construction is marked passed and removed from the active queue, and the next round begins immediately with the next unpracticed construction.

#### Scenario: Construction queue beyond available cards
- **WHEN** the learner misses a target construction or requests further rounds
- **THEN** a missed construction remains active for an immediate retry with a fresh sentence, and once all queued constructions are passed, the session completes.
