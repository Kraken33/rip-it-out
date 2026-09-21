# Technical Design: Seamless AI Chat Redesign

## Context

See `proposal.md` for motivation.
Currently, `Session.jsx` mixes prompt copy/paste logic and one-shot seamless AI evaluation. We are refactoring this architecture to separate prompt wizard workflows from the interactive seamless AI coach chat experience.

## Goals / Non-Goals

**Goals:**
- Separate Prompt Copy/Paste session flow and Seamless AI Chat session flow cleanly into dedicated components.
- Implement real-time streaming completions for the AI Speaking Coach.
- Implement on-demand message evaluation (`[ ✨ Improve ]` button per user message turn).
- Render inline corrections with strikethrough red original (`~~old~~`) and highlighted green badges.
- Provide a hover tooltip on green badges containing pattern breakdown, category, frequency, sentence context, and `[ ➕ Add to Study List ]`.
- Persist multi-turn conversation transcripts in `sessions.messages` array (in localStorage and Supabase JSONB).
- Provide separate replay modals: `PromptConversationViewerModal` and `SeamlessChatViewerModal`.

**Non-Goals:**
- Removing or altering the prompt copy/paste mode functionality.
- Changing SRS SM-2 card scheduling algorithms.

## Key Technical Decisions

### 1. Component & Route Decoupling
- **Decision**: Keep `/session/new` as the entry point with mode selection, rendering `PromptSessionView` for prompt mode and `SeamlessChatSession` for seamless chat mode.
- **Rationale**: Keeps existing URL routes backward-compatible while decoupling interior state management cleanly.

### 2. Streaming AI Chat Completion & Evaluator Separation
- **Decision**: Use `fetch` readable streams for chat completions (`stream: true`) to stream AI coach turns instantly. On-demand message evaluation uses a separate concise JSON evaluator endpoint call (`evaluateSingleMessage(userText, settings)`).
- **Rationale**: Separating chat generation from evaluation prevents JSON parsing errors during live chat streaming and ensures instant chat responsiveness.

### 3. Persisted Message Schema (`sessions.messages`)
- **Decision**: Update `sessions` schema to include `messages` array:
  ```ts
  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isImproved?: boolean;
    improvements?: Array<{
      id: string;
      original: string;
      improved: string;
      construction: string;
      explanation: string;
      category: string;
      spokenFrequency: string;
      context: string;
    }>;
    createdAt: string;
  }
  ```
- **Rationale**: Ensures chat history, evaluated turns, and sentence context persist reliably across sessions and device syncs.

### 4. Direct Add-to-Study List from Tooltip
- **Decision**: `ImprovementTooltip` renders an interactive `[ ➕ Add to Study List ]` button that calls `addImprovements(sessionId, [imp])` directly on click, instantly creating an SRS card.
- **Rationale**: Eliminates friction by allowing users to add high-value corrections to their study vault without leaving the chat thread.

## Risks / Trade-offs

- **[Risk]**: Model streaming may vary between Groq and OpenAI endpoints.
  - *Mitigation*: Fall back to standard completions if streaming headers are unsupported or API key lacks streaming permissions.
- **[Risk]**: Database migration compatibility for existing sessions without `messages` or `context`.
  - *Mitigation*: Provide default fallback values (`messages: []`, `context: ''`) in mappers (`mapSessionFromDb`, `mapImprovementFromDb`).
