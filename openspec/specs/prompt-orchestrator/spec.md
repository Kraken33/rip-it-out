# Prompt Orchestrator Specification

## Purpose
Assemble structured prompts for external LLMs and parse pasted JSON outputs.

## Requirements

### Requirement: Prompt Generation
The app must generate Prompts #1-#4 with specific instructions and constraints.

#### Scenario: Prompt #1 Description
- **WHEN** Prompt #1 is generated
- **THEN** it includes instructions to ask 3 follow-up questions, extract construction patterns, and exclude article corrections.

#### Scenario: Prompt #2 Export
- **WHEN** Prompt #2 is generated
- **THEN** it requests a JSON schema with `construction`, `original`, `improved`, and `explanation` from the whole conversation.

#### Scenario: Prompt #3 Russian Practice
- **WHEN** Prompt #3 is generated
- **THEN** it requests 5 scenario questions in Russian (на русском языке) for target English constructions.

#### Scenario: JSON Parsing
- **WHEN** `parseImportJSON` processes raw or fenced LLM JSON output
- **THEN** it extracts valid improvement records and provides construction fallbacks.
