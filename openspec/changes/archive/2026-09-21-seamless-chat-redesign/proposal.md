# Proposal: Seamless AI Chat Redesign & Mode Separation

## Why

Currently, prompt-based copy/paste features and seamless AI features share a single unified screen (`Session.jsx`), which restricts seamless mode to a single-turn analysis (one description -> 5 improvements). Decoupling these modes into separate dedicated flows enables seamless mode to evolve into a real-time, streaming AI Speaking Coach chat experience with on-demand feedback, hover tooltips, sentence context, and persistent chat transcripts.

## What Changes

- **Mode Separation**: Decouple prompt-based copy/paste wizard (`PromptSession`) and seamless AI chat (`SeamlessChatSession`) into distinct components and views.
- **Real-Time Streaming Chat Coach**: Seamless mode becomes an interactive multi-turn AI speaking coach that streams responses instantly and asks natural follow-up questions.
- **On-Demand Message Evaluation**: Each user message in the chat thread includes an "Improve" button. Clicking it evaluates that specific turn and renders inline corrections.
- **Inline Corrections & Hover Tooltips**: Display old text with red strikethrough (`~~old~~`) and improved text as highlighted badges. Hovering over a badge opens a rich tooltip with pattern breakdown, sentence context, category/frequency details, and a direct `[+ Add to Study List]` button.
- **Context-Aware Study List**: Improvements added to the study list/SRS cards include the full sentence context where the error occurred.
- **Full Conversation Persistence**: Seamless chat sessions persist full message history (`messages` array) in localStorage and Supabase.
- **Dedicated Replay Modals**: Split conversation replay viewers into `PromptConversationViewerModal` (static raw text annotator) and `SeamlessChatViewerModal` (multi-turn chat thread transcript replay with interactive tooltips).

## Capabilities

### Modified Capabilities
- `ai-seamless-integration`: Refactor seamless mode into streaming interactive chat, on-demand per-message evaluation, hover tooltips with direct study list registration, sentence context attachment, and persistent chat transcript storage.
- `session-flow`: Separate prompt copy/paste wizard and seamless AI chat into distinct flows, routing, and dedicated conversation replay modals.

## Impact

- **Frontend Components**: `Session.jsx`, `ModeToggle.jsx`, `ConversationViewerModal.jsx`, `App.jsx`, new `SeamlessChatSession.jsx` and `SeamlessChatViewerModal.jsx`.
- **Services & AI API**: `aiService.js` (add streaming completion handler and single-turn message evaluator).
- **Data Layer & Storage**: `store.js` and `supabase/schema.sql` (update `sessions` schema to persist `messages` JSONB array, update `improvements` schema to store `context` string).
