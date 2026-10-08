# Design

## Context

See `proposal.md` for background and motivation. `generateTranslationSentence` in `src/services/aiService.js` constructs the system prompt for single-sentence Russian translation practice. It previously incorporated `(Example: "${card.improved}")`, which caused the LLM to anchor to and translate the specific narrative example from the user's history rather than generating a fresh everyday context.

## Goals / Non-Goals

**Goals:**
- Replace concrete sentence example anchoring with conceptual pattern guidance (`card.explanation`).
- Produce varied, natural Russian sentences across both initial rounds and retries.
- Maintain strictly stateless, constant $O(1)$ token efficiency (~30 tokens prompt overhead).

**Non-Goals:**
- Accumulating message history or passing previous sentence avoidance lists across retries.
- Modifying translation evaluation rules in `evaluateTranslationRound`.
- Changing data models or SRS card structures.

## Decisions

### Decision 1: Supply `card.explanation` as Pattern Nuance Hint
- **Choice**: Extract `card.explanation` and append as `(Pattern nuance: ${explanation})` if present.
- **Rationale**: The explanation provides the semantic function and contextual boundaries of the construction (e.g., *"used when inviting someone to visit your home"*) without supplying concrete narrative details (names, specific foods, dates) that bias the model into literal translation.
- **Alternatives Considered**:
  - *No hints at all (`construction` only)*: For ambiguous phrasal verbs or broad idioms (e.g., `make up`, `turn out`), the LLM might target a different sense than what the card was created for.
  - *Instructing the LLM to "vary" the example*: Retaining the example sentence still creates strong attention attraction to specific nouns and verbs.

### Decision 2: Strictly Stateless Request Execution
- **Choice**: Keep `generateTranslationSentence` completely stateless without tracking or passing prior generated sentences across rounds or retries.
- **Rationale**: Eliminating the example anchor combined with sampling at `temperature: 0.7` provides diverse scenarios without prompt bloat or state synchronization complexity.
- **Alternatives Considered**:
  - *Passing an `avoidSentences` array*: Adds state plumbing across rounds and increases token usage with diminishing returns once the example anchor is eliminated.

## Risks / Trade-offs

- **[Risk] Cards without `explanation`**: Older cards or imports might have an empty `explanation` field.
  - **Mitigation**: `explanation` is safely checked and optional; if absent, `nuanceHint` is an empty string, falling back cleanly to the target construction name.
