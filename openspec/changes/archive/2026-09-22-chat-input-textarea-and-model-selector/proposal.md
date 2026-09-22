# Proposal

## Why

Two friction points in the Seamless AI flow:

1. The Seamless AI chat message input on the New Practice Session screen (`SeamlessChatSession.jsx`) is a single-line `<input type="text">`. Learners regularly type or paste long, multi-sentence English answers, and a one-line field is uncomfortable to read back and edit before sending.
2. The OpenAI chat model picker in Settings is a two-option `PillGroup` (`gpt-4o-mini`, `gpt-4o`) that cannot scale to the full set of models the user wants available, so model selection needs to become a dropdown selector with an expanded model catalog.

## What Changes

- Replace the single-line chat message `<input type="text">` in `SeamlessChatSession.jsx` with a multi-line `<textarea>` that supports typing, reading, and editing long answers. Enter inserts a newline; submission stays explicit via the Send button (and Ctrl/Cmd+Enter), matching the pattern established by the archived `translation-practice-textarea-and-verdict` change.
- Replace the "OpenAI Chat Model" `PillGroup` in `Settings.jsx` with a dropdown `<select>` bound to `settings.openaiModel`, listing the expanded model catalog (21 models, see design.md): `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.5-pro`, `gpt-5.4`, `gpt-5.4-pro`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.3-codex`, `gpt-5.2`, `gpt-5.2-pro`, `gpt-5.1`, `gpt-5`, `gpt-5-pro`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o-mini`.
- Default model remains `gpt-4o-mini`. Rate/token limits from the user's model table are shown as secondary info in option labels; they are informational only — no client-side rate limiting is added.
- Per user decision, the "(long context)" variants from the source table are excluded from the list entirely.
- Legacy stored values (e.g. `gpt-4o`, which is not in the new list) must keep working: the stored value is still sent to the API unchanged, and the selector renders it as an extra option so the setting is not silently lost.

## Capabilities

### New Capabilities

(None)

### Modified Capabilities

- `ai-seamless-integration`: Requirement 1 (model selection) changes from a two-option pill picker to a dropdown selector with the expanded model catalog; Requirement 3's seamless session chat input changes from single-line to multi-line text entry.

## Impact

- **Code**: `src/screens/SeamlessChatSession.jsx` (input footer), `src/screens/Settings.jsx` (model picker), possibly a shared model catalog constant (e.g. in `src/services/aiService.js` or a new `src/constants.js`).
- **Tests**: `src/__tests__/Settings.test.jsx` (model picker test), new/updated tests for `SeamlessChatSession.jsx` input behavior.
- **Data/APIs**: No storage schema change — `settings.openaiModel` already stores an arbitrary model string and is passed straight to the OpenAI Chat Completions API. No new dependencies.
