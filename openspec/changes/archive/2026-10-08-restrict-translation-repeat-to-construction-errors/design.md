# Design

## Context

See `proposal.md` for background and motivation. Single-sentence Russian translation practice operates in two parallel execution paths:
1. Copy-paste Prompt #5 (`generateTranslationPracticePrompt` in `src/prompts.js`), run in conversational LLMs like ChatGPT or Claude.
2. In-app Seamless AI evaluation (`evaluateTranslationRound` in `src/services/aiService.js`), which drives state branching in `TranslationPracticeSession.jsx`.

In `TranslationPracticeSession.jsx`, the branching rule treats a round as passed when all targets are `used` and have `quality === 'natural'`; any missing or `awkward` quality triggers a retry for the same card with a fresh sentence. Currently, LLMs in both modes penalize unrelated grammar/vocabulary errors by repeating the construction or marking it `awkward`.

## Goals / Non-Goals

**Goals:**
- Restrict repetition of target constructions in Prompt #5 to instances where the target construction itself was omitted or used incorrectly.
- Instruct Prompt #5 to advance to the next construction even when unrelated sentence errors exist, while still noting or fixing those errors in feedback.
- Explicitly instruct the `evaluateTranslationRound` prompt that errors outside the target construction MUST NOT cause `quality` to be marked as `awkward`.
- Preserve the natural English `rewrite` behavior to fix general sentence mistakes without blocking queue progression.

**Non-Goals:**
- Changing the session state machine or branching logic in `TranslationPracticeSession.jsx` (the existing check `constructions.every(c => c.used && c.quality === 'natural')` remains correct as long as `quality` reflects only the target construction).
- Modifying the Russian story session evaluation (`evaluateTranslationStory`).

## Decisions

### Decision 1: Explicit Repeat vs Advance Rules in Prompt #5
- **Choice**: Structure Step 4 of Prompt #5 with clear headings/rules:
  - `REPEAT RULE`: Repeat the construction ONLY if the target construction itself was omitted or used incorrectly (e.g., wrong preposition/particle, governed form, or semantic misuse of the construction).
  - `ADVANCE RULE`: If the target construction was used correctly, count the round as PASSED and present the next construction in Round N+1. If other parts of the sentence have mistakes (general grammar, unrelated verb tenses, typos), briefly note them in feedback without repeating the construction.
- **Alternatives Considered**: Keeping a general "grade only the target construction" sentence. Rejected because conversational LLMs default to pedagogical repeat whenever an answer has any mistake.

### Decision 2: Guarding Target Quality in `evaluateTranslationRound`
- **Choice**: Augment Rule 2 in `evaluateTranslationRound` with an explicit negative constraint:
  - `"quality": "natural"` when the learner used that target construction grammatically and appropriately for the sentence's meaning; `"awkward"` ONLY when their usage of THAT target construction itself is actually wrong or misused; null when `"used"` is false.
  - Add: `IMPORTANT: Grammar errors, typos, or awkwardness in OTHER parts of the sentence MUST NOT cause the target construction's quality to be marked as "awkward".`
  - Rule 4 retains the full sentence rewrite (`rewrite_needed: true` and corrected text in `rewrite`) to address mistakes elsewhere.
- **Alternatives Considered**: Altering `TranslationPracticeSession.jsx` to ignore `quality: awkward` if `rewrite` is provided. Rejected because a legitimate construction error *does* warrant `quality: awkward` and a retry. Fixing the prompt evaluation at the source ensures clean data in verdicts and metrics.

## Risks / Trade-offs

- **[Risk] Ambiguity between construction boundary errors and general grammar**: For example, in "look forward to hearing", using "hear" is an error in the construction's governed form, not an unrelated grammar error.
  - **Mitigation**: The prompt explicitly clarifies that errors governed by the pattern (such as prepositions, particles, or verb forms required by the construction) count as construction errors.
- **[Risk] Model hallucinations or ignoring negative constraints**: Small or weak models might occasionally still repeat.
  - **Mitigation**: Tested with OpenAI models configured at low temperature (0.3 in `evaluateTranslationRound`) and verified with unit tests asserting prompt instructions.
