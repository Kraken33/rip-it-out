# Proposal

## Why

Per-message evaluation ("Improve Message") in seamless chat mode produces shallow results (mostly minor grammar or spelling fixes) because individual short chat turns provide too little text for the AI to analyze. By moving evaluation to the end of the session, all user messages are evaluated together, yielding high-quality, reusable constructions, collocations, and natural spoken patterns identical to the prompt mode experience.

## What Changes

- **Move Seamless AI Evaluation to End of Session**: Remove the per-message "✨ Improve Message" buttons from individual user chat turns in `SeamlessChatSession`.
- **End-of-Session Processing**: When the user finishes a seamless chat session, join all user messages into a single text block and send them to `generateSeamlessSessionFeedback()`.
- **Step-by-Step Flow**: Integrate Seamless Chat with the 4-step session workflow (`Session.jsx`), transitioning from Chat (Step 2) -> AI Analysis (Step 3) -> Review & Confirm (Step 4).
- **Clean Up Obsolete Code**: Remove `evaluateSingleMessage` API helper and individual message evaluation state tracking.

## Capabilities

### Modified Capabilities
- `ai-seamless-integration`: Update requirements to specify end-of-session evaluation of all user chat turns combined, replacing per-message evaluation.

## Impact

- `src/screens/SeamlessChatSession.jsx`: Updated to serve as a chat-focused screen; removes per-message evaluation UI and forwards all user turns on completion.
- `src/screens/Session.jsx`: Orchestrates the new 4-step flow for seamless mode (Chat -> Analyze -> Review & Confirm).
- `src/services/aiService.js`: Deprecates `evaluateSingleMessage` and routes full conversation text to `generateSeamlessSessionFeedback`.
- `src/__tests__/SeamlessChatSession.test.jsx`: Updated tests reflecting the end-of-session evaluation flow.
