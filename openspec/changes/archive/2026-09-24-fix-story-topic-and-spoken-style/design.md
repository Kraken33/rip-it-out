# Design

## Context

See proposal.md — Why. Root-cause facts behind the approach:

- `src/screens/Session.jsx` (`handleCreateSession`) saves a translation session as `title: demands || \`Story — ${dateTitle}\`` and attaches `storyDemands` (possibly `''`) to the in-memory session object.
- `generateStoryPassagePrompt(session, settings, historyTopics)` is the only consumer of a story topic and reads `session.title || 'everyday life'`; the `storyDemands` block is *additive*, so with empty demands the date-shaped title is exactly what the model is told to ground the story in.
- Story-translation is seamless-only (Step 2 renders `TranslationStorySession` with no prompt/copy-paste branch), so `generateTranslationStoryPassage` in `src/services/aiService.js` is the single generation path.
- `historyTopics` currently carries whole prior passages from `TranslationStorySession`, and the Library row already prints `createdAt` next to the title (`Library.jsx`).
- Current behaviour is pinned by `src/__tests__/prompts.test.js` (prompt strings), `src/__tests__/aiService.test.js` (request body), and `src/__tests__/Session.test.jsx` (stored title + `storyDemands`).

## Goals / Non-Goals

**Goals:**

- A session's auto-generated title can never reach a story prompt as topic input.
- Learner story topic/demands stay the single topic channel; empty demands yield a free everyday topic.
- Generated passages are spoken-register Russian with no calendar-date references.
- No storage/data-shape changes; existing sessions and their Library labels are unaffected.

**Non-Goals:**

- Changing the fallback title format (`Story — <date>`) or topic grouping (today: one topic entity per free-topic story session per day).
- Deriving a session title from generated story content.
- Replacing `historyTopics` (full passages) with short topic labels.
- Removing the persisted `__story_demands:` marker message.
- Touching the per-round construction cap or the per-round feedback prompt.

## Decisions

- **Demands-only topic resolution through one small exported helper**: add `resolveStoryTopic(session)` to `src/prompts.js` returning the trimmed `storyDemands` or `''`, and build the topic instruction from it alone — named-topic grounding when it is non-empty, "pick a fresh concrete everyday topic" when it is empty. `session.title` is removed from the prompt entirely, which makes the guarantee mechanical rather than heuristic.
  Alternatives considered: (a) regex-sniffing auto titles for the `Story — ` prefix — rejected, a learner may legitimately type demands starting with "Story —"; (b) adding a persisted `autoTitle` flag or `title_source` column — rejected, a storage migration for a prompt-only concern; (c) keeping the title fallback and only skipping date-shaped titles — rejected as stringly-typed and easy to regress.
- **Keep the date-based fallback title as a display label**: making it explicit in code comments that it is display-only, and pinning it with a spec requirement. When demands are present, `title = demands` already gives Library a meaningful label, so the prompt topic and the label stay aligned in that path. Alternative considered: switching the fallback to one stable label (e.g. `Story practice`) — rejected for this change because it would merge every free-topic story session into a single topic entity and shift Top-Topics stats, which is behavior the user did not ask to change.
- **Spoken register expressed as explicit prompt rules, not a model/temperature change**: require conversational Russian a native speaker would say out loud — short spoken sentences, common everyday vocabulary and natural spoken constructions, explicitly no literary/bookish/formal narration. Temperature stays 0.7. Alternative considered: raising temperature for colloquial variety — rejected, the failure mode is register, not variety.
- **Absolute calendar references forbidden, relative time words allowed**: the prompt forbids mentioning the current date, current year, month names, or literal calendar dates, while explicitly permitting natural relative markers such as "yesterday" or "this morning". Alternative considered: banning all time expressions — rejected, it makes the speech stilted and would defeat "natural speaking".
- **Regression tests pin the new contract, not the old strings**: `prompts.test.js` covers both topic-resolution branches, the spoken-register rule, the no-date rule, and the absence of a date-shaped title; `aiService.test.js` composes the real prompt from a session shaped exactly as `Session.jsx` creates it (`title: 'Story — Sep 23, 2026'`, `storyDemands: ''`) and asserts the request body contains neither the date nor the title; `Session.test.jsx` keeps asserting the stored-title/`storyDemands` contract.

## Risks / Trade-offs

- [Model still occasionally mentions a date] → the prompt states the prohibition explicitly and a test pins the rule; residual model non-compliance is accepted and cheaper to fix than a post-filter.
- [Free-topic passages may repeat themes across different sessions] → the existing `historyTopics` anti-repeat block still applies within a session; cross-session topic memory is out of scope.
- [A future caller passes a meaningful title without `storyDemands` and loses grounding] → `resolveStoryTopic` documents demands as the single channel and the spec delta makes it normative; such a caller must send `storyDemands`.
- [Prompt-string assertions churn] → tests are updated in the same change and the durable assertion is the negative one (no title/date in the prompt), which will not churn with wording tweaks.

## Migration Plan

None required: prompt text plus code comments only — no database, schema, or localStorage shape changes, and existing session titles render exactly as before. Rollback is reverting the client release.
