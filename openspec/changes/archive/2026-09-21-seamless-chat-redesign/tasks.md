# Tasks

## 1. Data Schema & Store Persistence

- [x] 1.1 Update `store.js` and `supabase/schema.sql` data mappers to persist `messages` JSONB array on session objects and `context` text string on improvement items.
- [x] 1.2 Add unit tests for `messages` and `context` serialization/deserialization in `src/__tests__/store.test.js` and verify all pass.

## 2. AI Service & Streaming Enhancements

- [x] 2.1 Update `aiService.js` to support real-time chat streaming responses (`streamSeamlessChatCompletion`) for interactive multi-turn conversations.
- [x] 2.2 Add single user-message evaluation function `evaluateSingleMessage(userText, settings)` in `aiService.js` returning structured JSON improvements with sentence context.

## 3. Seamless AI Chat Interface (`SeamlessChatSession.jsx`)

- [x] 3.1 Build `SeamlessChatSession.jsx` component featuring real-time streaming chat messages, STT audio recording, and AI coach responses.
- [x] 3.2 Implement `[ ✨ Improve ]` action button per user message turn, triggering evaluation and rendering strikethrough red original (`~~old~~`) and green highlighted badges.
- [x] 3.3 Build `ImprovementTooltip` popover showing pattern construction, original vs improved, category, spoken frequency, sentence context, and `[ ➕ Add to Study List ]` button.

## 4. Conversation Replay Modals & Decoupling

- [x] 4.1 Separate conversation replay modals into `PromptConversationViewerModal.jsx` and `SeamlessChatViewerModal.jsx`.
- [x] 4.2 Update `Session.jsx` to render `PromptSessionView` for prompt mode and delegate to `SeamlessChatSession.jsx` for seamless mode.

## 5. End-to-End Verification & Tests

- [x] 5.1 Add component tests for `SeamlessChatSession.jsx` and `SeamlessChatViewerModal.jsx` in `src/__tests__/SeamlessChatSession.test.jsx`.
- [x] 5.2 Execute test suite using `npm run test` and verify all tests pass cleanly.
