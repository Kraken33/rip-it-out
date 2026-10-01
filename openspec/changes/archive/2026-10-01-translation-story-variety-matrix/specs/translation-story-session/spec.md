# Spec Delta

## MODIFIED Requirements

### Requirement: Unlimited story-translation rounds

The system SHALL provide unlimited on-demand Russian story rounds inside a session, each round presenting one Russian story passage written in natural spoken Russian generated via dynamic Variety Matrix sampling (or user-selected variety parameters), accepting one English translation, and returning one improved version.

#### Scenario: Starting the first story round
- **WHEN** the user enters a translation activity session with seamless AI available
- **THEN** the system generates the first Russian story passage grounded in dynamic Variety Matrix dimensions (Domain, Tone, Format, Catalyst), the session's optional story topic/demands, and the learner level, written in natural spoken Russian without static prompt anchor tropes, and presents it with a translation input.

#### Scenario: First round of a session without demands ignores the auto-generated title
- **WHEN** the user starts a translation session without entering story topic/demands, so the session carries an auto-generated date-based title
- **THEN** the first passage covers a fresh topic sampled from the Variety Matrix in spoken Russian and is not about the current date, the session title, or a calendar event.

#### Scenario: Requesting the next story
- **WHEN** the user has submitted a translation and received its improved version, and clicks Next Round
- **THEN** the system samples a fresh combination of Variety Matrix dimensions not recently used in this session, generates a fresh Russian story passage still honouring any active story demands or custom matrix settings, and presents it as a new round.

#### Scenario: Finishing with no translations
- **WHEN** the user finishes the translation activity without submitting any translation
- **THEN** no improvements are produced and the flow returns without creating vault entries.

## ADDED Requirements

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
