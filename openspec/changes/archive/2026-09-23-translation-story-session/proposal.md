# Proposal

## Why

Learners who want translation practice have no in-session path: `Practice` drills existing vault cards, while `Session` only supports free dialogue about consumed content. Separately, seamless/prompt import forces all-or-nothing vault writes, so learners cannot keep only constructions they like.

## What Changes

- Add an activity selector on New Session: `Dialogue` (existing free-talk flow) vs `Translation` (new story-translation flow) rendering different Step-2 interfaces under the same Step-1/Step-4 shell.
- Add `TranslationStorySession` loop: LLM generates Russian stories (unlimited rounds, Next Round button), learner translates to English, LLM returns an improved version (comprehensive, fluent, optimized for daily speaking) plus candidate constructions per round.
- Aggregate all round candidates at Finish into one import list (dedupe, cap at `settings.maxImprovements`).
- Make Step-4 Review & Confirm selective: per-item checkboxes, select-all/deselect-all, `Confirm Import (N selected)`; unchecked items are discarded. Applies to both seamless and prompt copy/paste import paths.

## Capabilities

### New Capabilities
- `translation-story-session`: story-translation activity loop, per-round improved version, end aggregation into import candidates.

### Modified Capabilities
- `session-flow`: activity selection + branched Step-2 interfaces + selective import on Step 4 for both import paths.
- `ai-seamless-integration`: story passage generation, per-round translation feedback (fluent daily-speaking rewrite), and aggregation prompts via OpenAI chat.

## Impact

- `src/screens/Session.jsx` (activity state, branching, selective Step-4), new `src/screens/TranslationStorySession.jsx`, `src/services/aiService.js` + `src/prompts.js` (new prompts/parsers), session store shape (`activity` flag, round history), Library replay viewer routing, Vitest coverage for picker/aggregation.
