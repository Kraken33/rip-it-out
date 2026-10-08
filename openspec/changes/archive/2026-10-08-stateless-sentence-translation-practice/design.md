# Design

## Context

See `proposal.md` for background and motivation. The translation practice mode currently generates 3–5 sentence passages embedding 2 target constructions wrapped in `[[Russian phrase|Target]]` tags, passing conversation history into the generation call. This design establishes a stateless, single-sentence execution flow with zero clues and immediate branching.

## Goals / Non-Goals

**Goals:**
- Provide true active recall by generating clean, natural Russian sentences with zero bracket tags or English answer spoilers.
- Execute generation and evaluation as isolated, stateless single-turn API requests, guaranteeing constant $O(1)$ token efficiency (~100 tokens per round).
- Implement seamless branching: on missed/awkward usage, immediately generate a fresh sentence for the same card; on natural usage, advance to the next card in queue.
- Keep the fallback Prompt #5 aligned with the same lightweight 1-sentence format.

**Non-Goals:**
- Altering the SRS SM-2 algorithm or rating scoring mechanisms (Again/Hard/Good/Easy).
- Modifying the Free Story Translation session (`TranslationStorySession.jsx`), which serves story harvesting rather than due SRS card practice.

## Decisions

### Decision 1: Stateless Single-Sentence Generator (`generateTranslationSentence`)
- **Choice**: A dedicated generator in `src/services/aiService.js` that takes a single card record, constructs a minimal prompt (~25 tokens) asking for exactly one natural conversational Russian sentence embedding the target concept, and passes zero conversation history.
- **Alternatives Considered**: Modifying `generateTranslationRoundPassage` to accept options. Decided to keep a clean, focused signature that returns a single string and avoids legacy 2-card pool logic.

### Decision 2: Pure Natural Russian Generation Without Clue Tags
- **Choice**: The LLM outputs pure Russian text with no `[[...]]` tags and no English translations.
- **Rationale**: Any visual tags or bracket annotations spoil the target idiom or draw attention away from authentic reading comprehension and active retrieval.
- **Alternatives Considered**: Tagging only the Russian portion (e.g. `[[фраза]]`). Rejected because unannotated natural text provides the highest fidelity spoken language practice.

### Decision 3: Immediate Evaluation & Branching Logic in Session State
- **Choice**: In `TranslationPracticeSession.jsx`, when the learner submits their translation:
  1. Submit translation and request evaluation verdict.
  2. The evaluation returns whether the target construction was used naturally (`used` and `quality === 'natural'`).
  3. If **missed / awkward**: Render the verdict with natural spoken feedback, keep the card as active in state, and immediately trigger `generateTranslationSentence` for a fresh sentence.
  4. If **natural**: Render the success verdict, mark the card passed in the queue, and trigger `generateTranslationSentence` for the next card.
- **Alternatives Considered**: Requiring manual clicks on "Next Round" or "Retry". Immediate progression keeps the practice session fast-paced and immersive while preserving the verdict in the scrollable thread.

### Decision 4: Streamlined Copy-Paste Prompt #5
- **Choice**: Update `generateTranslationPracticePrompt` in `src/prompts.js` to instruct external LLMs to present 1 Russian sentence per round for 1 construction at a time without spoiler tags, giving feedback and immediate single-sentence progression.

## Risks / Trade-offs

- **[Risk] Multiple valid English translations**: A natural Russian sentence might be translated accurately into English using a different, valid synonym or phrasing rather than the exact target construction being tested.
  - **Mitigation**: The evaluation prompt explicitly checks for the target construction. If the learner's phrasing is valid but missed the target idiom, the feedback clearly acknowledges their translation while explaining how the target construction fits, then gives them a fresh sentence to practice that target.
- **[Risk] Repeated failures on a difficult card**: A learner struggling with an idiom could get trapped in retries.
  - **Mitigation**: The learner can click "Finish Practice" at any time to complete the session and rate recall, ensuring no lock-in.
