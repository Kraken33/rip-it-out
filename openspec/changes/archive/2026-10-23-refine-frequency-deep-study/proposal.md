# Proposal

## Why

The on-demand "Explain & Practice" study system in frequency sentence practice currently generates examples that drift away from the target English construction (for instance, substituting the generic verb "cry" instead of reinforcing the specific root card verb "wept" from "Tom wept"). Additionally, its translation drill trivially repeats the exact same 2-word prompt card without contextual depth, and the fill-in-the-blank (cloze) exercise lacks study direction awareness, causing language and evaluation mismatches.

Enforcing target construction locking, direction-aware exercise generation, and rich contextual sentence creation will ensure learners practice applying target patterns in meaningful, realistic language scenarios.

## What Changes

- **Target Construction Lock in Examples (Zero Drift)**: Instruct the deep study generator and example variations generator to strictly anchor on the target English construction/vocabulary (e.g. `weep / wept`), forbidding drift to colloquial synonyms like `cry`.
- **Contextual Translation Drills**: Replace trivial sentence repetition with a newly generated, comprehensive context sentence (8–15 words) that naturally exercises the target construction.
- **Direction-Aware Cloze Exercises**: Pass the active practice direction (`ru-en` vs `en-ru`) into the deep study prompt and modal, ensuring the cloze blank is placed in the target production language and accompanied by a full context translation.
- **Enhanced Exercise Evaluation**: Update the practice evaluator to evaluate attempts against both the contextual drill sentence and the root card anchor.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `frequency-sentence-practice`: Update requirements for "Contextual Example Variations" and "Multi-Exercise Practice and Evaluation" to mandate target construction locking, direction-aware cloze formatting, and contextual sentence expansions for translation drills.

## Impact

- `src/prompts.js`: Updated `generateSentenceDeepStudyPrompt`, `generateSentenceExampleVariationsPrompt`, and evaluation prompts.
- `src/services/aiService.js`: Thread `direction` parameter through deep study generation calls.
- `src/components/ExplainPracticeModal.jsx`: Accept and utilize `direction` prop to coordinate cloze and translation drill flows.
- `src/screens/FrequencyPracticeSession.jsx`: Pass `direction` to `ExplainPracticeModal`.
- Unit tests in `src/__tests__/prompts.test.js`, `src/__tests__/aiService.test.js`, and `src/__tests__/ExplainPracticeModal.test.jsx`.
