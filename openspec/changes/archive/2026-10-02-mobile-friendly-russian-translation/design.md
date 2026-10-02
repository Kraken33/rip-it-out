# Design

## Context

The interactive translation practice screen (`src/screens/TranslationPracticeSession.jsx`) was originally built with desktop viewport assumptions:
- A rigid container height (`h-[82vh]`) that clips content or overflows on mobile browser viewports with dynamic URL bars.
- A rigid single-row control bar where `AudioRecorder`, `Next Round →`, and `Finish Practice ✓` compete for horizontal space, causing horizontal overflow and misaligned elements on screens narrower than 430px.
- Bulky padding on recording controls and duplicate navigation buttons in both header and footer.
- Keyboard shortcut helper text occupying valuable vertical screen space on mobile touch devices.

See `proposal.md` for background and user impact.

## Goals / Non-Goals

**Goals:**
- Implement a mobile-adaptive container structure utilizing dynamic viewport heights (`h-[calc(100dvh-5.5rem)] sm:h-[82vh]`) and fluid scroll containers.
- Re-architect the bottom control bar to use responsive flexbox wrapping, ensuring microphone recording and round navigation controls stack cleanly on small mobile viewports.
- Optimize the `AudioRecorder` component with responsive padding and compact sizing when rendered in toolbars.
- Streamline the header layout and target chips bar for small screens (<640px) with responsive typography and clean wrapping.
- Hide desktop-specific shortcut hints on mobile viewports while preserving standard touch submit buttons.
- Maintain full test coverage and ensure all existing functionality and test IDs remain intact.

**Non-Goals:**
- Changing AI prompt generation or evaluation parsing logic.
- Altering the SM-2 SRS spaced repetition algorithm or card batching queries.
- Redesigning unrelated practice screens (e.g. Prompt #3 Scenario Q&A).

## Decisions

### 1. Viewport & Container Height Strategy
- **Choice**: Use `h-[calc(100dvh-5rem)] sm:h-[82vh] max-h-none sm:max-h-[850px]` with flex-col structure.
- **Rationale**: `dvh` (Dynamic Viewport Height) natively handles mobile browser URL bar expansions and virtual keyboard appearance on modern iOS and Android browsers, preventing double scrollbars and cut-off submit buttons.
- **Alternatives Considered**: Fixed pixel heights (fails across different device sizes) or unbounded height with whole-page scroll (loses the fixed chat toolbar experience).

### 2. Controls Toolbar Restructuring
- **Choice**: Structure the controls footer into a responsive multi-tiered layout:
  - Top action row: `AudioRecorder` on the left, with round controls (`Next Round →`, `Finish Practice ✓`) aligned on the right, wrapping to a 2-column or stacked layout on extra small screens (`<400px`).
  - Input form: Multi-line textarea with full width, followed by the submit row containing the "Translate ▶" button.
- **Rationale**: Keeps all interactive elements easily reachable by thumb on mobile devices without overflowing screen margins.

### 3. Responsive AudioRecorder Styling
- **Choice**: Apply responsive sizing classes (`px-3.5 py-2 sm:px-6 sm:py-3.5 text-xs sm:text-sm`) and compact icon presentation on mobile.
- **Rationale**: Reduces the button footprint from >160px to ~110px on mobile screens, leaving ample room for round navigation controls.

### 4. Header & Target Chip Bar Refinements
- **Choice**: Responsive header flex direction (`flex-col sm:flex-row items-start sm:items-center gap-2`), responsive font sizes (`text-sm sm:text-base`), and scrollable target chips with subtle indicators.
- **Rationale**: Avoids text wrapping collisions between the session title, round status badge, and finish actions.

## Risks / Trade-offs

- **[Risk] Virtual keyboard covering input on iOS Safari** → Mitigation: Use standard form action scrolling and prevent artificial viewport locking with `overscroll-behavior-contain`.
- **[Risk] Regression in existing RTL/Vitest component tests** → Mitigation: Preserve all existing `data-testid` and `id` attributes (`btn-finish-translation-practice`, `btn-next-step-3`, `evaluating-indicator`, `verdict-target`, etc.).
