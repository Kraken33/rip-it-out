# Tasks

## 1. AI Evaluation Prompt (seamless mode)

- [x] 1.1 In `src/services/aiService.js` (`generateSeamlessSessionFeedback` system prompt), extend the `"construction"` field rule to require a SHORT, single-clause pattern of roughly 2–7 words with bracket slots, and add a good example (`start taking [class] to [purpose]`) plus an explicit counter-example of a too-long multi-clause pattern (`If I wake up at [time], I feel [adjective] and like I haven't had enough sleep` — marked as NOT acceptable). Verify by adding a test in `src/__tests__/aiService.test.js` asserting the request body sent to OpenAI contains the brevity instruction (e.g. matches /2.7 words|short|single.clause/i and the counter-example wording).

## 2. Prompt-Mode Prompts (copy/paste mode)

- [x] 2.1 In `src/prompts.js` `generateDescriptionPrompt` (Prompt #1, STEP 1), add the same brevity rule for the construction/pattern (short, single clause, ~2–7 words, with good example and long counter-example). Verify with a test in `src/__tests__/prompts.test.js` asserting the generated Prompt #1 contains the brevity instruction.
- [x] 2.2 In `src/prompts.js` `generateExportPrompt` (Prompt #2), add the same brevity rule to the `"construction"` field description/rules. Verify with a test in `src/__tests__/prompts.test.js` asserting the generated Prompt #2 contains the brevity instruction.

## 3. Verification

- [x] 3.1 Run the full test suite (`npm test`) and confirm all existing and new tests pass with no regressions.
- [x] 3.2 Manually sanity-check one seamless evaluation (or review the prompt diff) to confirm the emitted prompt text reads naturally and the good/bad examples are present in both modes.
