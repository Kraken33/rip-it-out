# Design

## Context

See `proposal.md` — Why, and `specs/russian-practice/spec.md` for the required behavior.

Current state that shapes the approach:

- `src/screens/TranslationPracticeSession.jsx` is a single chat-thread component: assistant messages are Russian passages rendered through `parseTaggedPassage` (`src/textAnnotator.js`), user messages are plain text, and the footer holds the `AudioRecorder`, the round navigation, and a single-line `<input type="text">` inside a `<form onSubmit>`.
- One service call, `streamTranslationPracticeCompletion(roundCards, messages, settings, onChunk)` (`src/services/aiService.js`), does two unrelated jobs: writing the Russian passage and grading the learner's English. Its system prompt carries both rule sets; `onChunk` is invoked exactly once with the complete reply, so "streaming" is cosmetic. It runs at `temperature: 0.7` with `max_tokens: 1000` while the default Groq model (`openai/gpt-oss-20b`) is a reasoning model whose reasoning tokens are charged against that same budget.
- The existing JSON path, `generateSeamlessSessionFeedback`, establishes the house pattern: high token budget (`max_tokens: 8000`), `temperature: 0.3`, prompt-enforced JSON, parse via `parseImportJSON`, and a dedicated error when a reasoning model empties its content ("ran out of tokens before producing output"). No `response_format` or `reasoning_effort` is used anywhere in the codebase, so JSON compliance relies on prompt discipline and tolerant parsing.
- `parseImportJSON` (`src/prompts.js`) requires a non-empty `improvements` array with `original`/`improved`/`explanation` strings on every item; an empty array is a failure. That semantic is deliberate in the Session.jsx import flow.
- The round-loading effect runs on `currentRoundIndex` with no re-entrancy guard, and `src/main.jsx` mounts `<StrictMode>`, so round 1 issues the passage request twice in development (`isMounted` suppresses the second state update, not the request).

## Goals / Non-Goals

**Goals:**
- Make the translation input proportionate to the task (a passage-length English answer) without giving up the round thread's vertical space.
- Give the learner a per-round, machine-checkable evaluation: what happened with each target, and what their own sentence looks like in natural English.
- Keep passage generation exactly as it is today from the learner's point of view (Russian prose with `[[ru|en]]` tags and purple badges).

**Non-Goals:**
- Prompt #5 / external-LLM parity in `src/prompts.js`, and any paste-back verdict box. The in-app session is the only surface changing.
- Persisting verdicts, spawning new SRS cards from "target not used", or any change to the SM-2 flow and the `Finish & Rate Recall` handoff.
- A session-level verdict after the final round.
- Real incremental token streaming (the previous behavior was not incremental either).
- Genuinely streaming Russian passages and TTS for Russian text.

## Decisions

### 1. Split the overloaded service call into two functions

`generateTranslationRoundPassage(roundCards, settings)` keeps producing tagged Russian prose, and `evaluateTranslationRound(roundCards, passageText, userTranslation, settings)` returns raw verdict text for parsing.

- Rationale: the two jobs need different system prompts, temperatures (0.7 for writing, 0.3 for grading), token budgets, and output contracts. A single function would either need a hidden mode argument or keep forcing one configuration on both.
- Alternative considered: keep one function and branch on the last message role, as today. Rejected because the evaluation contract (JSON) and the passage contract (prose) would then share a token budget and a temperature, which is precisely what is causing truncation risk today.

### 2. Verdict schema

```json
{ "verdict": {
    "summary": "one or two sentences",
    "rewrite_needed": true,
    "rewrite": "natural version of the learner's own sentence",
    "constructions": [
      { "target": "invite over", "used": true, "quality": "natural",
        "mine": "invited a friend to my house", "better": "invited a friend over",
        "note": "why it changed" },
      { "target": "catch up", "used": false, "quality": null,
        "mine": null, "better": "We should catch up soon.", "note": "target missing" }
    ] } }
```

- `constructions` MUST contain one entry per round target, always. "Everything was correct" is therefore representable without inventing an item — the failure mode that makes `parseImportJSON` unusable here.
- `used` (was the target attempted at all) and `quality` (`natural` / `awkward`) are separate because they are different signals: a missing target is the only one that could later justify a new card, while an awkward one is a phrasing lesson about a target the learner already reached for.
- `quality: null` when `used` is false keeps the "not used" case from being expressed as an awkward usage.
- `rewrite_needed` is an explicit boolean rather than "empty `rewrite` means none", so the render does not have to guess whether an empty string is a model omission or a deliberate omission.

### 3. A dedicated verdict parser, sharing only the JSON extraction

Add `parseTranslationVerdict(text)` in `src/prompts.js` that validates `verdict.constructions` (non-empty array; each entry needs a string `target` and a boolean `used`; `mine`/`better`/`note` are optional strings) and tolerates an empty problem list. Pull the existing fence/brace extraction out of `parseImportJSON` into a small shared `extractJsonObject(text)` helper used by both parsers.

- Rationale: the two parsers must not diverge on how they tolerate markdown fences and surrounding prose, but their validation contracts are genuinely different.
- Alternative considered: extend `parseImportJSON` to accept an empty `improvements` array. Rejected — `src/screens/Session.jsx` surfaces that exact error to tell users to re-run the Export Prompt, and an all-correct verdict is the *success* case here.
- Alternative considered: keep the array non-empty by asking for a cosmetic "improvement" even when the translation is correct. Rejected — it contradicts the "MUST NOT invent corrections" requirement and feeds the learner false signal.
- `parseImportJSON` keeps its current semantics and stays exported for the import flow; Prompt #3, Prompt #5 and `generateTranslationPracticePrompt` are touched only insofar as the new parser lands in the same module.

### 4. Evaluation prompt rules, temperature and token budget

The evaluation system prompt states: compare the translation against the Russian passage you wrote; classify every target construction as used naturally, used awkwardly, or not used; if the translation is already natural and all targets are correct, report success and do not propose changes; otherwise rewrite the learner's sentence preserving meaning and wording, and add short notes only for the awkward and missing targets. Output is a single JSON object matching the schema in Decision 2, with no surrounding prose.

- The explicit "do not invent corrections" rule mirrors how `generateSeamlessSessionFeedback` already constrains improvement output ("ignore missing articles"), and it protects the learner from being taught to rewrite a correct sentence.
- `temperature: 0.3` for grading (matching the analysis path) and `max_tokens: 8000`: a per-target verdict plus a rewrite is several times longer than today's one-paragraph feedback, and reasoning tokens count against the same budget on the default Groq model.
- No `response_format` / `reasoning_effort` is introduced, matching the rest of the codebase; compliance relies on prompt discipline plus tolerant parsing.

### 5. Thread message model, and what is sent back to the model

Thread items gain an explicit verdict field. Rendering branches on it: an assistant item carrying a verdict renders as the verdict card, an assistant item without one renders as a passage bubble through `parseTaggedPassage`, and user items render as plain text with newlines preserved.

Message history handling:

```
 passage call   <- round targets + passages + learner translations (no verdict JSON)
 evaluation     <- round targets + current passage text + this round's translation
```

- Rationale: replaying verdict JSON would put several JSON blobs into the passage generator's context — few-shot evidence for answering in JSON instead of tagged Russian prose.
- The evaluation call does not depend on replayed history at all, so a parse failure cannot remove the passage it needs to compare against.

### 6. Text area behavior

- Initial height from `rows`, auto-grown from `scrollHeight` up to a maximum so the passage stays visible, plus `resize-y` (house style, as in `Session.jsx` and `Practice.jsx`).
- Enter inserts a newline; submission happens through the Translate button and a `Ctrl/Cmd+Enter` shortcut. This is the repository's first keyboard-shortcut handler, so the shortcut is made discoverable through hint text rather than left implicit.
- `AudioRecorder.onTranscribed` inserts the transcription at the caret (`selectionStart`/`selectionEnd`), appending only when no caret information is available.
- Existing guards are preserved: whitespace-only or in-flight submissions are neither sent nor cleared.

### 7. Progress, failure and fallback states

- Structured output cannot stream progressively, so the thread shows an explicit evaluating state instead of a typing effect; the learner's submitted translation is appended to the thread immediately so they can see what was sent.
- Unparseable or truncated verdict: the raw reply is rendered as a plain assistant bubble with a notice that structured evaluation was unavailable, plus a retry that re-runs the evaluation against the retained translation. The reasoning-model empty-content case reuses the existing "ran out of tokens" error message rather than a generic parse error.
- Passage generation failures keep the existing error callout behavior.

### 8. Round effect re-entrancy

The round-loading effect is guarded so `StrictMode`'s double invocation does not issue two passage requests for the same round (an in-flight guard or request abort). This is a pre-existing wart in the effect being touched, not a new feature.

## Risks / Trade-offs

- [Model returns malformed or truncated JSON] -> tolerant extraction, a single retry, and a plain-text fallback that still shows the feedback; the learner's translation is retained so no work is lost.
- [Model invents corrections for a correct sentence] -> explicit prompt rule, a stated spec requirement, and a component test that renders a success verdict and asserts no rewrite block appears.
- [Verdict misclassifies a target as missing] -> the verdict is display-only and never persisted; only the learner's manual rating reaches the SRS engine, so a misclassification cannot corrupt scheduling data.
- [Longer verdicts hit the token ceiling on reasoning models] -> 8000-token budget, plus a specific empty-content error instead of a generic parse failure.
- [A taller input squeezes the passage thread] -> auto-grow capped at a maximum height, with the existing fixed-height session shell retained.
- [An undiscoverable keyboard shortcut] -> hint text beside the input, with the Translate button as the primary path.
- [Trade-off] Losing the cosmetic streamed feel in exchange for a parseable contract — accepted, because the previous streaming never delivered partial text.
- [Trade-off] Splitting `used` from `quality` widens the schema the model must fill; accepted because collapsing them would erase the only signal that could later justify a new card.

## Migration Plan

No data or storage migration: verdicts are ephemeral UI state, and no localStorage key, Supabase table, or saved-session shape changes. Deployment is a frontend build. Rollback is reverting the component and the two service functions; previously completed sessions remain readable because nothing new is persisted.

## Open Questions

- Turning targets classified as missing into new SRS cards, reusing the existing improvement shape — deferred to a later change.
- A session-level verdict summarizing all rounds — deferred; the per-round verdict is the agreed unit.
- True incremental streaming for passage generation and evaluation — deferred.

