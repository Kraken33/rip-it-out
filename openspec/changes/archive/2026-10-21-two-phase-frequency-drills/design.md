# Design

## Context

In `FrequencyPracticeSession.jsx`, selecting `Again` (rating 1) or `Hard` (rating 2) sets `inDrill = true` and triggers `triggerDrillGeneration(currentSentence, [])`. This invokes `generateFrequencyMiniDrill`, calling OpenAI to synthesize a new Russian/English sentence in a "fresh context". This causes:
1. An initial loading delay (waiting on LLM generation before the user can do anything).
2. Semantic drift (the AI creates sentences about fish, dogs, etc., replacing key verbs like "eat up" with "finish").
3. Evaluation mismatch (the AI evaluator compares the user's attempt against the drifted sentence and rejects the learner's use of the target idiom).

See `proposal.md` for motivation and `specs/frequency-sentence-practice/spec.md` for normative requirements.

## Goals / Non-Goals

**Goals:**
- **Zero-Latency Phase 1**: On `Again` or `Hard`, immediately present the active sentence for direct translation recall without an initial AI generation network call.
- **Direction-Aware Drills**: Support both `ru-en` (show Russian prompt, user enters English) and `en-ru` (show English prompt, user enters Russian).
- **Strictly Anchored Phase 2 Variations**: On "Try Variation Drill", constrain the AI prompt to lock the exact target construction/phrase and forbid synonym replacement in the reference translation.
- **Consistent Evaluation**: Direct evaluation evaluates the learner's attempt against the target sentence/phrase without confusing vocabulary drift.

**Non-Goals:**
- Modifying other practice screens (Story sessions, Russian Practice, Review).
- Altering the SM-2 Spaced Repetition card storage algorithms.

## Decisions

### 1. State Machine for Two-Phase Drills
In `FrequencyPracticeSession.jsx`:
- Introduce `drillPhase`: `'direct'` (Phase 1) vs `'variation'` (Phase 2).
- When `handleRate(1)` or `handleRate(2)` is clicked:
  - Set `inDrill = true`, `drillPhase = 'direct'`, `drillLoading = false`, `evaluation = null`, `userAttempt = ''`.
  - The drill UI immediately presents the active card's prompt (e.g. `currentSentence.ru` if direction is `ru-en`).
- When user clicks "Try Variation Drill" from evaluation:
  - Transition to `drillPhase = 'variation'`, set `drillLoading = true`, and call `generateFrequencyMiniDrill(currentSentence, settings, previousDrills)`.

*Alternative considered*: Calling AI generation in background while showing Phase 1. Rejected because it wastes LLM tokens if the user only needed Phase 1 direct recall before continuing.

### 2. Prompt Engineering for Anchored Variations
In `src/prompts.js`:
- Refactor `generateFrequencyDrillPrompt({ ru, en, previousDrills }, settings)`:
  - Explicitly identify the core construction/verb from the target sentence.
  - Add strict negative constraints: "You MUST preserve the core target construction/phrasal verb. Do NOT substitute synonyms (e.g. if target is 'eat up', do NOT substitute 'finish' or 'eat')."
- Update `evaluateFrequencyDrillPrompt({ targetRu, targetEn, userAttempt, direction })`:
  - Pass the explicit direction (`ru-en` or `en-ru`).
  - Instruct the evaluator: "The learner is specifically practicing the target construction/sentence. Do NOT penalize the learner for using the target phrasal verb or construction."

### 3. Direction-Aware UI Labels
In `FrequencyPracticeSession.jsx`:
- Update label from hardcoded "Translate to English" to dynamic `"Translate to " + (direction === 'ru-en' ? 'English' : 'Russian')`.
- Set placeholder, audio playback, and speech-to-text recognition language appropriately according to target language.

## Risks / Trade-offs

- **[Risk]** For single-word sentences, extracting a target pattern may be ambiguous.
  → *Mitigation*: The prompt uses the entire sentence as the target anchor when no distinct multi-word idiom is present.
- **[Risk]** Evaluator might be overly pedantic on Russian casing or punctuation.
  → *Mitigation*: The evaluation prompt explicitly instructs the LLM to ignore casing, trailing punctuation, and minor typos while prioritizing communicative accuracy and the target phrase.
