# Spec Delta

## REMOVED Requirements

### Requirement: Prompt Generation
**Reason**: Generating user-facing prompts for external LLMs (Prompts #1-#4) and parsing pasted raw JSON outputs have been retired. All AI interactions occur via direct, automated in-app API calls.
**Migration**: Use in-app Seamless AI sessions (voice coaching, story translation, card-style translation practice, and construction harvesting) which communicate directly with AI APIs.
