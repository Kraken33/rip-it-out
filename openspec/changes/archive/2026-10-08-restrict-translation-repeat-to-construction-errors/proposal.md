# Proposal

## Why

In the single-sentence Russian translation practice mode, both Prompt #5 and the in-app AI evaluator currently trigger a repetition of the target construction whenever the learner's English translation contains any mistake (such as typos, unrelated verb tenses, or general grammatical flaws elsewhere in the sentence). This frustrates learners because they are forced to retry a construction they already understood and used correctly. Restricting repetitions strictly to errors in the target construction itself ensures fair practice progression and focused feedback.

## What Changes

- **Prompt #5 Evaluation Wording**: Explicitly instruct external LLMs to repeat the target construction ONLY if the target construction itself was omitted or used incorrectly (e.g., wrong preposition/particle, governed verb form, or pattern misuse). Unrelated errors in other parts of the sentence must be briefly noted in feedback without triggering a repetition, allowing the session to advance to the next construction.
- **In-App Evaluation Prompt Tightening**: Update `evaluateTranslationRound` in `src/services/aiService.js` to ensure the AI grades `quality: "natural"` when the target construction is correctly used, explicitly prohibiting unrelated errors elsewhere in the sentence from downgrading `quality` to `"awkward"`.
- **Feedback & Rewrite Preservation**: Unrelated sentence-level errors will continue to be corrected in the natural English `rewrite` and feedback summary without impeding practice queue progression.

## Capabilities

### New Capabilities

### Modified Capabilities
- `russian-practice`: Refine evaluation requirements and scenarios for Prompt #5 and translation verdict grading so that only target construction errors trigger repetition or awkward ratings, whereas unrelated translation mistakes allow the construction to pass and advance.

## Impact

- `src/prompts.js`: `generateTranslationPracticePrompt` (Prompt #5) instruction text.
- `src/services/aiService.js`: `evaluateTranslationRound` system prompt instructions.
- `src/__tests__/prompts.test.js`: Assertions for Prompt #5 evaluation constraints.
- `src/__tests__/aiService.test.js`: Assertions for `evaluateTranslationRound` grading rules.
