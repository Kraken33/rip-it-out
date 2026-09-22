# Tasks

## 1. OpenAI Model Catalog & Selector (`src/services/aiService.js`, `src/screens/Settings.jsx`)

- [x] 1.1 Add an exported `OPENAI_MODEL_OPTIONS` constant in `src/services/aiService.js` (next to `DEFAULT_OPENAI_CHAT_MODEL`): an array of `{ value, label, limits }` for the 21 catalog models (`gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.5-pro`, `gpt-5.4`, `gpt-5.4-pro`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.3-codex`, `gpt-5.2`, `gpt-5.2-pro`, `gpt-5.1`, `gpt-5`, `gpt-5-pro`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o-mini`), with labels formatted `model — TPM · RPM · TPD` per design.md. Verify with a unit test asserting the catalog has exactly 21 entries, contains no "(long context)" entries, and includes `gpt-4o-mini`.
- [x] 1.2 In `src/screens/Settings.jsx`, replace the "OpenAI Chat Model" `PillGroup` with a native `<select id="openai-model-select">` bound to `settings.openaiModel || 'gpt-4o-mini'`, calling `handleSettingChange('openaiModel', e.target.value)`, styled consistently with the existing `select-prev-title` dropdown in `Session.jsx`. Verify with the updated Settings screen test rendering the select and asserting a change event persists the chosen model via `getSettings()`.
- [x] 1.3 Handle legacy values: when `settings.openaiModel` is not in `OPENAI_MODEL_OPTIONS` (e.g. `gpt-4o`), render one extra `<option>` for the stored value so it remains the visible selection and is sent to the API unchanged. Verify with a Settings test that seeds `openaiModel: 'gpt-4o'` and asserts the select displays `gpt-4o` as its value.
- [x] 1.4 Update the existing `Settings.test.jsx` "OpenAI Chat Model picker" test (which clicks `gpt-4o` pill) to drive the new `<select>` instead; verify the full Settings test file passes with `npx vitest run src/__tests__/Settings.test.jsx`.

## 2. Multi-line Seamless Chat Input (`src/screens/SeamlessChatSession.jsx`)

- [x] 2.1 Replace the footer `<input type="text">` with a `<textarea>` bound to the same `inputText` state: initial `rows={1}`, auto-grow from `scrollHeight` capped at a max height (`max-h-40`), `resize-none`, same placeholder and styling conventions. Verify with a component test asserting the control is a textarea and that a multi-line value preserves its line breaks in `inputText`.
- [x] 2.2 Make submission explicit: add `onKeyDown` so plain Enter inserts a newline (prevent default form submission) and Ctrl/Cmd+Enter sends; keep the form `onSubmit` for the Send button. Verify with component tests that Enter alone does not call the send handler and that `{ ctrlKey: true }` + Enter (and the Send button) does.
- [x] 2.3 Add a small hint line near the textarea documenting "Enter for new line · Ctrl/Cmd+Enter to send". Verify by asserting the hint text renders in the component test.
- [x] 2.4 Confirm transcription still appends to existing textarea content via `onTranscribed` (behavior unchanged). Verify with a component test that a transcription lands alongside previously typed text and both are present in the sent message.

## 3. Regression & Validation

- [x] 3.1 Run the full test suite with `npx vitest run` and verify all tests pass, including existing `Session.test.jsx`, `store.test.js` (openaiModel default round-trip), and `aiService.test.js` (configured model is sent to the API).
- [x] 3.2 Run `openspec validate chat-input-textarea-and-model-selector --strict` and verify it passes.
