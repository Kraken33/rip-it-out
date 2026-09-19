# Tasks

## 1. Store & Word Metrics Utilities

- [x] 1.1 Update `src/store.js` session model to accept optional `rawText` field in `createSession` / `updateSession` / `addSessionText` and verify store state persistence.
- [x] 1.2 Implement word calculation helper `countTextWords(text)` in `src/store.js` (returning `totalWords`, `uniqueWords`, `vocabularyDensity`) and add Vitest unit tests in `src/__tests__/wordMetrics.test.js`.
- [x] 1.3 Add topic and daily word metrics aggregators (`getTopicWordMetrics`, `getTodayWordMetrics`, `getAllTimeWordMetrics`) in `src/store.js` and verify with unit tests.

## 2. Text Matching & Interactive Artifact Viewer

- [x] 2.1 Implement `buildAnnotatedText(rawText, improvements)` utility function to segment `rawText` into plain text and matched improvement corrections (strikethrough original + green improved text), and verify with unit tests in `src/__tests__/annotatedText.test.js`.
- [x] 2.2 Create `ConversationViewerModal` component in `src/screens/ConversationViewerModal.jsx` to display interactive annotated conversation text with inline tooltips for explanations and word metrics summary footer.

## 3. Session Flow UI Updates

- [x] 3.1 Update Step 3 in `src/screens/Session.jsx` to include an optional multi-line textarea for pasting raw conversation text (`rawText`) alongside JSON improvements import.
- [x] 3.2 Update Session detail view in `src/screens/Session.jsx` to show a "View Conversation" button when `rawText` is present, launching `ConversationViewerModal`.

## 4. Dashboard & Stats UI Updates

- [x] 4.1 Update `Dashboard.jsx` topic accordion section to render aggregated total and unique word count badges for topics and session rows.
- [x] 4.2 Update `Dashboard.jsx` time tracking stats widget to render "Words Today" metric.
- [x] 4.3 Update `Stats.jsx` to render a new "Writing Metrics" section containing all-time word counts, average density, and per-topic word metrics table.

## 5. End-to-End Verification & Testing

- [x] 5.1 Run all unit & integration tests (`npm test`) and verify zero regressions across session creation, topic aggregation, dashboard, and stats pages.
