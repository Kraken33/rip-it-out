# Design

## Context

Currently, `SeamlessChatSession` evaluates each individual user message turn via `evaluateSingleMessage` when the user clicks "✨ Improve Message". Because single chat turns contain very little text, the AI output defaults to surface-level grammar fixes. See `proposal.md` for overall motivation.

## Goals / Non-Goals

**Goals:**
- Shift AI feedback processing to the end of the seamless chat session.
- Seamlessly transition from Chat (Step 2) -> AI Evaluation (Step 3) -> Review & Confirm (Step 4).
- Clean up obsolete single-message evaluation logic and components.

**Non-Goals:**
- Modifying prompt mode or SRS storage format.
- Adding server-side speech or background queue processing.

## Decisions

### Decision 1: Delegate Evaluation & State Hand-off to `Session.jsx`
- **Rationale**: `Session.jsx` already orchestrates the 4-step wizard for prompt mode. By passing an `onFinish(userMessages)` callback prop to `SeamlessChatSession`, `Session.jsx` can capture all user turns, transition to Step 3 (AI analysis), invoke `generateSeamlessSessionFeedback()`, and display Step 4 (Review & Confirm).
- **Alternatives Considered**: Keeping evaluation inside `SeamlessChatSession` — rejected because Step 4 Review & Confirm is already a polished, battle-tested component in `Session.jsx`.

### Decision 2: Deprecate `evaluateSingleMessage`
- **Rationale**: `evaluateSingleMessage` is no longer invoked anywhere in the app. Removing it reduces code complexity and maintenance overhead.
- **Alternatives Considered**: Retaining `evaluateSingleMessage` as a fallback — rejected to maintain clean, unambiguous codebase architecture.

## Risks / Trade-offs

- **[Risk] Long waiting time for large chat logs** → Mitigation: Show a clear loading spinner with informative state text during Step 3 AI analysis.
- **[Risk] Token budget limit on large inputs** → Mitigation: `generateSeamlessSessionFeedback` uses `max_tokens: 8000` and model fallback candidates.
