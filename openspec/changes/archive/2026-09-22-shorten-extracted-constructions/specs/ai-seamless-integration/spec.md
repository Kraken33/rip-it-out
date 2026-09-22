# Seamless AI Integration Delta

## ADDED Requirements

### Requirement: Concise Construction Patterns in AI Evaluation
The end-of-session evaluation prompt (`generateSeamlessSessionFeedback`) SHALL instruct the model to keep each `construction` pattern short and reusable: a single compact phrase structure of roughly 2–7 words in one clause, using bracket slots (e.g. `"start taking [class] to [purpose]"`), and SHALL give a counter-example of an overly long, multi-clause pattern to avoid (e.g. `"If I wake up at [time], I feel [adjective] and like I haven't had enough sleep"`).

#### Scenario: Evaluation prompt constrains construction length
- **WHEN** the end-of-session evaluation request is built
- **THEN** the prompt MUST explicitly require each `construction` to be a short, single-clause pattern of roughly 2–7 words
- **AND** MUST include both a short-pattern example and a long multi-clause counter-example.
