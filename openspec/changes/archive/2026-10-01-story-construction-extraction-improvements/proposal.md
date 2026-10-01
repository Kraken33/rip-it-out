# Proposal

## Why

During story translation practice, harvesting a construction from a text selection currently suffers from two usability issues:
1. The extracted natural example (`improved`) merely repeats the highlighted sub-phrase rather than providing the complete sentence where the construction was used in context.
2. After saving a harvested construction, the extraction UI remains locked in the saved state, preventing learners from selecting and extracting further constructions from the same story or improved text block.

Refining the extraction prompt to produce full natural usage sentences and resetting the extractor state after saving unlocks seamless, multi-item vocabulary harvesting from story sessions.

## What Changes

- **Automatic Full-Sentence Natural Example**: Update the extraction prompt and response schema so that `improved` contains the complete, natural spoken sentence demonstrating the construction in context (derived from the enclosing sentence or story context) rather than an isolated sub-phrase.
- **Continuous Multi-Harvesting**: Update `ConstructionExtractor` so saving a construction immediately confirms persistence and clears the active preview/selection lock, allowing consecutive phrases to be selected and extracted from the same block.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `construction-harvesting`: Clarify requirement for `improved` to be a complete natural spoken example sentence in context, and specify extractor reset behavior after saving to allow immediate subsequent selections in the same source block.

## Impact

- `src/prompts.js`: `generateConstructionExtractionPrompt` and `parseExtractedConstruction`.
- `src/services/aiService.js`: `extractConstruction`.
- `src/components/ConstructionExtractor.jsx`: State management on save, selection reset, and preview lifecycle.
- Unit tests in `src/__tests__/prompts.test.js`, `src/__tests__/aiService.test.js`, and `src/__tests__/ConstructionExtractor.test.jsx`.
