# Design

## Context

See `proposal.md` for motivation. Currently:
- `generateStoryPassagePrompt` anchors the LLM on 4 hardcoded discourse marker examples (`"Короче"`, `"Представляешь"`, `"В общем"`, `"Оказывается"`).
- `TranslationPracticeSession` deterministically takes the next 2 adjacent cards from an array and feeds only those 2 into `generateTranslationRoundPassage` alongside previous conversation history, forcing awkward pairings and leaking prior round contexts.
- `getPracticeCards` only fetches 5 fallback cards when 0 cards are due today, causing rapid queue recycling after 2 rounds.

## Goals / Non-Goals

**Goals:**
- Eliminate hardcoded discourse marker examples from `generateStoryPassagePrompt` to allow free natural spoken Russian generation.
- Pass the pool of unpracticed candidate constructions to `generateTranslationRoundPassage` so the LLM can select 2 thematically compatible constructions.
- Have the LLM return a structured JSON response containing the picked constructions and the tagged Russian passage (`[[Russian phrase|target construction]]`).
- Maintain existing bracket parsing (`parsePassageBrackets`), badge tooltips, and evaluation verdicts without breaking changes to the UI layer.
- Ensure round generation in `TranslationPracticeSession` is stateless, eliminating conversation history leakage.
- Remove picked constructions from `availableCards` upon round completion/progression so each round practices fresh items.
- Increase fallback card limit when zero cards are due from 5 to 20 cards.

**Non-Goals:**
- Modifying the translation evaluation pipeline or verdict schema (`evaluateTranslationRound`).
- Modifying the SM-2 SRS calculation or rating interface (`Review.jsx`).
- Altering Prompt #3 (Scenario Q&A) or external Prompt #5 generation.

## Decisions

### Decision 1: Structured JSON output with bracketed passage for passage generation
The LLM prompt for translation round passage generation will request a JSON object:
```json
{
  "picked": ["construction 1", "construction 2"],
  "passage": "Russian story embedding [[Russian phrase 1|construction 1]] and [[Russian phrase 2|construction 2]]"
}
```
*Rationale*: Retaining the `[[Russian phrase|target]]` format inside `passage` preserves the existing `parsePassageBrackets` visual highlight, tooltips, and badges in the session view without requiring any refactoring of the passage display components.

*Alternatives considered*:
- Separating the tagged positions into JSON fields: Would require rewriting `parsePassageBrackets` and risking misalignment with text indices.
- Plain text generation with manual post-extraction: Less reliable and error-prone compared to structured JSON output.

### Decision 2: Stateless round passage generation
`generateTranslationRoundPassage` will no longer inject previous rounds' assistant passages and user translations as a multi-turn conversation. Instead, each round's passage request is a single-turn prompt containing only the current pool of unpracticed candidate constructions.

*Rationale*: Prevents the LLM from treating previous rounds as an ongoing storyline and eliminates the cross-contamination of previous constructions and themes.

*Alternatives considered*:
- Keeping conversation history but adding negative instructions: LLMs often still latch onto previous context tokens even with negative constraints. Stateless prompts guarantee zero leakage.

### Decision 3: Client-side candidate pool management and card reconciliation
`TranslationPracticeSession` will manage `availableCards`:
1. Initialized with all cards passed into the session.
2. When generating a round, send `availableCards` to `generateTranslationRoundPassage`.
3. When the LLM returns `picked: [c1, c2]`, match them against `availableCards` (case-insensitive normalization) to resolve the corresponding SRS card objects for the round.
4. When moving to the next round, filter out the picked cards: `setAvailableCards(prev => prev.filter(c => !pickedIds.has(c.id)))`.
5. If `availableCards.length < 2`, repopulate from all session cards starting with the least recently practiced.

*Rationale*: Keeps full control of SRS card references in the client for post-session rating while allowing the LLM creative freedom to pick the best 2 pairs.

### Decision 4: Increase fallback cards pool from 5 to 20
In `src/store.js` (`getPracticeCards`), increase `fallbackLimit` default from 5 to 20.

*Rationale*: When a learner has already reviewed today's cards, 5 cards only allowed 2 rounds before repetition. 20 cards supports up to 10 rounds of unrepeated practice.

## Risks / Trade-offs

- **[Risk] LLM selects a phrase with slight string mismatch from candidate list** → *Mitigation*: Perform case-insensitive, whitespace-trimmed, and substring matching against the available card pool. If an item cannot be matched, fall back to the first available card in the pool so the session never crashes.
- **[Risk] LLM wraps JSON response in markdown code blocks** → *Mitigation*: Use existing `extractJsonObject` / `parseImportJSON` utilities which cleanly strip markdown code fences before `JSON.parse`.
