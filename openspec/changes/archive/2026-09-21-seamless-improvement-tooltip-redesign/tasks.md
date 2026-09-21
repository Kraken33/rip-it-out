# Tasks

## 1. Component Rewrite — UserAnnotatedMessage

- [x] 1.1 Add `spanRefs = useRef({})` to `UserAnnotatedMessage` and assign each correction span via callback ref `(el) => { spanRefs.current[idx] = el; }` — verify refs populate correctly by confirming no console errors on render
- [x] 1.2 Add `useEffect` that attaches a `document` `mousedown` listener when `activeIdx !== null`, checks `spanRefs.current[activeIdx].contains(e.target)`, and calls `setActiveIdx(null)` when the click is outside — verify clicking outside closes the popover
- [x] 1.3 Remove the `group` class and `group-hover:block` CSS on the tooltip `<div>`; replace with conditional render `{isOpen && (<div>…</div>)}` — verify the popover no longer vanishes on cursor movement between word and popover
- [x] 1.4 Replace the inline correction display (strikethrough original + green improved spans) with a single `<span>` showing only `seg.original` styled `text-rose-400 font-medium underline decoration-dashed decoration-rose-500/60 underline-offset-2` — verify no green improved text is visible inline after evaluation
- [x] 1.5 Add a `×` close button inside the popover header (top-right) that calls `setActiveIdx(null)` on click — verify clicking it closes the popover
- [x] 1.6 Change `onClick` on the correction span to call `e.stopPropagation()` before toggling `activeIdx` so the click-outside listener does not immediately close a popover opened by the same event — verify clicking a word opens the popover correctly

## 2. Popover Content

- [x] 2.1 Ensure the popover still contains: category label, AudioPlayerButton, pattern (if present), original/improved comparison block, explanation, context note (if present), and Add to Study List button — verify all fields render when the popover is open
- [x] 2.2 Remove the `line-through` style from the `🔴 Original` line inside the popover (original is no longer struck through — it is the user's real text shown for reference) — verify the original label renders without strikethrough in the popover

## 3. Tests

- [x] 3.1 Add or update a unit test for `UserAnnotatedMessage` that asserts: after clicking a flagged word, the popover is visible and contains the improved text; before clicking, the improved text is NOT visible in the DOM — verify with `npm test`
- [x] 3.2 Add a test that asserts: with a popover open, simulating a `mousedown` event on a node outside the component closes the popover (sets activeIdx to null) — verify with `npm test`
- [x] 3.3 Run the full test suite with `npm test` and confirm no regressions in existing seamless session tests

## 4. Verification

- [x] 4.1 Manual smoke test: open a seamless session, send a message, click "Improve Message", confirm the evaluated message shows only red flagged words (no green text inline), click a flagged word, confirm the popover appears and stays open while hovering over the Add button, click Add — verify the item is added and the popover stays open; then click outside to dismiss
- [x] 4.2 Confirm that sessions with improvements already stored (existing data) render correctly with the new component — verify no broken layout or missing content on old session data
