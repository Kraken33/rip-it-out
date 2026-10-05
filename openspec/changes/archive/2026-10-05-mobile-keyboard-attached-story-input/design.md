# Design

## Context

See `proposal.md` for motivation. On mobile browsers (particularly iOS Safari / WebKit), software keyboards occupy a significant portion of the screen height without natively resizing the standard CSS `100vh` or document body. Consequently, standard document flow causes inputs to scroll unpredictably, triggers automatic browser zoom when font size is under 16px, and obscures reading content with stacked button clusters.

## Goals / Non-Goals

**Goals:**
- Provide a fixed-dock composer experience on mobile that stays pinned directly above the software keyboard and bottom safe area.
- Ensure the Russian story passage remains readable and scrollable in the upper viewport while the keyboard is active.
- Prevent automatic iOS Safari zoom-in on mobile text input focus.
- Collapse secondary action buttons on mobile behind a single compact toggle that expands into vertical, thumb-friendly full-width buttons.
- Preserve the existing horizontal desktop layout on larger screens without degradation.

**Non-Goals:**
- Custom software virtual keyboards or external native iOS bridging.
- Changing the AI story generation or evaluation services logic.
- Altering the desktop layout or SRS algorithm.

## Decisions

### 1. Viewport Meta & Dynamic Viewport Height (`100dvh`)
- **Decision**: Update `index.html` viewport meta tag to include `interactive-widget=resizes-content, viewport-fit=cover`. Wrap the active story translation container in a `h-[100dvh]` (or `calc(100dvh - header)`) flex column layout with `overflow-hidden`.
- **Rationale**: Modern mobile browsers (iOS 18+ and Chrome Mobile) automatically resize the dynamic viewport when `interactive-widget=resizes-content` is configured. `dvh` units adjust dynamically as browser bars and virtual keyboards shift.
- **Alternatives Considered**: Manual JavaScript `window.visualViewport.addEventListener('resize')` absolute coordinate hacking. *Rejected*: CSS-native `100dvh` with viewport meta is smoother, less prone to rubber-banding, and doesn't conflict with iOS scrolling physics.

### 2. Minimum 16px Font Size on Mobile Inputs
- **Decision**: Apply Tailwind classes `text-base sm:text-sm` (16px on mobile, 14px on `sm:` and up) to the translation `<textarea>`.
- **Rationale**: WebKit on iOS triggers an automatic zoom-in whenever an input with font-size below 16px receives focus. Setting 16px on mobile completely eliminates this jarring zoom and viewport displacement.
- **Alternatives Considered**: `maximum-scale=1.0` in viewport meta. *Rejected*: Disabling zoom in viewport meta violates accessibility standards (WCAG). Setting font size to 16px solves the issue natively and cleanly.

### 3. Responsive Collapsible Action Drawer (Vertical on Mobile, Horizontal on Desktop)
- **Decision**: Introduce a `mobileActionsOpen` state in `TranslationStorySession.jsx`.
  - **Mobile (< 640px)**:
    - In collapsed state: Display a single compact action button (`⚡ Actions ▲`) in a clean row above the input.
    - In expanded state: Render a vertical stack (`flex flex-col gap-2 w-full`) of full-width action buttons (`🎙️ Speak / Dictate`, `✨ Flavor`, `➡️ Next Round`, `✓ Finish Story`), with a `✕ Close Actions ▼` toggle.
  - **Desktop (>= 640px)**: Keep the existing horizontal row (`hidden sm:flex items-center justify-between`) visible at all times.
- **Rationale**: On mobile screens, vertical buttons are thumb-friendly touch targets with ample space for descriptive text. Collapsing them by default keeps the composer height minimal (~80px instead of ~220px), leaving maximum room to read the Russian story while the keyboard is open.
- **Alternatives Considered**: Horizontal scrolling carousel on mobile. *Rejected*: Horizontal carousels can be awkward to scroll with thumbs and hide important buttons off-screen. Vertical stacking when expanded is predictable and clear.

### 4. Hide Global Bottom Navigation During Active Sessions
- **Decision**: Update `App.jsx` to hide the global fixed `<nav>` bar when on `/session/new` during an active practice step (or pass a session active flag).
- **Rationale**: The fixed bottom navigation bar consumes 60px of vertical height and collides with the keyboard on mobile devices.

## Risks / Trade-offs

- **[Risk]** Older mobile browsers (iOS < 15.4) that don't support `dvh`.
  - **Mitigation**: Use `100vh` fallback in CSS / Tailwind (`min-h-screen h-[100dvh]`).
- **[Risk]** Textarea height expanding excessively on multi-paragraph translations.
  - **Mitigation**: Constrain `max-h` on mobile to `max-h-[140px]` with `overflow-y-auto` so it never pushes the story passage completely out of view.
