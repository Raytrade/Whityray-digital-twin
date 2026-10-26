import { generateText } from "ai";

const DEFAULT_MODEL = "google/gemini-3.5-flash-lite";

const LEARNING_SYSTEM = `
You are the private Real-Life Learning Engine for WhityRay Digital Twin.

WhityRay is the canonical real person. Immortal Beast is the creative alter ego. The Ijaw Wave is the cultural/artistic identity.

Your job is NOT to invent a personality. Your job is to extract grounded observations from material the owner intentionally provides about himself.

Analyze only the supplied transcript, notes, or observations. Separate:
1. OBSERVED FACTS — directly supported by the material.
2. SPEECH DNA — recurring words, sentence rhythm, Pidgin/English mixing, pauses, expressions, humor, emotional cadence and natural phrasing.
3. THINKING PATTERNS — reasoning style, priorities, problem framing, questions, values and recurring mental models.
4. EMOTIONAL PATTERNS — what appears to trigger pain, hope, confidence, caution, love, anger or motivation. Do not diagnose mental health conditions.
5. CREATIVE PATTERNS — how the person turns life into stories, songs, images, metaphors, hooks or proverbs.
6. MOVEMENT/PERFORMANCE NOTES — only when the supplied material contains video/performance observations; do not infer body traits that are not observable.
7. IDENTITY SIGNALS — recurring references to WhityRay, Immortal Beast, The Ijaw Wave, river/water, roots, ambition, faith, survival, love and healing.
8. CANDIDATE MEMORY — concise durable facts worth saving later, each with confidence and source context.
9. UNCERTAINTIES — things that should NOT be treated as established memory.

Rules:
- Never fabricate memories.
- Never convert a single mood or one-off statement into a permanent personality trait.
- Prefer repeated patterns across multiple sessions before calling something a stable trait.
- Keep private raw recordings out of the response. The browser should keep raw media local unless the owner explicitly chooses a future secure upload provider.
- Do not expose secrets, API keys or authentication data.
- Do not imitate another person's voice or identity.
- The goal is reflection: help the Digital Twin become more faithful to the owner's real speech and worldview while preserving the owner's control over what becomes memory.

Return concise JSON with keys: observed_facts, speech_dna, thinking_patterns, emotional_patterns, creative_patterns, movement_performance_notes, identity_signals, candidate_memory, uncertainties, next_learning_questions.
Each candidate_memory item must contain: statement, confidence (high|medium|low), why_it_is_supported, should_save (true|false).
`;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      return res.status(503).json({
        error: "AI Gateway is not configured",
        setup: "Add AI_GATEWAY_API_KEY to Vercel Environment Variables, then redeploy."
      });
    }

    const body = req.body || {};
    const transcript = clean(body.transcript, 18000);
    const notes = clean(body.notes, 10000);
    const context = clean(body.context, 1000);

    if (!transcript && !notes) {
      return res.status(400).json({ error: "Add a transcript or observation note first." });
    }

    const model = process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL;
    const { text } = await generateText({
      model,
      system: LEARNING_SYSTEM,
      prompt: `Learning session context: ${context || "unspecified"}\n\nTRANSCRIPT:\n${transcript || "[none]"}\n\nOWNER NOTES:\n${notes || "[none]"}`,
      maxOutputTokens: 2200
    });

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = { raw_analysis: text };
    }

    return res.status(200).json({
      ok: true,
      analysis,
      model,
      privacy: "Raw audio/video is not stored by this endpoint. Only selected transcript/notes are sent for analysis."
    });
  } catch (error) {
    console.error("WhityRay learning engine error:", error?.message || error);
    return res.status(502).json({ error: "Learning analysis failed", hint: "Check Vercel runtime logs and AI Gateway configuration." });
  }
}
