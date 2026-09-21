# Design

## Context

The `UserAnnotatedMessage` component in `SeamlessChatSession.jsx` renders improvement annotations after the user requests evaluation of their message. Previously it used a CSS `group-hover` pseudo-class to show a tooltip — the tooltip only stays visible while the cursor physically overlaps the parent `<span>`, so moving the mouse from the word to the tooltip caused it to vanish. The inline layout also showed both the strikethrough original and the green improved text simultaneously, making messages harder to read.

See `proposal.md – Why` for motivation.

## Goals / Non-Goals

**Goals:**
- Fix the tooltip disappear bug permanently by switching to click-based state
- Simplify the message view: only original text (in red) visible until the user acts
- Keep all improvement detail inside the popover (nothing lost from the old tooltip)
- Support click-outside-to-close without a heavy library

**Non-Goals:**
- Repositioning the popover when it clips the viewport edge (deferred)
- Animating the popover open/close transition
- Changes to how improvements are fetched, stored, or evaluated
- Any changes to `textAnnotator.js` or the data model

## Decisions

### Decision: Click-controlled visibility via `useState` + `useEffect` (no CSS hover)

**Chosen**: Track `activeIdx` (the index of the open segment) in React state. Render the popover only when `isOpen === true`. A `useEffect` adds a `document` `mousedown` listener scoped to the active span ref; when a click lands outside that span, `activeIdx` is set to `null`.

**Alternative considered**: CSS `:focus-within` + `tabindex`. Rejected — requires keyboard focus management and doesn't work well with nested interactive elements (the Add button, audio player).

**Alternative considered**: A global portal / floating-ui library. Rejected — adds a dependency; this is a contained single-component change and the popover positioning requirements are simple.

### Decision: Ref map (`spanRefs`) instead of a single popover ref

**Chosen**: Each correction `<span>` stores its DOM node via a callback ref keyed by segment index (`spanRefs.current[idx] = el`). The click-outside handler uses `spanRefs.current[activeIdx]` to test `.contains(e.target)`.

**Why**: Only one popover can be open at a time (clicking a second word closes the first implicitly by setting `activeIdx` to the new index). The ref map avoids tearing down and recreating a single ref on every render cycle.

### Decision: Remove inline improved-text span entirely

**Chosen**: The green improved-text `<span>` that appeared next to the strikethrough original is removed. The improved version is shown only inside the popover.

**Why**: Matches the stated UX goal — the sentence reads naturally with erroneous fragments flagged in red; improvement detail is on-demand. Reduces visual noise.

## Risks / Trade-offs

- **Popover viewport clipping** → If a flagged word is near the top of the scroll container the popover (`bottom-full`) may be clipped. Mitigation: accepted as known limitation; can be addressed with viewport-aware positioning in a follow-up.
- **Multiple popovers** → Opening a second popover implicitly closes the first (state only holds one `activeIdx`). This is the desired behaviour; documented here for clarity.
- **`useEffect` cleanup** → The `mousedown` listener is attached only when `activeIdx !== null` and removed on cleanup. No risk of stale listeners accumulating.

## Migration Plan

Pure rendering change — no data migration required. Existing sessions with stored `improvements` arrays render correctly with the new component. No localStorage schema changes.
