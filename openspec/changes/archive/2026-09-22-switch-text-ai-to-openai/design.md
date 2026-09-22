# Design

## Context

`src/services/aiService.js` currently routes every feature through a "Groq key wins" branch: if `settings.groqApiKey` is set, all chat completions go to `https://api.groq.com/openai/v1/chat/completions` with free-plan models (`openai/gpt-oss-20b` default, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`), and OpenAI (`gpt-4o-mini`) is used only when no Groq key exists. To cope with the free Groq models, the code carries a candidate-model fallback loop, retry-on-`model_not_found`/`json_validate_failed` logic, `max_tokens: 8000` reasoning budgets, and extraction of JSON from the `reasoning` trace when `content` is empty. `transcribeAudio` shares the same Groq-first preference for Whisper STT, and that routing is the only Groq usage we keep. Settings stores `groqApiKey`, `groqModel`, `openaiApiKey`, `ttsEngine`, `ttsVoice` (`DEFAULT_SETTINGS` in `src/store.js`, plus Supabase `settings` row mappers). See proposal.md – Why for motivation.

## Goals / Non-Goals

**Goals:**
- All chat-completion features (`generateSeamlessSessionFeedback`, `streamSeamlessChatCompletion`, `generateTranslationRoundPassage`, `evaluateTranslationRound`) call only `https://api.openai.com/v1/chat/completions` with a configurable OpenAI model (`openaiModel` setting, default `gpt-4o-mini`).
- `transcribeAudio` keeps Groq Whisper (`whisper-large-v3`) as the preferred STT path, with OpenAI Whisper (`whisper-1`) as fallback when only an OpenAI key exists.
- Remove Groq-only mitigation code (candidate-model loop, retryable-error sniffing, `reasoning` trace fallback) that has no OpenAI equivalent.
- Settings UI reflects the new roles: OpenAI key = primary (text AI + optional neural TTS), Groq key = speech-to-text only.

**Non-Goals:**
- No change to TTS behavior (OpenAI `tts-1` / browser speechSynthesis logic stays as-is).
- No change to prompt contents, JSON output contracts, temperatures, or parsing (`parseImportJSON`) — only provider/model routing changes.
- No backend proxy or key-relay; direct browser-to-API calls remain.
- No migration that deletes stored `groqModel` values; they are simply no longer read.

## Decisions

### 1. Hard requirement on the OpenAI key for chat completions (no Groq fallback)
Each text function checks `settings.openaiApiKey?.trim()` first and throws the existing-style error ("No API Key configured. Please add an OpenAI API Key in Settings.") when absent. The Groq branch and `isGroq` routing are deleted from the four text functions.

*Alternatives considered:* keep Groq as an optional fallback for text (priority inverted) — rejected per product decision: free-model quality is the problem being removed, and a silent fallback would reintroduce it unpredictably.

### 2. New `openaiModel` setting replaces `groqModel`
- `DEFAULT_SETTINGS.openaiModel: 'gpt-4o-mini'`; mapper `mapSettingsFromDb` reads `r.openai_model` with fallback to the default.
- `groqModel` is removed from `DEFAULT_SETTINGS` and the mapper; old persisted values are ignored (localStorage entries simply carry an unused key; Supabase rows keep an unmapped column).
- Settings screen: replace the "Groq Chat Model" `PillGroup` with an "OpenAI Chat Model" `PillGroup` offering `gpt-4o-mini` (Fast & Cheap, default) and `gpt-4o` (Higher Quality).

*Alternatives considered:* hardcode `gpt-4o-mini` without a picker — rejected; the existing UI pattern (`PillGroup`) makes a picker cheap and preserves user control over cost/quality.

### 3. Shared request helper for OpenAI chat calls
Introduce a small internal `requestOpenAIChat(settings, { messages, temperature, maxTokens })` helper in `aiService.js` that resolves the key/model and performs the fetch + error normalization (`errJson.error?.message`). The four text functions use it; the Groq retry loop and `reasoning`-trace extraction are deleted. `max_tokens: 8000` is retained (it is harmless for non-reasoning OpenAI models and preserves current test expectations around the request body), while comments referencing Groq reasoning models are updated.

*Alternatives considered:* leave each function with its own inline fetch — rejected; the helper removes four copies of key resolution and error handling that this change would otherwise touch anyway.

### 4. STT routing unchanged in shape, narrowed in scope
`transcribeAudio` keeps its existing Groq-first / OpenAI-fallback logic — it already matches the target behavior. Its error copy stays generic ("configure a Groq or OpenAI API Key … to enable Speech-to-Text"). `validateGroqKey` stays for the Settings "Test Key" button; its label changes to "Speech-to-Text (Groq)".

### 5. Seamless AI gating keys off the OpenAI key
Screens/components that currently treat "any key present" as Seamless-AI-available must gate text features on `openaiApiKey`. STT recording buttons may remain enabled when only a Groq key exists (transcription works), but any action requiring a chat completion must surface the OpenAI-key callout.

## Risks / Trade-offs

- [Users with only a Groq key lose automated text features] → Accepted product trade-off (strict mode); mitigated by clear Settings labeling and the in-app callout directing them to add an OpenAI key. Prompt Copy/Paste mode remains fully functional.
- [Cost: OpenAI chat calls are paid, Groq was free] → Default model is the cheapest general-purpose option (`gpt-4o-mini`); model picker lets users opt into quality explicitly.
- [Supabase `settings` table may lack an `openai_model` column] → Mapper uses `??` fallback to the default, so the app works without a schema change; adding the column is a follow-up ops task, not a blocker.
- [Existing tests assert Groq-first routing and Groq model names] → Tests are updated in the same change; expect churn concentrated in `src/__tests__/aiService.test.js` and Settings/Practice screen tests.

## Migration Plan

1. Update `store.js` defaults/mappers (`openaiModel` in, `groqModel` out).
2. Rework `aiService.js` text functions onto the OpenAI helper; leave `transcribeAudio` and `fetchOpenAITTS` intact.
3. Update Settings UI labels and model picker; update Seamless AI gating in session/practice screens.
4. Update tests; run `npm test` and the build.
5. Rollback: revert the change set; no data migration is performed, so no restore step is needed.

## Open Questions

- Whether to add the `openai_model` column to the Supabase `settings` table now or rely on the `??` fallback (safe to decide during implementation; behavior is identical either way for localStorage-only users).

