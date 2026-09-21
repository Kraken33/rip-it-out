# Spec Delta — Russian Practice

## MODIFIED Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run a 4-5 round exercise in Russian, embedding 3-5 target constructions per round with visual bracket tags `[[Russian phrase|target construction]]`, awaiting English translation after each round.

## ADDED Requirements

### Requirement: Multi-Round Russian Translation Practice
The system SHALL batch top ~20 upcoming or due SRS cards into 4-5 rounds of 3-5 target constructions per passage for Russian-to-English translation practice.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due or upcoming SRS cards sorted by schedule and divides them into sequential rounds of 3-5 items.

### Requirement: Construction Highlighting and Parsing
The system SHALL parse and render target construction annotations in generated Russian passages into visual UI badges with English target tooltips.

#### Scenario: Rendering highlighted constructions in Russian text
- **WHEN** a Russian passage containing tagged constructions `[[Russian phrase|target construction]]` is received or generated
- **THEN** the UI highlights the Russian phrase visually and displays the associated target English construction.

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI streaming sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app streams Russian passages with highlighted constructions, accepts user spoken or typed English translations, provides immediate feedback per round, and auto-advances through rounds.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces.

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL transition the user to the manual SRS recall rating interface after translation practice completes.

#### Scenario: Transition after practice completion
- **WHEN** all translation practice rounds are finished or the user ends the session
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall (Again, Hard, Good, Easy) for all practiced cards.
