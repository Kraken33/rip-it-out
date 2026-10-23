# Design

## Context

The frequency sentence practice feature provides an on-demand "Explain & Practice" modal (`ExplainPracticeModal.jsx`) triggered from revealed flashcards (`FrequencyPracticeSession.jsx`). The underlying AI logic in `src/prompts.js` and `src/services/aiService.js` bundles explanation, examples, and practice drills into a single prompt payload. Currently, this payload does not receive the active practice direction (`direction`), lacks instructions requiring contextual depth for translation drills, and lacks strict keyword/construction locks to prevent lexical drift in example generation.

## Goals / Non-Goals

**Goals:**
- Enforce strict construction/lexical lock ("Zero Drift") in `generateSentenceDeepStudyPrompt` and `generateSentenceExampleVariationsPrompt` so generated examples retain the specific target English construction or verbal root (e.g. inflections of "wept" instead of substituting "cry").
- Require the translation drill in the deep study payload to generate a brand new, natural, contextual sentence (6–12 words) exercising the target construction rather than repeating the root card.
- Make the practice generation and evaluation direction-aware (`ru-en` vs `en-ru`), ensuring cloze exercises place the blank in the user's target production language with full context.
- Maintain instant tab switching and single-call performance by retaining the unified study package architecture.

**Non-Goals:**
- Redesigning the visual layout of the 3-tab modal.
- Adding server-side state or changing the localStorage schema.
- Changing the Manythings streaming or SRS scheduling algorithms.

## Decisions

### 1. Unified Prompt Enhancement over Multi-Request Architecture
- **Decision:** Keep the single LLM request (`getSentenceDeepStudy`) returning explanation, examples, and practice, while updating the prompt instructions and schema constraints.
- **Rationale:** Making separate LLM calls for explanation, examples, and practice would triple token roundtrips, increase latency, and cause loading spinners when users switch tabs. A single well-prompted request generates all 3 tabs in 1–2 seconds.
- **Alternatives Considered:** Generating practice drills only on-demand when the user clicks the Practice tab. Rejected because it introduces an unnecessary wait state when switching tabs.

### 2. Explicit Keyword & Construction Lock (Zero Drift)
- **Decision:** In `generateSentenceDeepStudyPrompt` and `generateSentenceExampleVariationsPrompt`, explicitly extract the clean target word/construction and add a "STRICT ZERO DRIFT" instruction.
- **Rationale:** When learning "Tom wept", colloquial models naturally default to "cry". Mandating that every example variation must contain the target construction (or its inflected verbal forms like "weeping", "weep", "wept") prevents unwanted synonym substitution.
- **Alternatives Considered:** Relying on general prompt phrasing like "reinforcing the pattern". Rejected as evidence in screenshots showed the model repeatedly drifted to "cry".

### 3. Direction Propagation (`ru-en` vs `en-ru`)
- **Decision:** Pass `direction` from `FrequencyPracticeSession` into `ExplainPracticeModal` and into `getSentenceDeepStudy({ ru, en, direction }, settings)`.
- **Rationale:** When `direction === 'ru-en'`, the learner's production target is English. The cloze exercise must provide an English sentence with a blank (and Russian translation for context), and the translation drill must prompt in Russian for English translation. When `direction === 'en-ru'`, the roles invert. Cache keys in `studyCacheRef` will incorporate the direction: `${sentence.ru}::${sentence.en}::${direction}`.

### 4. Contextual Sentence Generation for Translation Drill
- **Decision:** Explicitly define the translation drill prompt as a newly authored, contextual sentence (6–12 words) containing realistic situational details (e.g., time, location, reason, or conversation partner) that uses the target construction, accompanied by its model translation and hint.
- **Rationale:** Eliminates the redundant echo where the drill merely asked the user to retype the 2-word card they just memorized.

## Risks / Trade-offs

- **[Risk]** Overly strict keyword lock might cause LLM to produce awkward sentences for irregular idioms.
  - **Mitigation:** Allow grammatical inflections of the target construction (e.g. tense, aspect, person) and include fallback validation in unit tests.
- **[Risk]** Cache invalidation when switching directions.
  - **Mitigation:** Include `direction` in the cache key so switching from `ru-en` to `en-ru` retrieves or generates the appropriately oriented drills.
