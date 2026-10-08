# Proposal

## Why

In the single-sentence Russian translation practice mode, `generateTranslationSentence` currently includes `(Example: "${card.improved}")` in the prompt sent to the LLM whenever an improved sentence exists on the card. Because `card.improved` is a concrete narrative sentence from a previous user transcript (e.g., *"I invited my friends over for dinner last night"*), the LLM latches onto this specific example and directly translates or minimally alters it into Russian across practice rounds and retries. This severely restricts variety and deprives learners of varied practice contexts.

Replacing the concrete example sentence with the card's conceptual `explanation` provides the LLM with the semantic nuance and pattern boundaries it needs without giving it a concrete sentence to parrot, preserving strictly stateless execution and diverse everyday Russian sentences.

## What Changes

- **Remove Sentence Example (`usageHint`)**: Eliminate `(Example: "${usage}")` from `generateTranslationSentence` in `src/services/aiService.js`, stopping the injection of concrete narrative sentences.
- **Pass Pattern Nuance (`card.explanation`)**: If `card.explanation` is present on the card, include it as semantic pattern guidance (e.g., `(Pattern nuance: ${explanation})`) so the LLM understands the intended usage boundaries for idioms and phrasal constructions without copying a specific scenario.
- **Preserve Strictly Stateless Generation**: Retain isolated, single-turn requests for sentence generation with zero previous-sentence history accumulation, maintaining $O(1)$ token efficiency.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `russian-practice`: Update requirements for translation sentence generation so the system sends the target construction pattern and conceptual nuance explanation instead of concrete narrative sentence examples, ensuring varied conversational contexts while remaining stateless.

## Impact

- `src/services/aiService.js`: Update `generateTranslationSentence` to use `card.explanation` instead of `card.improved` example hint.
- `src/__tests__/aiService.test.js`: Update test assertions verifying `generateTranslationSentence` uses `explanation` and omits narrative example sentences.
- `openspec/specs/russian-practice/spec.md`: Update specification requirements and scenarios for single-sentence translation generation.
