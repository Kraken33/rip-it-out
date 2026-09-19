# Design: Session Text Artifacts & Word Metrics

## Context

See `proposal.md` for motivation. Currently, `src/store.js` manages sessions in `rio_sessions` in IndexedDB/localStorage. A session object holds metadata, status, duration, and an array of improvements.

This design introduces an optional `rawText` field on session entities and utility functions to parse, match, and render raw text alongside improvements in an interactive viewer, plus helper utilities for word metrics aggregation.

## Goals / Non-Goals

**Goals:**
- Provide optional `rawText` input in Step 3 of the session creation/import flow.
- Store `rawText` in `rio_sessions` schema.
- Implement an text segmentation utility (`buildAnnotatedText`) that matches `improvement.original` in `rawText` case-insensitively and returns structured segments for rendering red strikethrough (original) + green (improved) text.
- Build `ConversationViewerModal` to display the annotated transcript and tooltips.
- Add utility helpers for word metrics (`countTextWords`, `getTopicWordMetrics`, `getTodayWordMetrics`, `getAllTimeWordMetrics`).
- Integrate metrics into Dashboard topic headers, Dashboard stats widget, and Stats page.

**Non-Goals:**
- Storing separate transcript JSON structures or requiring new LLM prompts.
- Parsing LLM coach responses; only matching improvements against user-pasted text.
- Server-side text processing or heavy NLP dependencies.

## Decisions

### 1. Store `rawText` directly on Session entity vs. separate store collection
- **Decision**: Add `rawText: string | null` to the `rio_sessions` object.
- **Rationale**: Keeps session data co-located. Zero migration overhead for missing/null `rawText`.

### 2. Client-side string matching vs. stored segment index
- **Decision**: Compute annotated text segments on-the-fly via `buildAnnotatedText(rawText, improvements)`.
- **Rationale**: Keeps state clean and small. If improvements are edited or raw text is edited, annotations adapt automatically without desynchronizing stored offsets.

### 3. Word metric calculation strategy
- **Decision**: Pure regex word tokenization `text.toLowerCase().match(/\b\w+\b/g)` for total & unique word counts and density `(unique / total)`.
- **Rationale**: Fast, synchronous, zero dependency, perfectly suitable for English text.

## Risks / Trade-offs

- **[Risk]** `improvement.original` might not match `rawText` exactly if user paraphrased during session creation.
  → **Mitigation**: Perform case-insensitive substring matching. If unmatched, the improvement remains in the improvements list, and a match summary counter ("X matched, Y unmatched") is shown in the viewer footer.
- **[Risk]** Large `rawText` strings slowing down rendering.
  → **Mitigation**: Text is standard transcript size (a few hundred to thousand words), easily processed by V8 in sub-milliseconds.

## Migration Plan

- Backward-compatible schema extension: `session.rawText` defaults to `null` for legacy sessions.
- All metric aggregators check `if (session.rawText)` before tokenizing, safely skipping legacy sessions without error.
