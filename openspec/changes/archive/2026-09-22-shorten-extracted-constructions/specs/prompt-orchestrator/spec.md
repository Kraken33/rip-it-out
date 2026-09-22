# Prompt Orchestrator Delta

## MODIFIED Requirements

### Requirement: Prompt Generation
The app must generate Prompts #1-#4 with specific instructions and constraints. Construction-extraction prompts (Prompt #1 and Prompt #2) SHALL instruct the LLM to keep each `construction` pattern short and reusable: a single compact phrase structure of roughly 2–7 words in one clause, using bracket slots (e.g. `"start taking [class] to [purpose]"`), and SHALL give a counter-example of an overly long, multi-clause pattern to avoid (e.g. `"If I wake up at [time], I feel [adjective] and like I haven't had enough sleep"`).

#### Scenario: Prompt #1 Description
- **WHEN** Prompt #1 is generated
- **THEN** it includes instructions to ask 3 follow-up questions, extract construction patterns, and exclude article corrections.

#### Scenario: Prompt #2 Export
- **WHEN** Prompt #2 is generated
- **THEN** it requests a JSON schema with `construction`, `original`, `improved`, and `explanation` from the whole conversation.

#### Scenario: Prompt #3 Russian Practice
- **WHEN** Prompt #3 is generated
- **THEN** it requests 5 scenario questions in Russian (на русском языке) for target English constructions.

#### Scenario: Short construction constraint in extraction prompts
- **WHEN** Prompt #1 or Prompt #2 is generated
- **THEN** it explicitly requires each `construction` to be a short, single-clause pattern of roughly 2–7 words
- **AND** it includes both a short-pattern example and a long multi-clause counter-example.

#### Scenario: JSON Parsing
- **WHEN** `parseImportJSON` processes raw or fenced LLM JSON output
- **THEN** it extracts valid improvement records and provides construction fallbacks.
