# Design

## Context

Current state that shapes the approach:

- `src/screens/SeamlessChatSession.jsx` footer holds an `AudioRecorder` and a `<form onSubmit>` containing a single-line `<input type="text">` (`inputText` state) plus a Send button. Transcription currently appends to existing text (`prev ? \`${prev} ${transcription}\` : transcription`). Enter submits via the form's `onSubmit`.
- `src/screens/Settings.jsx` renders the "OpenAI Chat Model" picker as a `PillGroup` with two options (`gpt-4o-mini`, `gpt-4o`) bound to `settings.openaiModel` via `handleSettingChange('openaiModel', val)`.
- `src/store.js` `DEFAULT_SETTINGS.openaiModel` is `'gpt-4o-mini'`; the value is stored as a plain string and `mapSettingsFromDb` reads `r.openai_model ?? 'gpt-4o-mini'`.
- `src/services/aiService.js` sends `settings.openaiModel || DEFAULT_OPENAI_CHAT_MODEL` straight to the OpenAI Chat Completions API — any model string works without code changes.
- The archived `2026-09-22-translation-practice-textarea-and-verdict` change established the house pattern for converting a chat input to a textarea: Enter = newline, button or Ctrl/Cmd+Enter submits, auto-grow capped at a max height.
- Per user decision: "(long context)" rows from the source table are excluded from the catalog entirely.

## Goals / Non-Goals

**Goals:**
- Multi-line, comfortable message entry in Seamless AI sessions, without losing the single-keystroke convenience of submission (Ctrl/Cmd+Enter) or the Send button.
- A scalable model picker listing the full 21-model catalog, with rate/token limits visible as informational secondary text.
- Zero changes to storage schema, settings keys, or the AI service layer.

**Non-Goals:**
- No client-side enforcement of TPM/RPM/TPD limits (limits are display-only metadata).
- No validation of the selected model against the OpenAI account; a model the account cannot access will surface the existing API error path.
- No changes to the Step 1 Title/Tags inputs or the Prompt Copy/Paste mode inputs.
- No "(long context)" variants in the selector.

## Decisions

1. **Native `<select>` dropdown for the model picker.** With 21 options a `PillGroup` is unusable; a native select is accessible, keyboard-friendly, and consistent with the existing `select-prev-title` dropdown styling in `Session.jsx`. Alternative considered: a custom searchable combobox — rejected as over-engineering for 21 items with no existing component to reuse.

2. **Model catalog as a shared exported constant.** Define `OPENAI_MODEL_OPTIONS` (array of `{ value, label, limits }`) in `src/services/aiService.js` next to `DEFAULT_OPENAI_CHAT_MODEL`, imported by `Settings.jsx`. This keeps the model list beside the API layer that consumes it and avoids a new file for one constant. Alternative considered: `src/constants.js` — rejected; the project has no such file and co-location with the service is simpler.

3. **Option labels carry the limits summary.** Native `<option>` elements support plain text only, so labels read e.g. `gpt-5.5 — 500K TPM · 500 RPM · 900K TPD`. The full user-provided table (normalized, long-context rows dropped):

   | Model | TPM | RPM | TPD |
   |---|---|---|---|
   | gpt-6-astra | 500K | 500 | 900K |
   | gpt-5.6-sol | 500K | 500 | 900K |
   | gpt-5.6-terra | 500K | 500 | 900K |
   | gpt-5.6-luna | 500K | 500 | 5M |
   | gpt-5.5 | 500K | 500 | 900K |
   | gpt-5.5-pro | 50K | 50 | 500K |
   | gpt-5.4 | 500K | 500 | 900K |
   | gpt-5.4-pro | 50K | 50 | 900K |
   | gpt-5.4-mini | 200K | 500 | 2M |
   | gpt-5.4-nano | 200K | 500 | 2M |
   | gpt-5.3-codex | 500K | 500 | 900K |
   | gpt-5.2 | 500K | 500 | 900K |
   | gpt-5.2-pro | 50K | 50 | 900K |
   | gpt-5.1 | 500K | 500 | 900K |
   | gpt-5 | 500K | 500 | 1.5M |
   | gpt-5-pro | 50K | 50 | 90K |
   | gpt-5-mini | 500K | 500 | 5M |
   | gpt-5-nano | 200K | 500 | 2M |
   | gpt-4.1 | 30K | 500 | 900K |
   | gpt-4.1-mini | 200K | 500 | 2M |
   | gpt-4o-mini | 200K | 500 | 2M |

4. **Legacy stored values stay functional.** If `settings.openaiModel` is not in the catalog (e.g. previously saved `gpt-4o`), the select renders one extra `<option>` for the stored value so the selection is visible and preserved until the user actively changes it. Alternative considered: silently reset to default — rejected, as it would change API behavior without user consent.

5. **Textarea replaces the chat input, following the established translation-practice pattern.** `<textarea>` bound to the same `inputText` state; `rows={1}` initial height with auto-grow from `scrollHeight` capped at a max height (e.g. `max-h-40`), `resize-none`; form `onSubmit` retained for the Send button; an `onKeyDown` handler sends on Ctrl/Cmd+Enter and lets plain Enter insert a newline (preventing implicit form submission); a hint line next to the input documents the shortcut. Transcription keeps appending to existing text (current behavior preserved).

## Risks / Trade-offs

- [Enter no longer sends, surprising users of the current input] → Mitigation: hint text beside the textarea, Send button remains the primary path, Ctrl/Cmd+Enter restores one-gesture submission.
- [Newer catalog models may not exist on the user's OpenAI account/tier] → Mitigation: none needed — the existing API error path already surfaces upstream errors; limits shown in labels help users pick models their tier supports.
- [Long option labels overflow the dropdown] → Mitigation: acceptable — browsers truncate/select-width handles it; label format keeps the model id first.
- [Trade-off] Limits are hard-coded snapshot data and will drift as OpenAI changes tiers — accepted; they are informational only.

## Migration Plan

No data migration. `openaiModel` remains a free-form string in settings and Supabase `openai_model` column; the default stays `gpt-4o-mini`, which is in the catalog. Rollback is a simple code revert — no persisted shape changes.
