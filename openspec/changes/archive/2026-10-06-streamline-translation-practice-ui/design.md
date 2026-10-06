# Design: Streamline Russian Translation Practice UI

## Context

The Russian Translation Practice experience currently suffers from visual clutter across several layers:
1. `Practice.jsx` renders outer mode selector tabs and sub-mode tabs above `TranslationPracticeSession`.
2. `TranslationPracticeSession.jsx` renders its own redundant header bar with a large title, a separate 40px "Round Targets:" chip strip, and robot avatars next to every passage bubble.
3. Highlighted constructions render static text tags like `(invite over)` inline directly in the Russian text, making natural reading difficult.

For motivation and scope, see [proposal.md](file:///Users/vanluv/develop/rip-it-out/openspec/changes/streamline-translation-practice-ui/proposal.md). For requirements, see [spec.md](file:///Users/vanluv/develop/rip-it-out/openspec/changes/streamline-translation-practice-ui/specs/russian-practice/spec.md).

## Goals / Non-Goals

**Goals:**
- Provide a clean, distraction-free translation interface matching the simplicity and space efficiency of `TranslationStorySession.jsx`.
- Maximize the visible viewport area for the Russian passage and translation composer.
- Make target construction annotations interactive (reveal target English construction on click/tap) rather than persistently injecting inline English text into the Russian passage.
- Maintain full compatibility with the existing SM-2 SRS rating flow and evaluation mechanics.

**Non-Goals:**
- Changing LLM prompt engineering, prompt #5 formatting, or structured verdict evaluation schemas.
- Modifying the Scenario Q&A (Prompt #3) copy screen.
- Altering the SRS review algorithm or card persistence logic.

## Decisions

### 1. Header Consolidation in Seamless Translation Mode
- **Choice**: When running an active Seamless Translation session in `Practice.jsx`, suppress the outer mode switch tabs (`Translation Practice / Scenario Q&A`) and sub-mode tabs (`Seamless AI / Copy Prompt #5`). In `TranslationPracticeSession.jsx`, render a single compact header bar with:
  - Left side: Round indicator badge (`Round X · Y practiced`).
  - Right side: `Finish & Rate Recall →` button and mobile actions trigger.
  - An option to exit or switch back to Prompt mode can be placed inside the collapsible action menu or via the finish control.
- **Alternatives Considered**: Keeping mode tabs pinned at the top: Rejected because it wastes ~100px of vertical space on mobile and creates visual confusion.

### 2. Elimination of Chip Bar and Avatars
- **Choice**: Remove the separate "Round Targets:" chip strip above the messages feed and remove the 32px robot avatar (`🤖`) gutters beside messages. Message bubbles and passage cards will span 100% width with clean margins.
- **Alternatives Considered**: Collapsible chip bar: Rejected because target constructions are already embedded directly in the passage text, making a separate chip strip redundant.

### 3. Interactive Click-to-Reveal Construction Highlighting
- **Choice**: Parse `[[Russian phrase|target construction]]` into an interactive `<HighlightTarget>` element. The Russian phrase is styled with a subtle highlighted background (e.g. purple tint with underline/border). Clicking or tapping the phrase toggles a compact popover/tooltip displaying the target English construction. Clicking outside or tapping again dismisses it.
- **Alternatives Considered**: Hover-only tooltips: Rejected because hover does not work on touch/mobile screens where the majority of translation practice occurs.

### 4. Layout & Viewport Consistency with `TranslationStorySession`
- **Choice**: Standardize the message container, translation composer, zero-scroll keyboard lock (`window.visualViewport`), and collapsible mobile actions drawer using the tested patterns from `TranslationStorySession.jsx`.

## Risks / Trade-offs

- **[Risk]** Users on touch devices might not realize highlighted phrases are interactive.
  → **Mitigation**: Add subtle visual cues (dashed underline / subtle badge styling / small indicator dot) and an initial subtle tooltip hint if needed.
- **[Risk]** Existing tests expecting specific header text or target chips might fail.
  → **Mitigation**: Update and add unit tests to verify the streamlined header, interactive highlight toggle, and full-width passage rendering.
