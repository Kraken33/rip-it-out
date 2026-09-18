# Change Proposal: Activity Time Tracking

## Why
Users currently have no visibility into how much time they invest in language learning activities across card reviews, prompt-based practice sessions, or specific study topics. Adding time tracking provides clear feedback on daily study habits, highlights total topic investment, and enables visual statistics.

## What
1. **Activity Logs Data Store**: Add `rio_activity_logs` in localStorage to record discrete activity duration events (Card Review, Prompt Practice / New Session) with `id`, `type`, `sessionId`, `topicId`, `durationSeconds`, and `createdAt`.
2. **Session Time Recording**: Record practice time in sessions (`Session.jsx` and `Practice.jsx`) from prompt copy / start trigger to "I'm Done Practicing" button click. Store duration on session records and append an activity log entry.
3. **Card Review Time Recording**: Measure active time spent in `Review.jsx` during card review queues and log duration linked to reviewed cards' sessions and topics.
4. **Topic & Session Time Aggregation**: Aggregate total time spent per session and total time spent per topic (sessions + review activity). Display time on Dashboard topic headers and expanded session rows.
5. **Dashboard Widget & Statistics Page**:
   - Add a Dashboard widget summarizing Today's Learning Time and Total Learning Time.
   - Create a dedicated Statistics view/page (`/stats`) with time breakdowns (Review vs Practice), Top Topics by Time Spent, and Daily activity history.

## Impact
- **Data Models**: Updates `rio_sessions` schema with `durationSeconds` field and introduces `rio_activity_logs` store in `store.js`. Updates `exportAllData` and `importData` for backup persistence.
- **UI Components**:
  - `Review.jsx`: Timer management on mount/unmount and rating/session completion.
  - `Session.jsx`: Timer starting on Prompt #1 copy and logging duration on confirmation/completion.
  - `Practice.jsx`: Timer starting on Prompt #3 copy and logging duration on "I'm Done Practicing".
  - `Dashboard.jsx`: Displays total topic time, session time breakdown, and time stats widget.
  - `App.jsx`: Adds nav item / route for `/stats`.
  - `Stats.jsx` [NEW]: New statistics screen with metrics and charts.
