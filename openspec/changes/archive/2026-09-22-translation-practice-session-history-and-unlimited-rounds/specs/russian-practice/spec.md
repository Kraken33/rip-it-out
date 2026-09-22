# Spec Delta

## MODIFIED Requirements

### Requirement: Russian Practice Prompt
The system SHALL generate prompt structures for Russian language practice using targeted English constructions, supporting both open-ended Scenario Questions (Prompt #3) and Multi-Round Translation Exercises (Prompt #5).

#### Scenario: Prompt Generation for Scenario Questions
- **WHEN** user selects scenario questions practice mode
- **THEN** Prompt #3 is generated requesting 5 scenario questions in Russian for target English constructions.

#### Scenario: Prompt Generation for Multi-Round Translation
- **WHEN** user selects prompt-based translation practice mode with 20 upcoming cards
- **THEN** Prompt #5 is generated instructing the LLM to run an unlimited-round exercise in Russian, embedding exactly 2 target constructions per round with visual bracket tags `[[Russian phrase|target construction]]`, awaiting English translation after each round, then offering Next Round or Finish on learner request.

### Requirement: Multi-Round Russian Translation Practice
The system SHALL practice top upcoming or due SRS cards in unlimited on-demand rounds of exactly 2 constructions each. When zero cards are due today, the system SHALL select the top 5 upcoming ("coming soon") cards sorted by scheduled review date so practice mode is always available.

#### Scenario: Batching SRS cards for translation rounds
- **WHEN** user launches Translation Practice Mode
- **THEN** the system selects the top 20 due cards (or top 5 upcoming cards when zero cards are due today) sorted by schedule and presents them for practice.

#### Scenario: Fallback Practice When Zero Cards Are Due
- **WHEN** user launches Practice Mode (Scenario Q&A or Translation Practice) when zero cards are due today but cards exist in the vault
- **THEN** the system fetches the top 5 upcoming ("coming soon") cards sorted by scheduled review date and generates prompts/sessions for practice.

#### Scenario: Unlimited two-construction rounds
- **WHEN** the user practices in seamless translation mode
- **THEN** each round embeds exactly 2 target constructions, the round count is not pre-computed, and after each evaluated translation the user may request Next Round (a fresh 2-construction passage) or Finish Practice at any time.

#### Scenario: Construction queue beyond available cards
- **WHEN** the user requests more rounds than there are distinct queued constructions
- **THEN** the system reuses constructions starting from the least-recently-practiced in the session, never repeating a construction until every queued construction has been practiced once.

### Requirement: Dual Mode Execution (Seamless and Prompt-based)
The system SHALL support both in-app Seamless AI sessions and copy/paste Prompt-based sessions for Russian-to-English translation practice.

#### Scenario: In-app Seamless AI translation session
- **WHEN** user runs Translation Practice in Seamless AI mode
- **THEN** the app presents Russian passages with highlighted constructions, accepts a multi-line typed or dictated English translation of the passage, returns a per-round evaluation verdict for that translation, and offers Next Round (2 fresh constructions) or Finish Practice controls after each round.

#### Scenario: External LLM Prompt-based translation session
- **WHEN** user runs Translation Practice in Prompt-based mode
- **THEN** the app generates Prompt #5 for copying into ChatGPT/Claude web interfaces.

### Requirement: Transition to Manual SRS Recall Rating
The system SHALL present the SRS recall rating for the same cards that were practiced once translation practice completes.

#### Scenario: Transition after practice completion
- **WHEN** all translation practice rounds are finished or the user ends the session
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall (Again, Hard, Good, Easy) for all practiced cards
- **AND** each rating button updates that card's SRS schedule exactly once and advances to the next practiced card.

#### Scenario: Rating persists the SRS schedule
- **WHEN** the user selects any rating (Again, Hard, Good, or Easy) for a practiced card
- **THEN** the system persists the updated SRS card fields (status, easeFactor, intervalDays, nextReview) for that card's improvementId
- **AND** the rating interface remains responsive for the remaining practiced cards.

#### Scenario: No matching SRS cards after practice
- **WHEN** practice finishes but none of the practiced items has a matching SRS card record
- **THEN** the system does not present the rating interface for those items and instead presents the practice completion state.

#### Scenario: Rating covers distinct practiced constructions
- **WHEN** the user ends an unlimited-round session in which some constructions were practiced more than once
- **THEN** the system presents the manual SRS rating interface allowing the user to score recall for every distinct construction practiced in the session, and the saved translation session artefact remains available independent of the rating outcome.
