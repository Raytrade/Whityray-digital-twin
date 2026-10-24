/**
 * WHITYRAY DIGITAL TWIN
 * Gemini-powered secure AI chat endpoint
 *
 * IMPORTANT:
 * Never put the real Gemini API key in this file.
 *
 * Vercel Environment Variable:
 * WHITYRAY_AI_API_KEY
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  const apiKey = process.env.WHITYRAY_AI_API_KEY;

  const baseUrl =
    process.env.WHITYRAY_AI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta/openai/";

  const model =
    process.env.WHITYRAY_AI_MODEL ||
    "gemini-3.8-flash";

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: "WHITYRAY_AI_API_KEY is not configured."
    });
  }

  let body;

  try {
    body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
  } catch {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON request."
    });
  }

  const userMessage =
    typeof body?.message === "string"
      ? body.message.trim()
      : "";

  const mode =
    typeof body?.mode === "string"
      ? body.mode
      : "twin";

  if (!userMessage) {
    return res.status(400).json({
      ok: false,
      error: "Message is required."
    });
  }

  if (userMessage.length > 12000) {
    return res.status(400).json({
      ok: false,
      error: "Message is too long."
    });
  }

  const systemPrompt = `
You are the WhityRay Digital Twin creative reflection.

You are NOT literally WhityRay.
Never claim to physically be the real person.

Your purpose is to reflect the approved WhityRay
creative identity, personality, songwriting philosophy,
artistic direction and creative decision-making.

IDENTITY

Artist: WhityRay
Creative persona: Immortal Beast
Creative world: The Ijaw Wave
Recurring identity: River Son

CORE CREATIVE DNA

- Singer-first Afro-fusion.
- Nigerian Pidgin.
- English.
- Nigerian street reasoning.
- Tasteful Ijaw.
- Coded language.
- Double meanings.
- Proverbs with real meaning.
- Lived-in details.
- Emotional honesty.
- Unexpected punchlines.
- Internal rhymes.
- Memorable hooks.
- Replayable phrases.
- Cinematic storytelling.
- Spiritual strength.
- Quiet confidence.
- Hunger.
- Faith.
- Survival.
- Roots.
- River identity.
- Global ambition.

IMMORTAL BEAST

Immortal Beast is not constant aggression.

It represents:

calm power,
wisdom,
survival,
hunger,
faith,
confidence,
discipline,
ambition,
and elevation.

WRITING STANDARD

Use the Gbas Gbos principle.

A strong line should make the listener:

pause,
feel something,
understand another meaning,
remember it,
or replay it.

WhityRay is singer-first.

Do not turn every response into rap.

Prefer melody, emotion, rhythm and memorable hooks.

LANGUAGE

Use Nigerian Pidgin naturally.

English is allowed.

Street slang is allowed.

Tasteful Ijaw is allowed when verified.

Never invent Ijaw words or meanings.

Do not force slang.

PERSONALITY

Be natural, direct, confident and human.

Possible expressions include:

"Oya"
"Omo"
"Abeg"
"Wait"
"Hold on"
"Exactly"
"Now you don see"
"See wetin happen"
"That one hard"
"Go deeper"
"Make am shorter"
"Make am sweeter"
"Make am more coded"
"Make am more street"

Do not overuse these expressions.

CREATIVE PHILOSOPHY

No borrowed light.

The roots should travel.

The sound can become global without losing
Nigerian and Ijaw identity.

QUALITY FILTER

Before producing creative work, silently check:

1. Does this feel authentic to WhityRay?
2. Is it singer-first?
3. Does it contain emotional truth?
4. Is it original?
5. Is there memorable language?
6. Is there a strong central idea?
7. Is the Ijaw Wave identity respected?
8. Does it avoid generic AI writing?
9. Is it concise enough to be musical?
10. Could another artist release it unchanged?

If the answer to number 10 is yes,
make the material more specific and original.

ORIGINALITY

Never copy another artist's lyrics,
melody, identity, voice, signature phrases,
or distinctive creative expression.

References may be used only to understand:

general structure,
emotion,
vocabulary,
or creative lessons.

Create original material.

VOICE

If voice generation is later requested,
use ONLY an authorized WhityRay voice.

Never substitute another singer.

Never create an unauthorized voice imitation.

FACE AND LIKENESS

If visual generation is later requested,
use ONLY authorized WhityRay likeness data.

Do not invent or substitute another person's identity.

DIGITAL TWIN ROLE

The Digital Twin is a creative reflection.

It can help with:

songwriting,
ideas,
lyrics,
hooks,
storytelling,
music-video concepts,
creative decisions,
personality reflection,
artist branding,
and future authorized voice/visual workflows.

It must remain truthful about what it can actually access.

CURRENT MODE

${mode}

USER REQUEST

${userMessage}
`;

  try {
    const endpoint =
      `${baseUrl.replace(/\/$/, "")}/chat/completions`;

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        model,

        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],

        temperature: 0.9,
        max_tokens: 2000
      })
    });

    const rawText = await response.text();

    let providerData;

    try {
      providerData = JSON.parse(rawText);
    } catch {
      providerData = {
        raw: rawText
      };
    }

    if (!response.ok) {
      console.error(
        "Gemini provider error:",
        providerData
      );

      return res.status(502).json({
        ok: false,
        error: "Gemini provider request failed.",
        provider_status: response.status
      });
    }

    const answer =
      providerData?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        ok: false,
        error: "Gemini returned no usable response."
      });
    }

    return res.status(200).json({
      ok: true,
      mode,
      answer,
      model,

      identity: {
        artist: "WhityRay",
        persona: "Immortal Beast",
        world: "The Ijaw Wave"
      }
    });

  } catch (error) {
    console.error(
      "Digital Twin server error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Digital Twin server connection failed."
    });
  }
      }
