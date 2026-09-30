# Design

## Context

The story evaluation prompt in `src/prompts.js` produces `{ summary, already_natural, improved_version }` per round, removing the previous automatic `"constructions"` block from the LLM response. In `TranslationStorySession.jsx`, `StoryFeedbackCard` directly accesses `feedback.constructions.length` without a default array fallback, causing a fatal render crash when valid story feedback is processed. In addition, tests in `src/__tests__/aiService.test.js`, `src/__tests__/TranslationStorySession.test.jsx`, and `src/__tests__/Session.test.jsx` still assert old schemas or rely on per-round construction elements to signal feedback completion.

## Goals / Non-Goals

**Goals:**
- Make `StoryFeedbackCard` null-safe against undefined or missing `feedback.constructions`.
- Update `aiService.test.js` to assert the current daily-speaking evaluation prompt without expecting `"constructions"`.
- Update `TranslationStorySession.test.jsx` and `Session.test.jsx` to wait for and assert story feedback completion via summary/improved version/natural indicators rather than removed construction elements.
- Achieve 100% test pass across all 21 test files in Vitest.

**Non-Goals:**
- Reverting the prompt back to generating per-round candidate constructions.
- Implementing new UI features or modifying the on-demand construction extraction component.

## Decisions

### 1. Defensive array access in `StoryFeedbackCard`
- **Choice**: Default `constructions` to `feedback.constructions || []` before computing length or mapping.
- **Rationale**: Keeps backward compatibility if mock objects supply `constructions` while preventing crashes when `parseStoryFeedback` returns feedback objects without `constructions`.

### 2. Update test assertions to target stable feedback UI elements
- **Choice**: In `Session.test.jsx` and `TranslationStorySession.test.jsx`, assert feedback completion using `findByTestId('story-feedback')`, summary text, or `Fluent daily-speaking version` headings instead of searching for `Constructions from this round`.
- **Rationale**: Accurately tests the rendered feedback while matching the simplified story-feedback design contract.

## Risks / Trade-offs

- **[Risk]** Test mocks in multiple test files might provide legacy mock data with `constructions`.
  → **Mitigation**: Defensive rendering ensures the component gracefully handles both shapes without failing.
