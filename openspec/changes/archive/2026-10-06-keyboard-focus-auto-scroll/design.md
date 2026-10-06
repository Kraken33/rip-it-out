# Design

## Context

On mobile devices, focusing an input element prompts the software keyboard to emerge, shrinking the viewport height. In `rip-it-out`, session screens lock the document body scroll to prevent page distortion, and dynamic container sizing keeps the composer dock attached directly above the keyboard.

However, the inner message scroll container (`overflow-y-auto`) retains its previous `scrollTop` upon container shrinkage. Furthermore, existing `scrollIntoView` effects only trigger when rounds or messages change, not when the input gains focus or when the viewport resizes.

See [proposal.md](file:///Users/vanluv/develop/rip-it-out/openspec/changes/keyboard-focus-auto-scroll/proposal.md) for motivation and context.

## Goals / Non-Goals

**Goals:**
- Automatically align the message container to the active Russian passage and latest thread item whenever the user focuses the translation/chat textarea.
- Synchronize scroll adjustment with the mobile software keyboard slide-up animation (triggering on focus and on visual viewport resize / keyboard state change).
- Standardize the scroll-to-latest mechanism across Translation Story, Translation Practice, and Seamless AI Dialogue.

**Non-Goals:**
- Altering the desktop session layout or desktop scrolling behaviors.
- Changing the storage format, session data structure, or prompt orchestrator logic.

## Decisions

### 1. Dual-Phase Scroll Alignment on Focus and Keyboard Open
- **Decision:** Trigger scroll alignment in two phases:
  1. Immediately on textarea `onFocus`
  2. With a short delay (~150ms / 250ms) and on `isKeyboardOpen` / viewport resize transitions, ensuring that once the mobile virtual keyboard completes its slide-up animation, the scroll container's `scrollTop` remains correctly pinned at the bottom.
- **Rationale:** Mobile browsers (iOS Safari and Chrome Android) animate the visual viewport resize over 150–300ms. An immediate scroll adjusts current state, while the delayed callback ensures final positioning after layout stabilization.
- **Alternatives Considered:**
  - *Immediate scroll only*: Can leave the bottom partially obscured if the keyboard finishes expanding after the scroll event completed.
  - *Polling loop*: Unnecessary overhead and can cause jitter.

### 2. Targeted Container Scroll vs `scrollIntoView`
- **Decision:** Combine `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })` with direct container `scrollTop = scrollHeight` fallback.
- **Rationale:** Directly targeting `messagesEndRef` with `block: 'end'` ensures the active round's passage card sits directly above the bottom composer dock in the available viewport.

### 3. Reusable Scroll Helper Hook / Utility
- **Decision:** Encapsulate the scroll alignment logic or integrate with `useVisualViewport` to provide consistent behavior across `TranslationStorySession`, `TranslationPracticeSession`, and `SeamlessChatSession`.
- **Rationale:** Prevents duplicate keyboard timing and scroll coordination code across the three session screens.

## Risks / Trade-offs

- **[Risk] User manually scrolls up to read an earlier round while typing** → Auto-scroll is only triggered on initial input focus and when keyboard opens, so deliberate manual scrolling while typing is not interrupted.
- **[Risk] Visual jumpiness on fast focus/blur cycles** → Using debounce or checking active focus before delayed scroll prevents unnecessary repositioning.
