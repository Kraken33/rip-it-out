# Proposal

## Why

When learners rate a sentence as `Again` or `Hard` during frequency sentence practice, the interactive mini-drill currently asks an AI model to generate a "similar sentence in a fresh context". In practice, this causes severe semantic drift: for short sentences like "Eat up.", the AI invents unrelated contexts (e.g., "Finish your fish"), substitutes different core verbs, and then penalizes the learner's translation for using the very phrasal verb or pattern ("eat up") they were trying to master.

This change transforms interactive mini-drills into a two-phase progressive drill anchored strictly to the current sentence:
1. **Phase 1 (Immediate Direct Recall)**: Directly tests immediate recall of the exact current sentence without generation latency or semantic drift, evaluating strictly against the card's target translation.
2. **Phase 2 (Anchored Sentence Variation)**: When the learner requests another drill, generates a context variation that strictly retains and tests the exact target construction/phrase, preventing the AI evaluator from swapping key vocabulary.

## What Changes

- **Direct Sentence Recall First (Phase 1)**: Initiating a drill on `Again` or `Hard` immediately presents the current card's sentence for recall and translation without waiting for an AI generation spinner.
- **Direction-Aware Drill Prompting**: Respects the active practice direction (`ru-en` vs `en-ru`), prompting in the front language and evaluating user input in the target language.
- **Current-Sentence Grounded Evaluation**: Direct evaluation validates user attempts against the active sentence, accepting valid natural variations while strictly validating the target phrase/construction.
- **Strictly Anchored Variation Generator (Phase 2)**: The "Try Another Drill" action generates a variation that is hard-constrained to preserve the exact target construction or phrasal verb, forbidding the AI from replacing it with synonyms in the reference translation.
- **Actionable Post-Evaluation Actions**: After evaluation, learners can advance to the next card or invoke an anchored variation drill.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `frequency-sentence-practice`: Update the interactive mini-drill requirement from open-ended fresh context generation to a two-phase drill anchored to the active sentence (immediate recall first, followed by tightly anchored variations on request).

## Impact

- **UI Screens**: `src/screens/FrequencyPracticeSession.jsx` (updates drill state machine, removes initial loading block for phase 1, respects direction).
- **Prompts**: `src/prompts.js` (`generateFrequencyDrillPrompt` and `evaluateFrequencyDrillPrompt` tightened to lock target phrases and evaluate strictly against the active sentence).
- **AI Service**: `src/services/aiService.js` (exposes direct sentence evaluation and anchored variation generation).
- **Tests**: Vitest suites for prompts, aiService, and FrequencyPracticeSession.
