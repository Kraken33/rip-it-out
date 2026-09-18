# Tasks

## 1. Dashboard & Library Navigation Integration

- [x] 1.1 Update `src/screens/Dashboard.jsx` to make session rows in expanded topic list clickable, navigating to `/library?session=<sessionId>`
- [x] 1.2 Verify `src/screens/Library.jsx` reads `session` query parameter and applies session filtering upon navigation
- [x] 1.3 Add unit tests in `src/screens/Dashboard.test.jsx` verifying clicking a session row triggers navigation to `/library?session=<sessionId>`
