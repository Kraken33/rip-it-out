# Tasks

## 1. Variety Matrix Catalog & Prompt Assembly

- [x] 1.1 Define `VARIETY_MATRIX` and `VARIETY_PRESETS` in `src/prompts.js` and implement `sampleVarietyMatrix()` helper for auto-sampling.
- [x] 1.2 Update `generateStoryPassagePrompt` in `src/prompts.js` to accept matrix parameters, inject dynamic scene constraints, require conversational discourse markers, and remove static anchor tropes.
- [x] 1.3 Add unit tests in `src/__tests__/prompts.test.js` covering `sampleVarietyMatrix`, presets, and `generateStoryPassagePrompt` matrix integration.

## 2. AI Service Layer Updates

- [x] 2.1 Update `generateTranslationStoryPassage` in `src/services/aiService.js` to accept and pass matrix parameters to `generateStoryPassagePrompt`.
- [x] 2.2 Update unit tests in `src/__tests__/aiService.test.js` to verify matrix parameter handling.

## 3. Session Setup UI with Variety Matrix & Presets

- [x] 3.1 Add collapsible "Story Flavor & Variety Matrix" drawer in `src/screens/Session.jsx` with 1-click combo preset buttons and granular dimension dropdowns defaulting to Auto.
- [x] 3.2 Ensure matrix selections reset to Auto on new session setup and pass the selected matrix configuration into the created session.
- [x] 3.3 Add unit and component tests in `src/__tests__/Session.test.jsx` verifying preset selection, custom dimension selection, and session creation payload.

## 4. In-Session Controls, Vibe Display & Reroll

- [x] 4.1 Display the resolved Variety Matrix vibe badge above the active story passage in `src/screens/TranslationStorySession.jsx`.
- [x] 4.2 Add "🎲 Reroll Story" action on the active unsubmitted round in `src/screens/TranslationStorySession.jsx` to sample a new passage without losing session progress.
- [x] 4.3 Add in-session "⚙️ Tune Story Flavor" drawer in `src/screens/TranslationStorySession.jsx` to adjust matrix dimensions/presets for subsequent rounds.
- [x] 4.4 Add component tests in `src/__tests__/TranslationStorySession.test.jsx` for vibe tag rendering, reroll flow, and mid-session matrix updates.

## 5. Integration Verification

- [x] 5.1 Run full test suite (`npm test`) to ensure all tests pass with zero regressions.
