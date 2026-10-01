# Proposal

## Why

Story translation currently generates repetitive Russian passages across rounds and sessions because the generation prompt relies on static anchor examples (e.g. running into neighbors, waking up to alarms) and lacks multi-dimensional diversity guidance. Adding an invisible-by-default Variety Matrix with opt-in granular controls and 1-click combo presets solves this repetition problem while empowering learners to tailor their story scenarios on demand both before and during active sessions.

## What Changes

- **Dynamic Variety Matrix Prompt Engine**: Replaces static prompt anchors with dynamic scenario sampling across four orthogonal dimensions: Domain/Setting, Emotional Tone, Narrative Format, and Conflict/Catalyst.
- **Invisible Auto Mode by Default**: Each session starts in "Auto (Random Variety)" mode by default, randomly sampling distinct non-repeating combinations per round and resetting on new sessions.
- **Opt-in Variety Matrix Controls & Presets**: Adds a collapsible Variety Matrix drawer with 1-click presets (e.g., "Office Drama", "Travel Chaos", "Awkward Small Talk") and granular dimension dropdowns in session setup.
- **In-Session Vibe Adjustments & Story Reroll**: Displays the current passage's vibe badge, allows rerolling the active passage before translating, and enables tuning the next round's flavor mid-session.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `translation-story-session`: Expands story passage generation to support dynamic variety matrix sampling, user-selected matrix presets/dimensions, active round story rerolling, and in-session flavor adjustments.

## Impact

- `src/prompts.js`: Variety matrix catalog, presets, and dynamic prompt generator.
- `src/services/aiService.js`: API helper parameter handling for matrix seeds and reroll requests.
- `src/screens/Session.jsx`: Setup UI with collapsible Variety Matrix and presets selector.
- `src/screens/TranslationStorySession.jsx`: In-session vibe indicators, reroll action, and flavor tuning drawer.
- Unit and integration tests in `src/__tests__/`.
