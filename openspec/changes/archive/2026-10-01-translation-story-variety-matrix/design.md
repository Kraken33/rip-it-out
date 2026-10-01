# Design

## Context

See `proposal.md` for motivation. Currently, `generateStoryPassagePrompt` in [`src/prompts.js`](file:///Users/vanluv/develop/rip-it-out/src/prompts.js) includes static examples ("running into a neighbour, a small problem at home, or getting ready for the day") which cause LLMs to generate highly repetitive stories. In addition, story rounds lack structural diversity parameters (Domain, Tone, Format, Catalyst).

## Goals / Non-Goals

**Goals:**
- Provide a robust Variety Matrix catalog with four orthogonal dimensions: Domain/Setting, Emotional Tone, Narrative Format, and Conflict/Catalyst.
- Support 1-click combo presets (e.g. "Office Drama", "Travel Chaos", "Awkward Small Talk", "Cafe Mishap", "Tech Glitch") alongside granular custom dials.
- Provide invisible automatic sampling by default that avoids recently sampled dimensions within the session and resets to Auto on each new session.
- Allow learners to reroll the active passage before translating and adjust variety settings mid-session.
- Update `generateStoryPassagePrompt` to remove hardcoded anchor tropes and instruct the LLM with the sampled or specified variety constraints.

**Non-Goals:**
- Persisting matrix customizations across browser sessions or into database records (matrix selections are ephemeral session seeds).
- Changing the evaluation or construction extraction pipeline for story sessions.

## Decisions

### Decision 1: Variety Matrix Catalog & Sampler in `prompts.js`
- Define `VARIETY_MATRIX` data structures in `src/prompts.js`:
  - `domains`: Work & Office, Coffee Shop & Food, Travel & Transit, Public Places & Shopping, Home & Daily Life, Health & Fitness, Social & Friends, Tech & Modern Life.
  - `tones`: Amused / Ironic, Mildly Annoyed / Vented, Surprised / Baffled, Relieved / Lucky, Rushed / Chaotic, Proud / Small Victory.
  - `formats`: Spoken Anecdote, Recounted Dialogue, Spoken Observation / Hot Take, Micro-Dilemma.
  - `catalysts`: Misunderstanding, Plans Going Sideways, Unexpected Encounter, Tech / Gadget Glitch, Awkward Social Interaction, Pleasant Surprise.
- Define `VARIETY_PRESETS`: Curated combinations that assign specific domain/tone/format/catalyst values.
- Implement `sampleVarietyMatrix(selectedOptions = {}, recentSamples = [])` which respects user-fixed dimensions while randomly picking unspecified dimensions from unexhausted items.
- *Alternatives considered*: Generating variety purely via freeform LLM prompt without matrix tags. Rejected because LLMs still tend to fall into default conversational tropes without structured prompt boundaries.

### Decision 2: Update `generateStoryPassagePrompt` Signature & Prompt Framing
- Update `generateStoryPassagePrompt(session, settings, historyTopics, matrixSample)`:
  - Remove all hardcoded anchor examples.
  - Inject the matrix parameters (Setting, Tone, Format, Catalyst) into the system prompt.
  - Add Russian conversational discourse marker instructions (*"Короче...", "Представляешь...", "В общем..."*).
  - *Alternatives considered*: Passing matrix parameters inside `session.storyDemands`. Rejected to keep explicit user demands separate from structural variety seeds.

### Decision 3: Setup UI in `Session.jsx`
- Under the `storyDemands` textarea, provide a collapsible "Story Flavor & Variety Matrix" section (collapsed by default).
- Include quick preset chips (e.g., `⚡ Office Drama`, `✈️ Travel Chaos`, `☕ Awkward Cafe`, `🎲 Auto / Randomize`).
- Provide individual dropdown dials for Domain, Tone, Format, and Catalyst with an "Auto / Random" option for each.
- When creating a session, attach the selected `varietyMatrix` state to the session object passed to `TranslationStorySession`.

### Decision 4: In-Session Controls in `TranslationStorySession.jsx`
- Track the current round's resolved matrix sample and display a subtle badge above the passage (e.g. `✈️ Travel · 😅 Amused · Anecdote`).
- Add a "🎲 Reroll Story" button visible on the active round when translation has not yet been submitted.
- Add a collapsible "⚙️ Tune Story Flavor" drawer or popover in the session header/footer allowing learners to change the matrix or preset for the next round without leaving the session.

## Risks / Trade-offs

- **[Risk] Prompt Overconstraint**: Giving too many strict requirements could make the Russian passage sound unnatural or too long.
  - *Mitigation*: Keep matrix directives lightweight (1-2 sentences in the prompt) and explicitly instruct the model to prioritize natural spoken 3-6 sentence colloquial Russian over rigid adherence.
- **[Risk] UI Clutter**: Adding multiple matrix dropdowns could overwhelm a clean translation setup screen.
  - *Mitigation*: Keep the Variety Matrix section collapsed by default with clear preset pills for quick 1-click selection.
