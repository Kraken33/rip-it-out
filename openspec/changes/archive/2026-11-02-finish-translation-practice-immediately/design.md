# Design

## Context

See `proposal.md` for motivation.

In the current implementation:
- `TranslationPracticeSession.jsx` embeds inline SRS rating controls (keys 1–4) directly below the evaluation verdict on each active card. When the user rates recall, `onRateCard` immediately updates the SRS schedule in `Practice.jsx`.
- When all cards in the queue are completed, `TranslationPracticeSession` calls `handleFinishSession({ ratedInline: true })`, which instructs `Practice.jsx` to skip batch rating and jump to `setStep('complete')`.
- However, the top-bar button (`Finish & Rate Recall →`) calls `handleFinishSession()` with no arguments.
- In `Practice.jsx`, `startRating(practicedCards, roundPayload, options)` checks `options?.ratedInline`. When missing, it populates `cardsToRate` with all practiced cards (ignoring the fact that they were already rated inline via `handleInlineRateCard`) and forces `setStep('rating')`, rendering the legacy batch "Rate Recall" screen.

## Goals / Non-Goals

**Goals:**
- Clicking the finish button in `TranslationPracticeSession` finishes the session immediately without entering the post-session batch "Rate Recall" screen.
- Any unrated card active at the moment of finishing is ignored for SRS updates; only cards rated inline during practice have their SRS schedule updated.
- Session history and activity log are saved for all evaluated rounds completed so far.
- UI button label is changed to "Finish Practice" and completion banner copy is updated to eliminate outdated "Ready to rate recall" prompts.

**Non-Goals:**
- Modifying how SM-2 SRS calculations or inline rating components operate.
- Changing session history or activity logging schema.

## Decisions

### 1. Pass `{ ratedInline: true }` on manual finish
- In `TranslationPracticeSession.jsx`, update the top-bar finish button click handler to call `handleFinishSession({ ratedInline: true })`.
- Update the completion banner button to also consistently pass `{ ratedInline: true }`.
- *Alternative considered*: Adding a separate `onCancel` or `onExitEarly` prop. Passing `{ ratedInline: true }` through the existing `onFinish` protocol avoids changing the component interface and preserves session saving logic.

### 2. In `Practice.jsx`, ensure `startRating` directly completes
- When `options?.ratedInline` is set (or when no cards require batch rating), `startRating` transitions directly to `setStep('complete')`.
- If rounds were evaluated, save the session and log activity with the duration elapsed up to the finish point.
- *Alternative considered*: Completely removing the `step === 'rating'` branch. We will ensure translation practice never enters it; keeping or safely bypassing it prevents breaking any potential secondary consumer.

### 3. Button and banner copy cleanup
- Top-bar button: `Finish Practice`.
- Completion banner: Update text from `"You've completed all constructions in this session. Ready to rate your recall?"` to `"You've completed all constructions in this session."` and button label to `"Finish Practice"`.

## Risks / Trade-offs

- **[Risk] Existing unit test assertions fail**: `src/__tests__/Practice.test.jsx` has a test that clicks the finish button without prior rounds and expects the `Rate Recall` heading.
  - *Mitigation*: Update the test assertions in `Practice.test.jsx` and `TranslationPracticeSession.test.jsx` to verify the immediate completion behavior and the updated button label.
