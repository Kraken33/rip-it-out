# Design

## Context

See [proposal.md](file:///Users/vanluv/develop/rip-it-out/openspec/changes/contextual-seamless-translation-sentences/proposal.md) for background and motivation.

In `src/services/aiService.js`, `generateTranslationSentence()` dynamically requests a single Russian sentence from the LLM for the active SRS card during Seamless AI Translation Practice. It currently directs the LLM to write "EXACTLY ONE natural, conversational sentence in RUSSIAN (на русском языке) where a native speaker would naturally use this English construction when translating into English". Without negative constraints or situational context instructions, models default to trivial 1-to-1 translations of bare phrases (e.g., "Я в порядке" for "I'm good").

## Goals / Non-Goals

**Goals:**
- Provide clear instructions to the LLM to frame the Russian sentence as a natural conversational dialogue reaction or utterance (e.g. declining an offer, explaining a situation, answering a question, or giving a reason).
- Forbid short, isolated 2–4 word direct translations in a vacuum.
- Ensure the Russian sentence is compound or multi-clause (~10–25 words) to provide adequate context for translation.
- Maintain compatibility with `evaluateTranslationRound()`, which scores only the target construction and tolerates errors or variations in other clauses.

**Non-Goals:**
- Modifying Prompt #5 (external copy-paste prompt) or Prompt #3 (Scenario Q&A), per user requirement to focus specifically on Seamless AI.
- Modifying prompts or logic in Frequency Practice (`FrequencyPracticeSession.jsx`) or Story Sessions (`buildRussianPassageSystemPrompt`).
- Changing the evaluation contract, return schema, or UI components.

## Decisions

### Decision 1: Prompt structure in `generateTranslationSentence`
- **Choice**: Enhance `systemMessage` with an explicit anti-pattern constraint and a conversational reaction guideline:
  - Task instruction: Frame the sentence as a natural conversational response, reaction, or situational utterance with everyday spoken context (e.g. declining an offer, answering an implicit question, explaining a reason, or reacting to a friend or coworker).
  - Rule: Explicitly forbid bare, isolated 2–4 word translations of the construction in a vacuum (e.g. do NOT output just "Я в порядке" for "I'm good").
  - Rule: Require a complete conversational thought with realistic context (e.g. ~10–25 words or 2 connected conversational clauses).
- **Alternative considered**: Requiring a 2-person dialogue script (e.g., "— Ты будешь кофе? — Спасибо, я в порядке."). Rejected because downstream translation UI and audio players expect a single cohesive utterance for the learner to translate into English.

### Decision 2: Preservation of zero-leak and nuance hints
- The conceptual nuance hint (`Pattern nuance: ${explanation}`) remains intact when present.
- Existing rules forbidding bracket tags, English clues, or conversational history are retained.

## Risks / Trade-offs

- **[Risk]** Longer Russian sentences may introduce unfamiliar vocabulary to beginning learners.
  → **Mitigation**: The prompt already specifies `Level: ${settings.level || 'intermediate'}. Formality: ${settings.formality || 'casual'}.` and the evaluation prompt specifically instructs the grader not to mark the target construction as awkward due to errors or awkwardness outside the target construction itself.
