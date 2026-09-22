# Tasks

## 1. Settings & Storage Schema

- [x] 1.1 Update `DEFAULT_SETTINGS` in `src/store.js`: add `openaiModel: 'gpt-4o-mini'` and remove `groqModel`; update `mapSettingsFromDb` to read `r.openai_model ?? 'gpt-4o-mini'` and stop mapping `groq_model`; keep `groqApiKey` mapping intact for STT. Verify with a settings mapping unit test (or existing store tests) asserting `openaiModel` defaults to `gpt-4o-mini` and survives a settings round-trip.
- [x] 1.2 Update `src/screens/Settings.jsx`: relabel the OpenAI API key input as the primary key for Seamless AI text features (remove the "Optional - Unlocks realistic Neural TTS" framing), and relabel the Groq API key input as "Speech-to-Text only (optional)". Verify by rendering the Settings screen and asserting the new labels are present.
- [x] 1.3 Replace the "Groq Chat Model" `PillGroup` in `src/screens/Settings.jsx` with an "OpenAI Chat Model" `PillGroup` bound to `settings.openaiModel` (options: `gpt-4o-mini` Fast & Cheap default, `gpt-4o` Higher Quality). Verify with a Settings screen test asserting the picker renders and `handleSettingChange('openaiModel', ...)` fires on selection.

## 2. AI Service Provider Routing (`src/services/aiService.js`)

- [x] 2.1 Add an internal `requestOpenAIChat(settings, { messages, temperature, maxTokens })` helper that requires `settings.openaiApiKey?.trim()` (throws "No API Key configured. Please add an OpenAI API Key in Settings." otherwise), POSTs to `https://api.openai.com/v1/chat/completions` with model `settings.openaiModel || 'gpt-4o-mini'`, and normalizes error bodies via `errJson.error?.message`. Verify with a unit test asserting endpoint, model, and Authorization header.
- [x] 2.2 Rework `generateSeamlessSessionFeedback` to use the helper: delete the `isGroq` branch, the `groqCandidateModels` fallback loop, retryable-error sniffing, and `reasoning`-trace extraction; keep the existing system prompt, `temperature: 0.3`, `max_tokens: 8000`, and `parseImportJSON` handling. Verify with unit tests: request goes to `api.openai.com` with the configured model even when a Groq key is also set, and a settings object containing only `groqApiKey` rejects with the OpenAI-key error.
- [x] 2.3 Rework `streamSeamlessChatCompletion` to use the OpenAI endpoint and `settings.openaiModel || 'gpt-4o-mini'` (streaming behavior unchanged). Verify with a unit test asserting the streamed request targets `api.openai.com` and rejects without an OpenAI key.
- [x] 2.4 Rework `generateTranslationRoundPassage` and `evaluateTranslationRound` to use the helper; keep prompts, temperatures (0.7 / 0.3), `max_tokens: 8000`, and the empty-content "ran out of tokens" error path (update its copy to reference the OpenAI model setting instead of "Groq model in Settings"). Verify existing translation tests pass with `openaiApiKey` settings and that `{ groqApiKey }`-only settings reject with the OpenAI-key error.
- [x] 2.5 Leave `transcribeAudio` Groq-first for STT (Groq `whisper-large-v3` when `groqApiKey` is set; OpenAI `whisper-1` fallback when only an OpenAI key exists). Verify with unit tests asserting both endpoint routes and the no-keys error.
- [x] 2.6 Update `src/components/ModeToggle.jsx`: compute availability from `settings?.openaiApiKey?.trim()` only, and update the locked-mode callout copy to direct the user to configure an OpenAI API key in Settings. Verify with a component test: Groq-key-only settings render the locked/callout state; OpenAI-key settings render the mode switch.

## 3. Tests & Validation

- [x] 3.1 Update `src/__tests__/aiService.test.js`: remove Groq chat-routing/model-fallback/reasoning-trace tests, add OpenAI-only routing tests (endpoint, model selection, Groq-key-only rejection, OpenAI STT fallback). Verify `npm test -- aiService` passes.
- [x] 3.2 Update screen/component tests (`src/__tests__/Practice.test.jsx`, Settings tests, ModeToggle tests) for the new key gating and labels. Verify `npm test` passes with no Groq chat-model assertions remaining (`grep -rn "gpt-oss\|groqModel" src/` returns only `groqApiKey`-related STT references).
- [x] 3.3 Run the full suite and build: `npm test` and `npm run build` both succeed.
