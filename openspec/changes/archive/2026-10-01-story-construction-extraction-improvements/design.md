# Design

## Context

Construction extraction enables learners to highlight phrases in AI-written text and convert them into reusable SRS improvements. Currently, `generateConstructionExtractionPrompt` instructs the LLM to output the selected phrase snippet as the `improved` field, causing the resulting card to lack sentence context. Additionally, `ConstructionExtractor` retains the saved preview card indefinitely in state, blocking subsequent text selections from triggering new extractions.

## Goals / Non-Goals

**Goals:**
- Ensure `improved` in extracted constructions is a complete, natural spoken English sentence in context rather than a phrase fragment.
- Reset `ConstructionExtractor` state after saving so learners can harvest multiple phrases in succession from the same block.

**Non-Goals:**
- Redesigning the library, SRS study algorithm, or session history storage schemas.
- Adding complex multi-step selection UI wizards (auto-extraction is preferred).

## Decisions

1. **Extraction Prompt Rules for `improved`**:
   - Update the rule for `improved` in `generateConstructionExtractionPrompt` to specify: *"the complete, natural spoken English sentence in context that demonstrates this construction (e.g. the full sentence from the source text containing the construction, or a full natural spoken example)"*.
   - *Rationale*: Guarantees that the saved study card demonstrates proper grammar and sentence flow.
   - *Alternative Considered*: Client-side string slicing of source blocks. Rejected because punctuation and clause structure in conversational LLM outputs vary and LLM context extraction yields cleaner, more idiomatic example sentences.

2. **`ConstructionExtractor` Lifecycle & Multi-Harvest State Reset**:
   - When `handleSave` succeeds, record the improvement via `addImprovements`, display a transient confirmation, and clear `extracted` and `selectedText` (or allow subsequent selections to overwrite/dismiss the previous preview card immediately).
   - Ensure the selection change listener is never blocked by a previously saved state.
   - *Rationale*: Keeps the UI responsive and clean without cluttering the screen or blocking the user from harvesting another phrase from the same story.

## Risks / Trade-offs

- **[Risk]** LLM might occasionally generate an over-long multi-clause sentence for `improved`.
  → *Mitigation*: The prompt already restricts the abstracted `construction` to 2-7 words while explicitly guiding `improved` to be a concise, natural spoken English sentence.
- **[Risk]** Rapid consecutive selections might cause race conditions if an extraction is in flight.
  → *Mitigation*: `isExtracting` state continues to guard against concurrent extraction requests.
