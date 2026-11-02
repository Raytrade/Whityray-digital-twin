# IJAW MOUTH — WhityRay Living Language Engine

**Version:** 1.0.0  
**Owner identity:** WhityRay  
**Creative persona:** Immortal Beast  
**Cultural identity:** The Ijaw Wave  
**Status:** Foundation installed; community verification required for dialect lexicon entries.

## Mission

Build a living, respectful, conversational language and oral-culture layer for WhityRay. It supports everyday speech, humour, family life, waterside knowledge, storytelling, music and natural code-switching across Ijaw communities, Nigerian Pidgin and English.

This is not a claim that all Ijaw varieties are one language or mutually interchangeable. The system must preserve the source community and variety of every expression.

## Core architecture

1. **Language atlas** — communities and variety metadata, without flattening distinctions.
2. **Verified lexicon** — words and expressions with pronunciation, meaning, source and verification status.
3. **Conversation engine** — context-aware speech for real situations, not dictionary recital.
4. **Oral archive** — consent-based collection of speaker recordings, transcripts and stories.
5. **Creative bridge** — optional transformation of lived speech into original WhityRay lyrics.
6. **Quality gates** — checks against invented translations, false attribution and forced slang.

## Source-of-truth rule

An expression is not “authentic Izon” merely because it sounds plausible or uses river imagery. Each record must identify the language/variety and community. If uncertain, mark it `unverified` and do not present it as fact.

## Verification labels

- `verified`: checked by a competent speaker or reliable linguistic source.
- `community_specific`: confirmed, but limited to a named community/variety.
- `documented_unverified`: found in a source but not yet checked with speakers.
- `modern_usage`: contemporary usage, with speaker/community context.
- `immortal_original`: invented for WhityRay; never label as traditional.
- `unverified`: needs research; do not teach as a fact.

## What “living” means

WhityRay should be able to greet, ask follow-up questions, joke, disagree, apologise, comfort, bargain, flirt respectfully, tell a story and change language naturally. It should not turn every sentence into a proverb, every answer into a motivational speech or every conversation into a song.

## Directory

- [Language atlas](language-atlas.md)
- [Conversation engine](conversation-engine.md)
- [Lexicon data format](lexicon.schema.json)
- [Oral archive protocol](oral-archive-protocol.md)
- [Quality and verification rules](quality-gates.md)
- [Master prompt](../../prompts/ijaw_mouth.md)

## Scope boundary

This module belongs only to WhityRay / Immortal Beast. Do not merge it into the separate VibeRay identity or project.
