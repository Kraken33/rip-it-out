# Proposal

## Why

The improvement tooltip in `SeamlessChatSession` is triggered by CSS `group-hover`, which causes it to vanish the instant the cursor leaves the highlighted word span—before the user can click the "Add to Study List" button. Separately, the current inline display (strikethrough original + green improved side-by-side) clutters the message text, making it hard to read the original sentence naturally. Both issues degrade the learning experience.

## What Changes

- **Bug fix**: Replace CSS `group-hover` tooltip trigger with a click-based popover so the tooltip stays open until explicitly dismissed.
- **UX redesign**: Show only the original text in red (with a dashed underline hint) in the message body; improvements are revealed only inside the popover when the user clicks the flagged word.
- **Click-outside dismiss**: Clicking anywhere outside an open popover closes it via a `document` `mousedown` listener scoped to the active span ref.
- **Close button**: A `×` button is added to the popover header as an additional dismiss affordance.
- The inline green improved-text span is removed from the message body entirely; the improved version appears only inside the popover.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `ai-seamless-integration`: The improvement annotation interaction model changes — highlighted improvements are now click-to-reveal rather than hover-to-reveal, and the inline display of the improved text is removed from the message body. This modifies how the system presents AI-generated improvement feedback to the user.

## Impact

- `src/screens/SeamlessChatSession.jsx` — `UserAnnotatedMessage` component rewritten
- No changes to `src/textAnnotator.js`, `src/store.js`, or any service/data layer
- No API or storage schema changes
- Existing improvement data (stored in session messages) is fully compatible; only the rendering changes
