# Proposal: Session Text Artifacts & Word Metrics

## Why

Currently, when users complete a speaking practice session, only the parsed improvements (JSON) are stored. The original text spoken/written by the user during the LLM conversation is discarded, and there are no quantitative metrics measuring user output volume (words, unique words, vocabulary density).

Attaching the raw text of the user's conversation as an optional artifact allows users to review their actual text with inline corrections (red strikethrough for original phrasing, green for improvements) and provides valuable feedback on word usage over time at the session, topic, dashboard widget, and statistics page levels.

## What Changes

- **Session Import Enhancement**: Step 3 (import results) allows an optional text area for users to paste their raw conversation text (`rawText`).
- **Session Entity Update**: Storing optional `rawText` on the session object.
- **Interactive Text Artifact Viewer**: A modal component on session detail that renders the user's raw text with inline corrections matching `improvement.original` (red strikethrough) followed by `improvement.improved` (green text), with tooltips for explanations.
- **Session Word Metrics**: On-the-fly computation of total word count, unique words, and vocabulary density from `rawText`.
- **Topic-Level Word Aggregation**: Topic headers in the Dashboard collapsible accordion display aggregated total and unique word counts across sessions under that topic.
- **Dashboard Widget Update**: Add "Words Today" metric to the Dashboard time/activity stats widget.
- **Stats Page Additions**: Add a dedicated "Writing Metrics" section with total words, unique words, average density, and per-topic breakdown table.

## Capabilities

### New Capabilities
- `session-metrics-and-artifacts`: Interactive viewer for raw text with inline corrections, computation of session word metrics (total words, unique words, density), "Words Today" widget metric, and Stats page writing metrics breakdown.

### Modified Capabilities
- `session-flow`: Add optional `rawText` input during import confirmation and store `rawText` on session entity.
- `topic-sessions`: Aggregate total and unique words across sessions for topic summary displays.

## Impact

- **Components**: `src/screens/Session.jsx`, `src/screens/Dashboard.jsx`, `src/screens/Stats.jsx`.
- **Store**: `src/store.js` (update `createSession` / `updateSession` / `addSessionText`, helpers for metric aggregations).
- **Data model**: `rio_sessions` schema extends with optional `rawText: string | null`. Backward compatible (sessions without `rawText` gracefully handle missing metrics).
