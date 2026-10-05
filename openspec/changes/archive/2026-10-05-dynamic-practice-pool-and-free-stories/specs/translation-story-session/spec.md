# Spec Delta

## MODIFIED Requirements

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
