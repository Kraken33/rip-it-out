# Design Document: Activity Time Tracking

## Overview
This document outlines the technical design for tracking, storing, and visualizing time spent in Rip It Out across activities (Card Review, Prompt Practice), Sessions, and Topics.

## Data Model & Persistence (`store.js`)

### 1. `rio_activity_logs` Entity
Stored in `localStorage` under `STORAGE_KEYS.activityLogs = 'rio_activity_logs'`.
```typescript
interface ActivityLog {
  id: string;
  type: 'review' | 'session';
  durationSeconds: number;
  sessionId?: string;
  topicId?: string;
  createdAt: string; // ISO 8601
}
```

### 2. Session Schema Extension
Add `durationSeconds` (default `0`) to `Session` object in `createSession` and `updateSession`.

### 3. Data Store Helper API
- `logActivity({ type, durationSeconds, sessionId, topicId })`: Writes log record.
- `getActivityStats()`: Computes:
  - `todayTimeSeconds`: Sum of logs created today.
  - `totalTimeSeconds`: Sum of all logs.
  - `reviewTimeSeconds`: Sum of logs with type `review`.
  - `sessionTimeSeconds`: Sum of logs with type `session`.
  - `dailyHistory`: Array of `{ date: 'YYYY-MM-DD', durationSeconds, reviewSeconds, sessionSeconds }` for the last 14 days.
  - `topTopics`: Top 5 topics sorted by total accumulated time.
- `getTopicTime(topicId)`: Calculates sum of session practice time and card review time for that topic.
- `formatDuration(seconds)`: Utility formatting `seconds` into concise strings like `45s`, `12m`, `1h 15m`.

## Timer & Component Flow Integrations

### Review Screen (`src/screens/Review.jsx`)
- Maintain a local `startTime` using `Date.now()` when queue active.
- On card ratings and queue completion / unmount, measure elapsed active time.
- Log activity via `logActivity({ type: 'review', durationSeconds, sessionId, topicId })`.

### Session Setup Screen (`src/screens/Session.jsx`)
- Start timer on Prompt #1 copy or step 2 initialization.
- On step 4 import confirmation, calculate duration and update session record + activity log.

### Practice Screen (`src/screens/Practice.jsx`)
- Start timer when Prompt #3 is copied or view mounts.
- When clicking "I'm Done Practicing", save elapsed time to session activity log.

### Dashboard Screen (`src/screens/Dashboard.jsx`)
- Render a new `Time Spent` widget showing Today's Time and Total Time with a navigation button to `/stats`.
- Update Topic headers to display aggregated topic duration (`formatDuration(topic.totalTimeSeconds)`).
- Update expanded session items to show session time (`formatDuration(session.durationSeconds)`).

### Statistics Screen (`src/screens/Stats.jsx` [NEW])
- Render key metric tiles: Total Time, Today's Time, Review Time vs Practice Time.
- Render Topic Time breakdown chart/bars.
- Render 14-day daily activity breakdown history.
- Add `/stats` route to `App.jsx` and navigation bar item.

## Testing Strategy
- Unit tests in `src/__tests__/store.test.js` verifying time logging, aggregation, and time calculations.
- Component integration tests for timer triggers in `Review`, `Session`, `Practice`, `Dashboard`, and `Stats`.
