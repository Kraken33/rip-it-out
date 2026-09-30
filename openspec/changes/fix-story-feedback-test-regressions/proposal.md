# Proposal

## Why

Recent refactoring separated automatic per-round construction generation from story evaluation into on-demand selection extraction. However, `TranslationStorySession`'s `StoryFeedbackCard` component directly dereferences `feedback.constructions.length` without a null-check, causing a component crash when rendering structured feedback, and several unit/integration tests in `Session.test.jsx`, `TranslationStorySession.test.jsx`, and `aiService.test.js` still assert legacy per-round construction harvesting behavior and schemas.

Fixing these regressions will ensure robust component rendering and restore 100% test suite pass rate across all session and AI service tests.

## What Changes

- **Safe Story Feedback Rendering**: Guard `feedback.constructions` with safe array fallbacks (`(feedback.constructions || []).length` / optional chaining) in `TranslationStorySession.jsx`.
- **Aligned AI Service Prompt Assertions**: Update `aiService.test.js` to assert the current daily-speaking feedback schema without expecting obsolete `"constructions"` keys in `evaluateTranslationStory`.
- **Aligned Story Session Unit & Integration Tests**: Update `TranslationStorySession.test.jsx` and `Session.test.jsx` to test story translation evaluation flow and finish transitions without relying on automatic per-round construction harvesting.

## Capabilities

### Modified Capabilities
- `translation-story-session`: Align test suite and component feedback rendering with the requirement that story translation evaluation provides daily-speaking improved versions without generating candidate constructions per round.

## Impact

- **Affected Code**: `src/screens/TranslationStorySession.jsx`, `src/__tests__/TranslationStorySession.test.jsx`, `src/__tests__/Session.test.jsx`, `src/__tests__/aiService.test.js`.
- **Dependencies**: No external dependency changes.
