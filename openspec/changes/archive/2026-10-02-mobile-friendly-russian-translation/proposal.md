# Proposal

## Why

The interactive "Russian Translation Practice" session is currently difficult or unusable on mobile phone viewports. Rigid height constraints (`h-[82vh]`), non-wrapping control toolbars (audio recorder placed alongside next round and finish buttons in a single unyielding row), duplicate navigation headers, and desktop-centric keyboard shortcut helpers result in horizontal overflow, cramped scroll threads, and obscured translation inputs when virtual keyboards open on mobile devices.

## What Changes

- **Adaptive Mobile Layout**: Refactor the Russian Translation Practice container and viewports to utilize responsive dynamic heights (`min-h-[calc(100dvh-5rem)]` / flexible scroll views) so the session comfortably fits smartphone screens without getting clipped by browser chrome or mobile keyboards.
- **Responsive Controls Toolbar**: Restructure the bottom controls area so the `AudioRecorder`, action buttons (`Next Round →`, `Finish Practice ✓`), and `Translate ▶` submit button wrap gracefully into stacked or compact touch-friendly button layouts on screens below `sm` (640px).
- **Responsive Header & Target Chips**: Streamline the top header bar and round target chips on mobile with responsive typography, compact badges, and clean single-column or flex-wrapped headers.
- **Mobile-Adaptive Input Guidance**: Adapt or hide the desktop shortcut hint ("Enter adds a new line · Ctrl/⌘ + Enter translates") on small mobile screens to conserve vertical viewport space.
- **Touch & Keyboard Usability**: Ensure message bubbles, verdict cards, and translation textareas provide sufficient touch targets and fluid scrolling on mobile devices.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `russian-practice`: Add responsive mobile layout and touch-adapted viewport requirements to ensure multi-round Russian translation practice is fully functional and ergonomic on smartphones and small screens.

## Impact

- **Affected Code**: `src/screens/TranslationPracticeSession.jsx`, `src/screens/Practice.jsx`, `src/components/AudioRecorder.jsx`.
- **Testing**: Vitest unit/integration tests in `src/__tests__/TranslationPracticeSession.test.jsx` and `src/__tests__/Practice.test.jsx`.
- **APIs / Data Stores**: No backend or storage schema changes required.
