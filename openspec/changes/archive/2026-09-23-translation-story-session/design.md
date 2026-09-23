# Design

## Context

`Session.jsx` runs Step 1 (setup) -> Step 2 (dialogue via `SeamlessChatSession` or prompt copy/paste) -> Step 3/4 (import JSON -> Review & Confirm -> `addImprovements`). `Practice.jsx` runs a separate unlimited 2-per-round translation loop (`TranslationPracticeSession`) over existing vault cards with verdict JSON. See proposal Why; specs define the new activity, selective import, and AI prompts.

## Goals / Non-Goals

**Goals:**
- Branch Step 2 by `activity` (`dialogue` vs `translation`) while reusing Step-1 setup and Step-4 selective import.
- Unlimited story rounds with per-round fluent rewrite, then client-side aggregation into vault-shaped candidates.
- Selective import for both seamless and prompt paths with discard semantics.

**Non-Goals:**
- No changes to `Practice.jsx` drilling of existing cards; no prompt copy/paste variant for the translation activity in this change; no cross-round AI rewrite pass.

## Decisions

- **New `TranslationStorySession.jsx` modeled on `TranslationPracticeSession.jsx` round state** (rounds array, current index, messages thread, Next Round / Finish controls) but with story passages and per-round feedback instead of SRS verdicts. Alternative (reuse `TranslationPracticeSession` directly): rejected because its queue/verdict/SRS-rating coupling targets existing cards, not new-construction harvesting.
- **Two new `aiService` calls via shared `requestOpenAIChat`**: `generateTranslationStoryPassage(session, settings, historyTopics)` and `evaluateTranslationStory(passage, translation, settings)`. Reuses model selection, token-limit error handling, and temperature pattern from `generateTranslationRoundPassage` / `evaluateTranslationRound`. New prompt builders in `prompts.js` plus a `parseStoryFeedback` parser mirroring `parseImportJSON`/`parseTranslationVerdict`.
- **Client-side aggregation, no extra AI call**: concat per-round constructions, dedupe on lowercased/trimmed `construction`, keep earliest, slice to `settings.maxImprovements`. Rationale: deterministic, no cost/latency; matches user's "shown all improvements in the end".
- **Session record carries `activity` field** (`dialogue` default for legacy) and translation rounds stored in `messages`-compatible entries plus `rawText` from learner translations only (mirrors `translation-session-history` artefact pattern). Library viewer routes `translation` to a story-round viewer; dialogue keeps `SeamlessChatViewerModal`.
- **Step-4 picker state**: `selectedIds: Set` initialized to all parsed items, select-all/deselect-all toggles, per-card checkbox, confirm button label with count and disabled at zero; `handleConfirmImport` maps selection to `addImprovements`. Same component path serves both `handleSeamlessFinish` and `handleImport` results.

## Risks / Trade-offs

- [Story topic drift] -> Mitigation: ground passage prompt in title/topic + pass used-topics history each round.
- [Feedback JSON unparsable] -> Mitigation: show raw text + retry, keep translation; round still saved as artefact.
- [Aggregation overflow] -> Mitigation: per-round cap (3) + earliest-first slice to `maxImprovements`.
- [Legacy sessions lack `activity`] -> Mitigation: treat missing as `dialogue` everywhere.

## Migration Plan

No data migration: additive `activity` field defaults to `dialogue`; new session records use `translation`. Rollback = hide activity selector, default to dialogue.

## Open Questions

None blocking specs or tasks; prompt copy/paste variant for translation activity deferred to a follow-up.
