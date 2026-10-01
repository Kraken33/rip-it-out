# Tasks

## 1. Prompt & Extraction Updates

- [x] 1.1 Update `generateConstructionExtractionPrompt` in `src/prompts.js` to instruct the LLM to provide a complete natural spoken sentence in context for `improved`, and update `src/__tests__/prompts.test.js` to verify prompt constraints.
- [x] 1.2 Update `src/__tests__/aiService.test.js` to verify `extractConstruction` compatibility with full-sentence example extraction.

## 2. ConstructionExtractor Multi-Harvest & Lifecycle

- [x] 2.1 Update `src/components/ConstructionExtractor.jsx` so saving a construction clears active extraction state and unlocks new selections in the same container.
- [x] 2.2 Update `src/__tests__/ConstructionExtractor.test.jsx` to test consecutive extractions from the same source block after saving.

## 3. Verification & Test Suite

- [x] 3.1 Run the complete test suite (`npm test -- --run`) to verify all extraction, session, and prompt tests pass.
