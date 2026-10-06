# Translation Story Session

## Purpose

The translation-story-session capability lets learners run story-translation sessions that generate Russian stories, collect English translations, show fluent daily-speaking improved versions, and aggregate candidate constructions for vault import.

## Requirements

### Requirement: Unlimited story-translation rounds

The system SHALL provide unlimited on-demand Russian story rounds inside a session, each round presenting one Russian story passage written in natural spoken Russian generated freely via dynamic Variety Matrix sampling (or user-selected variety parameters) without fixed discourse marker examples, accepting one English translation, and returning one improved version.

#### Scenario: Starting the first story round
- **WHEN** the user enters a translation activity session with seamless AI available
- **THEN** the system generates the first Russian story passage grounded in dynamic Variety Matrix dimensions (Domain, Tone, Format, Catalyst), the session's optional story topic/demands, and the learner level, written in natural spoken Russian without hardcoded discourse marker examples or static prompt anchor tropes, and presents it with a translation input.

#### Scenario: First round of a session without demands ignores the auto-generated title
- **WHEN** the user starts a translation session without entering story topic/demands, so the session carries an auto-generated date-based title
- **THEN** the first passage covers a fresh topic sampled from the Variety Matrix in spoken Russian and is not about the current date, the session title, or a calendar event.

#### Scenario: Requesting the next story
- **WHEN** the user has submitted a translation and received its improved version, and clicks Next Round
- **THEN** the system samples a fresh combination of Variety Matrix dimensions not recently used in this session, generates a fresh Russian story passage without repeating opening discourse markers or tropes from previous rounds, still honouring any active story demands or custom matrix settings, and presents it as a new round.

#### Scenario: Finishing with no translations
- **WHEN** the user finishes the translation activity without submitting any translation
- **THEN** no improvements are produced and the flow returns without creating vault entries.

### Requirement: Story Variety Matrix and in-session flavor controls

The system SHALL support an opt-in Variety Matrix consisting of Domain/Setting, Emotional Tone, Narrative Format, and Conflict/Catalyst, offering 1-click combo presets, granular dimension selection, and live in-session controls to inspect vibe tags, reroll the current passage, or tune the next round's flavor.

#### Scenario: Default auto variety mode
- **WHEN** the user creates a new story translation session without modifying the Variety Matrix
- **THEN** the session initializes in Auto mode, automatically sampling randomized, non-repeating matrix dimensions per round, and resets to Auto mode on subsequent new sessions.

#### Scenario: Applying a one-click combo preset
- **WHEN** the user selects a Variety Matrix preset (e.g. "Office Drama", "Travel Chaos", "Awkward Small Talk")
- **THEN** the matrix dimensions populate according to that preset's values and guide the generated story passage.

#### Scenario: Rerolling an active story passage
- **WHEN** the learner requests a story reroll on the active round before submitting a translation
- **THEN** the system generates a fresh Russian passage using a new Variety Matrix sample or updated matrix settings, replacing the current round's passage without discarding session progress.

#### Scenario: Tuning flavor mid-session
- **WHEN** the learner adjusts Variety Matrix settings or selects a new preset while inside an active session
- **THEN** subsequent generated rounds use the updated matrix parameters.

### Requirement: Per-round improved version for daily speaking

The system SHALL return, for each submitted translation, an improved version that is comprehensive, fluent, and optimized for daily speaking, preserving the learner's meaning, and SHALL NOT require or generate candidate constructions for the round.

#### Scenario: Improved version preserves meaning
- **WHEN** the learner submits an English translation of a story passage
- **THEN** the improved version keeps the learner's meaning and wording where natural, fixes errors, and uses fluent spoken phrasing rather than formal written style.

#### Scenario: Correct translation is affirmed
- **WHEN** the submitted translation is already natural and fluent
- **THEN** the system affirms success and presents no invented rewrite.

#### Scenario: Unparsable feedback is preserved
- **WHEN** the per-round feedback response cannot be parsed into the expected structure
- **THEN** the system displays the raw feedback text in the round thread, marks structured extraction as unavailable, and offers retry without discarding the learner's translation.

#### Scenario: Feedback rendering handles missing constructions safely
- **WHEN** the per-round feedback object lacks a `constructions` array
- **THEN** the UI renders the summary and improved version without runtime errors.

### Requirement: Translation session artefact

The system SHALL persist a finished translation-story session to the configured storage backend as a session record carrying the activity marker, all rounds (passage, learner translation, and improved version), timing measured from session start and logged as activity, and learner-only word metrics.

#### Scenario: Finished translation session is saved
- **WHEN** the user finishes after at least one submitted translation
- **THEN** the system creates a session with `activity` set to `translation`, `messages` or rounds holding one entry per round, `rawText` built ONLY from learner translations, and `durationSeconds` measured from session start.

#### Scenario: Finishing returns to the Dashboard
- **WHEN** the learner finishes the translation activity after submitting at least one translation
- **THEN** the session is saved and the flow returns to the Dashboard with no import or review step.

#### Scenario: Session time is logged as activity
- **WHEN** a translation-story session is finished
- **THEN** an activity log entry of type `session` with the measured duration is recorded so Dashboard and Stats time widgets include the session.

#### Scenario: Translation session appears in Library and stats
- **WHEN** a translation-story session record exists
- **THEN** it appears in Library under its title, constructions harvested from it are listed as vault items scoped to that session, its learner translations contribute to word metrics, and passages/improved versions are excluded from word counts.

### Requirement: Mobile viewport keyboard-attached composer and collapsible action menu

The system SHALL provide a mobile-responsive story translation interface that pins the translation composer dock directly above the software keyboard within dynamic visual viewport bounds (`window.visualViewport.height`), prevents iOS Safari automatic focus zoom by ensuring a minimum 16px font size on mobile viewports, keeps the active Russian story passage continuously visible and readable in the upper pane during active translation, locks document body scrolling and suppresses browser auto-scroll animations instantaneously on input focus, suppresses the top session header on mobile screens (< 640px), and consolidates all session actions and metadata under a collapsible Actions HUD to preserve maximum space for simultaneous reading and typing.

#### Scenario: Mobile input composer remains attached above software keyboard
- **WHEN** the user opens or focuses the translation text area on a mobile viewport and the software keyboard appears
- **THEN** the session container height dynamically adjusts to match `window.visualViewport.height`
- **AND** the document body scrolling is locked and focus auto-scroll is suppressed instantaneously (`preventScroll: true` / instant position lock), preventing sluggish scrolling delays and layout stutter
- **AND** the composer dock remains attached directly above the software keyboard and bottom safe area without jumping, and the translation textarea occupies full width.

#### Scenario: Mobile top header suppression and minimal composer bar
- **WHEN** the story translation session is viewed on a mobile viewport (< 640px)
- **THEN** the top session header (displaying round count, vibe badge, flavor button, next round, and finish buttons) is completely hidden
- **AND** the bottom composer toolbar renders only the full-width textarea and the `⚡ Actions (Round N)` toggle button, hiding inline dictation and translate submit buttons on mobile.

#### Scenario: Mobile Actions HUD consolidated story controls
- **WHEN** the user taps the Actions HUD toggle on a mobile viewport
- **THEN** the HUD panel opens displaying the round index and vibe badge in the header
- **AND** the HUD provides full-width accessible controls for `🎙️ Speak Answer` (audio dictation), `▶ Translate Translation` (submit), `✨ Tune Story Flavor` (matrix drawer toggle), `➡️ Next Round`, and `✓ Finish Story`.

#### Scenario: Preventing iOS Safari auto-zoom on mobile text input
- **WHEN** the user taps or focuses the translation input text area on a mobile device
- **THEN** the input text area renders with a font size of at least 16px (`text-base`), preventing automatic browser zoom and horizontal viewport shifting.

#### Scenario: Desktop view preserves standard horizontal controls
- **WHEN** the story translation session is viewed on desktop viewports (>= 640px)
- **THEN** the top session header bar and bottom composer toolbar display standard inline buttons (`Next Round`, `Finish Story`, `Flavor`, `Translate`, `Speak`) without requiring collapsible expansion.