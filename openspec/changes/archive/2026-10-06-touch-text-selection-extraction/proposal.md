# Proposal

## Why

On mobile touch devices (such as iPhones and iPads running iOS Safari), users select text using touch gestures and long-press selection handles rather than mouse drag events. Currently, `ConstructionExtractor` binds selection listening only to `onMouseUp` and `onKeyUp` on its wrapping `<div>`, which means touch-based selections never trigger the extraction handler, leaving `selectedText` empty and preventing the `✨ Extract phrase` trigger button from appearing on mobile devices.

Listening to document-level `selectionchange` and touch events allows `ConstructionExtractor` to reliably detect text selection on touchscreens as well as desktop browsers, enabling mobile learners to harvest constructions seamlessly.

## What Changes

- **Document-level `selectionchange` tracking**: Add a `selectionchange` event listener on `document` within `ConstructionExtractor` to capture active text selections across touch and mouse interactions.
- **Container boundary verification**: Ensure `selectionchange` validates that the active selection endpoints (`anchorNode` and `focusNode`) reside inside the specific `ConstructionExtractor` container before updating state.
- **Touch-safe action triggers**: Add touch event protection (`onTouchStart={(e) => e.stopPropagation()}`) on the extraction trigger button so tapping the button on touch devices does not dismiss the selection prematurely before extraction begins.
- **Auto-dismiss on collapsed selection**: Clear active selection state when the user taps away or collapses the selection.

## Capabilities

### Modified Capabilities
- `construction-harvesting`: Enhance the extraction control requirement to explicitly specify support for mobile touch-based text selections via `selectionchange` across story passages, improved versions, and coach replies.

## Impact

- `src/components/ConstructionExtractor.jsx`: Update event listening to handle `selectionchange` and touch interactions.
- `src/__tests__/ConstructionExtractor.test.jsx`: Add test coverage for `selectionchange` and touch-based text selection.
