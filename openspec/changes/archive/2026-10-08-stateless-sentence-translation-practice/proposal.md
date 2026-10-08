# Proposal

## Why

Current translation practice generates 3–5 sentence story passages containing 2 target constructions wrapped in explicit tags `[[Russian phrase|Target English Construction]]`. This has two major drawbacks:
1. **Active recall is bypassed**: The English target construction is displayed directly to the learner next to the Russian phrase, removing the cognitive retrieval effort required for SRS memory consolidation.
2. **Context and token ballooning**: Accumulated message history in multi-round sessions inflates token consumption ($O(N^2)$ across rounds) with complex, over-restrained prompt instructions.

Transitioning to a stateless, single-sentence practice loop with zero spoilers and immediate branching ensures authentic retrieval immersion and strictly constant $O(1)$ token efficiency.

## What Changes

- **1 Construction per Round**: Sizing changes from 2 constructions per passage to exactly 1 target construction per single Russian sentence.
- **Pure Russian Generation (Zero Spoilers / Tags)**: The LLM generates a single natural Russian sentence with zero bracket tags (`[[...]]`), zero clues, and zero English translations embedded.
- **Stateless Execution**: Sentence generation and evaluation requests send only the current round's data without accumulating previous round messages in LLM context.
- **Immediate Evaluation & Branching Logic**: Upon translation submission, the translation is evaluated immediately against the active construction:
  - **Missed / Awkward**: Feedback explains the natural phrasing, and the same construction stays active with an immediately generated fresh Russian sentence.
  - **Natural / Passed**: Feedback confirms natural usage, the card is marked passed, and the next construction in the queue begins immediately.
- **Streamlined Prompt #5**: Aligns external copy-paste Prompt #5 with the same concise 1-sentence, 1-construction practice format.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `russian-practice`: Update translation practice requirements and scenarios from multi-sentence 2-construction tagged passages to stateless single-sentence practice with zero spoiler tags, 1 construction per round, and immediate active recall branching.

## Impact

- **Frontend Services**: `src/services/aiService.js` (lightweight stateless generation and evaluation functions).
- **Screens**: `src/screens/TranslationPracticeSession.jsx` (immediate branching logic, 1 card per round, clean sentence rendering without bracket tags).
- **Prompts**: `src/prompts.js` (`generateTranslationPracticePrompt` streamlined).
- **Tests**: `src/__tests__/aiService.test.js`, `src/__tests__/TranslationPracticeSession.test.jsx`, `src/__tests__/prompts.test.js`.
