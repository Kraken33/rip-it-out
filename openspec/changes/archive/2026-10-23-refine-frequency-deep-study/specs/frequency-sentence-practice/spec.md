# Spec Delta

## MODIFIED Requirements

### Requirement: Contextual Example Variations
The system SHALL generate and display contextual example variations illustrating the target sentence pattern within the "Examples" tab, strictly locking and preserving the target English construction or vocabulary without drift to colloquial synonyms.

#### Scenario: Displaying initial contextual examples
- **WHEN** user views the "Examples" tab
- **THEN** system displays 3 to 4 distinct sentence examples showing diverse frames (questions, negations, varied tenses or subjects) that strictly retain and reinforce the active English root construction (e.g. inflections of "weep" / "wept" without substituting "cry"), each with Russian and English text and audio playback buttons

#### Scenario: Generating additional examples
- **WHEN** user clicks "Generate More Examples"
- **THEN** system queries the AI for additional distinct example variations retaining the target English construction and appends them to the active list without discarding previously displayed examples

### Requirement: Multi-Exercise Practice and Evaluation
The system SHALL provide interactive practice exercises with immediate, detailed AI evaluation within the "Practice" tab, adapting to the active practice direction and generating contextual application sentences rather than duplicate card echoes.

#### Scenario: Practicing with translation drill
- **WHEN** user selects or engages with a translation exercise in the Practice tab
- **THEN** system presents a newly generated, comprehensive contextual sentence in the source language (reinforcing the target construction within realistic dialogue or narrative context) and accepts text or microphone input in the target language

#### Scenario: Practicing with fill-in-the-blank cloze exercise
- **WHEN** user selects or engages with a cloze exercise in the Practice tab
- **THEN** system presents a contextual sentence in the active target language with the target construction or grammatical inflection blanked out, alongside a full translation of the sentence in the source language for context, and accepts the learner's completion attempt

#### Scenario: Submitting practice attempt for evaluation
- **WHEN** user submits their translation or cloze answer
- **THEN** system evaluates the attempt against both the contextual drill sentence and the root card anchor, displaying an accuracy verdict, a natural target-language rewrite with audio playback, and a granular grammatical explanation of any mistakes or alternative phrasings

#### Scenario: Retrying or requesting a new exercise
- **WHEN** user clicks "Retry" or "Try Another Exercise" after receiving evaluation
- **THEN** system resets the input field for another attempt or generates a new practice exercise
