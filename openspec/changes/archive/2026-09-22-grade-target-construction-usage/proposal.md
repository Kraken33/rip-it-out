# Proposal

## Why

In Russian translation practice, the AI evaluation grades the learner's translation against ideal native phrasing instead of against the round's target constructions. The model substitutes a different, "more natural" construction in the `better` field and rewrite (e.g. replacing the target "have [someone] over" with "came to our office") and marks acceptable usage of a target construction as awkward. The learner wants to know whether they used the *target* constructions correctly — not to be sold alternative constructions.

## What Changes

- Rewrite the grading rules in the `evaluateTranslationRound` system prompt (`src/services/aiService.js`) so the model evaluates only the learner's usage of each **target construction**:
  - Classify a target as "natural" when the learner used that construction grammatically and appropriately, even if a different construction would be more idiomatic.
  - When a target lists alternatives separated by `/` (e.g. "be actively looking / be actively job hunting"), using any one alternative counts as using the construction.
  - The `better` field must demonstrate the **same target construction** used correctly — never a different construction or phrasing.
  - The `rewrite` must preserve every correctly used target construction as-is and fix only actual errors.
- Extend the existing `evaluateTranslationRound` unit tests to assert the new grading rules are present in the system prompt.

## Capabilities

### New Capabilities

### Modified Capabilities

- `russian-practice`: The "Translation Verdict Evaluation" requirement gains grading semantics — the evaluation judges usage of the target constructions themselves, alternatives in slash-separated targets each count, and corrections/rewrites must keep the target constructions rather than substituting more idiomatic ones.

## Impact

- `src/services/aiService.js` — system prompt of `evaluateTranslationRound` (prompt text only; request shape, temperature, and token budget unchanged)
- `src/__tests__/aiService.test.js` — extended prompt-content assertions
- No data-model, UI, or API changes; `parseTranslationVerdict` and the verdict rendering stay as-is
