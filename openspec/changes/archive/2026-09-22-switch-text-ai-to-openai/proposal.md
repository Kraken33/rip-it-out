# Proposal

## Why

All text generation and evaluation features (seamless session feedback, coach chat replies, translation passage generation, translation verdicts) currently prefer the free Groq chat models (`openai/gpt-oss-20b/120b`, `qwen/qwen3.8-27b`) whenever a Groq key is present, and only fall back to OpenAI when no Groq key exists. These free models produce noticeably weaker coaching feedback and evaluation quality, and the Groq-first routing forces fragile workarounds (reasoning-model token-budget issues, multi-model fallback loops, `reasoning` trace extraction). The user wants OpenAI (ChatGPT) to be the single provider for all text AI, with the Groq key retained exclusively for speech-to-text.

## What Changes

- **BREAKING (behavioral)**: Text generation and text evaluation (`generateSeamlessSessionFeedback`, `streamSeamlessChatCompletion`, `generateTranslationRoundPassage`, `evaluateTranslationRound`) require an OpenAI API key and always call the OpenAI Chat Completions API. The Groq key is never used for chat completions anymore, and there is no Groq fallback for text features.
- **BREAKING (behavioral)**: The Groq API key is used **only** for speech-to-text (`transcribeAudio` via Groq Whisper `whisper-large-v3`). When no Groq key is set, STT falls back to OpenAI Whisper (`whisper-1`) using the OpenAI key.
- Add an `openaiModel` setting (default `gpt-4o-mini`) with a model picker in Settings, replacing the Groq chat model selector.
- Settings screen relabeling: the OpenAI API key becomes the primary, required key for Seamless AI text features; the Groq API key is repositioned as "Speech-to-Text only (optional)".
- Seamless AI mode gating: text-based AI features unlock based on the OpenAI key; when it is missing, users see a callout directing them to configure an OpenAI key in Settings (Prompt Copy/Paste remains available).
- Remove Groq chat model fallback/retry machinery (candidate-model loop, `json_validate_failed` retries, `reasoning` trace extraction) that exists only to support the free Groq models.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ai-seamless-integration`: Provider routing requirements change — OpenAI becomes the required provider for LLM text generation/evaluation and unlocks Seamless AI; the Groq key's role is narrowed to speech-to-text; an OpenAI chat model preference is added to configuration.

## Impact

- `src/services/aiService.js`: provider routing inverted/simplified in `generateSeamlessSessionFeedback`, `streamSeamlessChatCompletion`, `generateTranslationRoundPassage`, `evaluateTranslationRound`; `transcribeAudio` keeps Groq-first STT routing; Groq-specific model fallback and reasoning-trace extraction removed.
- `src/store.js`: `DEFAULT_SETTINGS` and settings mappers gain `openaiModel`; `groqModel` is removed/deprecated (existing stored values are ignored, not migrated).
- `src/screens/Settings.jsx`: Groq key input relabeled as STT-only; OpenAI key input relabeled as primary; Groq chat model pill group replaced with an OpenAI chat model pill group.
- Any screens/components that gate Seamless AI mode on "any API key present" must gate on the OpenAI key for text features (STT-only usage still allowed with just a Groq key).
- Tests: `src/__tests__/aiService.test.js` and related screen tests updated for the new routing and errors.
- Supabase `settings` row mapping: new `openai_model` column mapping if the table supports it (otherwise settings fall back to localStorage defaults as today).

## Assumptions

- "Grok" in the request refers to the **Groq** API key (`groqApiKey`) already used in the codebase; Groq remains the speech-to-text provider.
- Default OpenAI chat model is `gpt-4o-mini` (current hardcoded fallback); picker also offers at least one higher-quality option (e.g. `gpt-4o`).
- Existing users who only have a Groq key configured will lose automated text generation/evaluation until they add an OpenAI key (accepted as the intended strict behavior); Prompt Copy/Paste mode and STT keep working.
