# Proposal: Streamline Russian Translation Practice UI

## Why

The Russian Translation Practice screen (`Practice.jsx` / `TranslationPracticeSession.jsx`) is currently visually overloaded with stacked navigation bars, redundant titles, extra target chips, avatar sidebars, and static inline construction labels. Streamlining the layout to match the clean, focused presentation of `TranslationStorySession.jsx` will maximize the visible passage area, eliminate visual distractions, and provide a frictionless translation experience on both mobile and desktop.

## What Changes

- **Consolidate Header & Remove Redundant Bars in Active Session**: When actively in a translation practice session, remove the outer mode selection tabs (`Translation Practice / Scenario Q&A`), outer sub-mode tabs (`Seamless AI / Copy Prompt #5`), and the redundant screen title ("Russian Translation Practice"). Replace them with a single compact, clean top bar displaying only the round count and essential controls (e.g. End Session), matching `TranslationStorySession`.
- **Remove Separate Target Chips Strip**: Remove the separate 40px "Round Targets:" horizontal chip bar above the message feed, eliminating redundant vertical space consumption.
- **Remove Robot Avatars & Horizontal Gutters**: Eliminate the 32px robot avatar (`🤖`) and nested side margins in Russian message bubbles, allowing the Russian passage card to span full width and give maximum reading space.
- **Interactive Construction Reveal on Click/Tap**: Upgrade construction highlighting in Russian passages (`[[Russian phrase|target construction]]`) so that target constructions are not persistently rendered as intrusive text labels like `(invite over)`. Instead, highlighted Russian phrases reveal the English target construction on-demand when tapped or clicked (via an interactive popover, tooltip, or toggled badge).
- **Harmonize Layout with Russian Story Session**: Align spacing, typography, card borders, and collapsed bottom composer actions with the clean design system established in `TranslationStorySession.jsx`.

## Capabilities

### Modified Capabilities

- `russian-practice`: Updates `Construction Highlighting and Parsing` to require interactive on-demand reveal on click/tap, and updates `Mobile-Responsive Translation Session Layout and Controls` to streamline the header hierarchy, eliminate avatar gutters, and maximize passage readability.

## Impact

- **Affected Code**: `src/screens/Practice.jsx`, `src/screens/TranslationPracticeSession.jsx`, `src/components/ConstructionExtractor.jsx` (or a dedicated interactive highlight component), and related test files.
- **APIs / Data Flow**: No backend or LLM prompt changes; UI layout and interaction enhancement only.
