# Proposal

## Why

During Translation Practice in Seamless AI mode, the system prompts the LLM to write a single Russian sentence for the active target construction. Because the prompt lacks negative constraints against bare translations and lacks an instruction requiring situational context, the LLM frequently outputs minimal, isolated 1-to-1 translations of the phrase (for example, generating just "Я в порядке" for "I'm good"). This creates repetitive, clone-like exercises that fail to test how the target construction functions naturally inside realistic conversational speech.

## What Changes

- Update `generateTranslationSentence` in `src/services/aiService.js` to explicitly forbid generating bare, isolated 2–4 word literal translations in a vacuum.
- Require the LLM to frame the Russian translation sentence as a natural conversational reaction or dialogue utterance (such as politely declining an offer, answering an implicit question, explaining a reason, or reacting to a friend or coworker).
- Require the generated Russian sentence to provide realistic conversational context (e.g. ~10–25 words or 2 connected conversational clauses), giving the learner a genuine conversational situation to translate into English.
- Update unit tests in `src/__tests__/aiService.test.js` to verify the new system prompt requirements for contextual conversational dialogue sentences and negative constraints against bare translations.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `russian-practice`: Modifies requirement `Multi-Round Russian Translation Practice` (specifically `Scenario: Dynamic construction pool selection by the LLM`) to require that the generated Russian sentence in Seamless AI mode be framed in a natural conversational dialogue/reaction context with situational premise, rather than a bare isolated literal translation of the target construction.

## Impact

- **Affected Code**: `src/services/aiService.js` (`generateTranslationSentence`).
- **Tests**: `src/__tests__/aiService.test.js`.
- **Dependencies & APIs**: No external dependencies or API signature changes. Existing evaluation in `evaluateTranslationRound` remains fully compatible.
