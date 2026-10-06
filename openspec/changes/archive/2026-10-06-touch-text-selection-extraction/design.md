# Design

## Context

`ConstructionExtractor` currently relies solely on `onMouseUp` and `onKeyUp` synthetic React events on its wrapping `<div>`. On mobile devices (iOS Safari and Android Chrome touch interfaces), text selection is initiated and manipulated via touch gestures, firing `selectionchange` events on `document` rather than mouse events on the element.

See [proposal.md](file:///Users/vanluv/develop/rip-it-out/openspec/changes/touch-text-selection-extraction/proposal.md) for motivation and context.

## Goals / Non-Goals

**Goals:**
- Enable phrase harvesting on mobile touch devices (iOS Safari, mobile Chrome/Firefox) by detecting touch text selection via `document.addEventListener('selectionchange', ...)`.
- Ensure multi-instance safety: when multiple `ConstructionExtractor` components exist on screen (e.g. story passages, improved versions, coach messages), only the instance containing the active selection displays the extract trigger button.
- Prevent premature selection dismissal when tapping action buttons on mobile screens.

**Non-Goals:**
- Modifying the AI extraction prompt or payload structure.
- Altering desktop mouse-selection workflows.

## Decisions

### 1. Document `selectionchange` Listener in `useEffect`
- **Decision:** Bind a `selectionchange` listener to `document` inside `ConstructionExtractor`.
- **Rationale:** Mobile Safari dispatches `selectionchange` on `document` whenever touch selection pins or long-press selections change.
- **Handling Scope:**
  - Check `sel && !sel.isCollapsed && containerRef.current?.contains(sel.anchorNode) && containerRef.current?.contains(sel.focusNode)`.
  - If valid selection is inside this container: set `selectedText(text)`.
  - If selection is collapsed or outside: clear `selectedText` (unless actively extracting or viewing an extracted card).

### 2. Touch Event Propagation Protection on Trigger Button
- **Decision:** Add `onTouchStart={(e) => { e.stopPropagation(); }}` and `onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}` to the extract button and its wrapper.
- **Rationale:** On touch devices, tapping outside text can blur and collapse the selection. Stopping propagation ensures the click handler executes and extracts the phrase cleanly.

## Risks / Trade-offs

- **[Risk] Multiple extractors on screen executing `selectionchange`** → Each extractor performs a quick DOM `contains()` check against its own `containerRef.current`. Unfocused extractors immediately return with minimal CPU overhead.
- **[Risk] Selection cleared while clicking the extract button** → `handleExtract` captures `selectedText` from component state rather than re-reading `window.getSelection()`, ensuring robustness even if the browser clears selection on button tap.
