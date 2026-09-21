# Proposal: Seamless AI Integration & Audio Playback (Groq + OpenAI TTS)

## Problem
Currently, users of **rip-it-out** must perform manual copy-and-paste steps to get AI feedback:
1. Generate a prompt in the app.
2. Copy and paste it into external ChatGPT / Claude web interfaces.
3. Converse with the external AI.
4. Copy the final JSON response back into rip-it-out to parse and save improvements into SRS flashcards.

This manual workflow interrupts speaking flow and practice momentum. Furthermore, users lack built-in audio pronunciation feedback for newly saved English constructions.

## Proposed Solution
We propose an optional **Seamless AI Experience** that automates speech-to-text recording, direct AI coaching, and text-to-speech audio feedback inside rip-it-out, while retaining full access to manual prompt copy-pasting.

Key highlights:
- **Default AI Engine**: **Groq API** (`whisper-large-v3` for STT, `llama-3.3-70b-versatile` for LLM coaching) paired with **Browser Web Speech API** (`window.speechSynthesis`) for 100% free speech-to-text and instant text-to-speech audio playback.
- **Optional Premium Audio Upgrade**: Support for an optional **OpenAI API Key**, unlocking high-quality neural Text-to-Speech (`tts-1` API with voices like `alloy`, `nova`, `shimmer`).
- **Dual Mode Flexibility**: In-app mode toggle (`[ ✨ Seamless AI ]` vs `[ 📋 Prompt Copy/Paste ]`) across Session, Review, and Practice screens. Users without API keys remain on Prompt mode, while users with keys can switch between modes at any time.

## User Experience Impact
- **Zero-Friction Voice Sessions**: Record speech directly in rip-it-out and receive structured improvements & follow-up questions automatically in seconds.
- **Native Pronunciation Listening**: Tap `🔊 Audio Playback` on any construction or example sentence to hear natural spoken audio.
- **Privacy & Custom Keys**: API keys are saved in local browser storage (and synced to user settings if Supabase is connected).

## Non-Goals
- Replacing manual prompt copy/paste entirely (it will remain 100% supported).
- Building custom backend server proxies (all calls execute directly client-side via fetch/Web APIs).
