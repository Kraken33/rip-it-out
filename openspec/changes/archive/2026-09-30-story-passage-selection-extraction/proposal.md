# Proposal

## Why

Learners reading Russian story passages or English feedback/coach replies want to pick out specific phrases or words they encounter and immediately extract them into reusable SRS flashcards for learning. While the AI extraction prompt and service layer (`extractConstruction`) are already in place, the interactive UI component and selection controls are missing from the frontend screens (`TranslationStorySession` story passage & improved version, and `SeamlessChatSession` coach replies).

## What Changes

- Create a reusable `ConstructionExtractor` component to detect text selections within target blocks (Russian story passages, English improved versions, AI coach messages).
- Display an accessible "✨ Extract phrase / construction" action trigger when valid text within the block is selected.
- Call `extractConstruction` to extract a reusable pattern, providing a preview card with construction, category, explanation, frequency, and sample sentence.
- Provide "Add to Study List" (persisting to vault + creating SM-2 SRS card via `addImprovements`) and "Discard" actions with duplicate detection against existing vault cards.
- Integrate `ConstructionExtractor` into `TranslationStorySession` on both the Russian story passage and the feedback improved version, as well as `SeamlessChatSession` assistant messages.

## Capabilities

### Modified Capabilities
- `construction-harvesting`: Extend selection extraction UI support to story passages in addition to improved versions and dialogue replies.

## Impact

- `src/components/ConstructionExtractor.jsx`: New component managing selection detection, extraction trigger, API call, preview modal/card, and vault write.
- `src/screens/TranslationStorySession.jsx`: Embed extraction controls on the Russian story passage and the improved translation feedback.
- `src/screens/SeamlessChatSession.jsx`: Embed extraction controls on coach replies.
- `src/store.js`: Ensure duplicate checking and vault improvements persistence for extracted items.
- Unit/Integration tests: Add component tests for `ConstructionExtractor` and update story session integration tests.
