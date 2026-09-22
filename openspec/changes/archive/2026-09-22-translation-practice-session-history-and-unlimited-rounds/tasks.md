# Tasks

## 1. Unlimited 2-per-round flow in TranslationPracticeSession

- [x] 1.1 Replace fixed 4-per-round batching with unlimited 2-per-round queue (roundQueue state, Next Round appends 2 fresh cards with wrap-around, header shows Round N + practiced count, Next/Finish always visible) and verify `src/__tests__/TranslationPracticeSession.test.jsx` covers 5-card input producing two 2-card rounds plus Next/Finish controls with no `Round X of Y` text.
- [x] 1.2 Accumulate per-round payload (passage, translation, verdict/raw feedback, construction ids, timestamps) in a ref and pass `(roundPayload, practicedImprovements)` to `onFinish`, and verify unit test asserts payload order, content, and distinct-card list handed to rating.

## 2. Prompt #5 text update

- [x] 2.1 Rewrite `generateTranslationPracticePrompt` instructions to unlimited rounds × exactly 2 constructions with Next/Finish control (keeping `[[phrase|target]]` format) and verify `src/__tests__/prompts.test.js` asserts new wording and absence of "4 to 5"/"3 to 5" batching text.

## 3. Session artefact persistence in Practice flow

- [x] 3.1 On seamless `onFinish`, create `translation-practice` session (`title` with date + rounds/constructions, `tags`, `notes`, `rawText` from learner translations ONLY — passages/verdicts go to `messages`/`notes` and are excluded from word counts, `messages` per round, `durationSeconds`) + `logActivity({type:'session', sessionId})`, skipping save when zero translations submitted, then continue existing SRS rating handoff, and verify with store-mocked component test in `src/__tests__/Practice.test.jsx` (session created, activity logged, Library-visible via `getSessions`, rating still offered).
- [x] 3.2 Ensure Library/Stats surface the artefact (session list entry, word metrics from `rawText` = translations only with passages/verdicts excluded, time from activity log) without new store keys, and verify by asserting `getSessionWordMetrics`/`getActivityStats` include the saved translation session and that word counts equal the translations-only text.

## 4. Regression verification

- [x] 4.1 Run `npm test`, `npm run lint`, and `npm run build` and verify all suites pass with no new warnings from changed files.
