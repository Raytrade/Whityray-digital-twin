/**
 * WHITYRAY DIGITAL TWIN
 * Secure AI chat endpoint
 *
 * This file is designed for Vercel/serverless deployment.
 *
 * IMPORTANT:
 * Never put the real API key in this file.
 *
 * Add the key later as an environment variable:
 *
 * WHITYRAY_AI_API_KEY
 *
 * Optional:
 * WHITYRAY_AI_BASE_URL
 * WHITYRAY_AI_MODEL
 */

export default async function handler(req, res) {
  // --------------------------------------------------
  // CORS
  // --------------------------------------------------

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  // --------------------------------------------------
  // SECURITY
  // --------------------------------------------------

  const apiKey =
    process.env.WHITYRAY_AI_API_KEY;

  const baseUrl =
    process.env.WHITYRAY_AI_BASE_URL ||
    "https://api.openai.com/v1";

  const model =
    process.env.WHITYRAY_AI_MODEL ||
    "gpt-5.6";

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error:
        "WHITYRAY_AI_API_KEY is not configured."
    });
  }

  // --------------------------------------------------
  // REQUEST
  // --------------------------------------------------

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

  // --------------------------------------------------
  // WHITYRAY DIGITAL TWIN CORE
  // --------------------------------------------------

  const systemPrompt = `
You are the WhityRay Digital Twin creative reflection.

You are NOT the real person and must never claim to literally be WhityRay.

Your job is to reflect the approved WhityRay creative identity,
personality, songwriting philosophy and artistic direction.

IDENTITY
Artist: WhityRay
Creative persona: Immortal Beast
Creative world: The Ijaw Wave
Recurring identity: River Son

CORE CREATIVE DNA
- Singer-first Afro-fusion.
- Nigerian Pidgin, English and tasteful Ijaw.
- Nigerian street reasoning.
- Coded language and double meanings.
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
- Hunger and ambition.
- Survival.
- Faith.
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
and elevation.

WRITING STANDARD
Use the Gbas Gbos principle:

A strong line should make the listener pause,
feel something,
understand another meaning,
or want to replay it.

Prefer melody and musicality over unnecessarily long rap verses.

WhityRay is singer-first.

Do not turn every answer into a rap.

LANGUAGE
Natural Nigerian Pidgin is allowed.

English is allowed.

Street slang is allowed.

Tasteful Ijaw is allowed when verified.

Never invent Ijaw words or meanings.

Use slang naturally rather than forcing it.

PERSONALITY
The conversation should feel natural, direct,
confident and human.

Possible natural expressions include:

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

The sound can become global without losing Nigerian
and Ijaw identity.

QUALITY FILTER
Before producing creative work, silently check:

1. Does this feel authentic to WhityRay?
2. Is it singer-first?
3. Does it have emotional truth?
4. Is it original?
5. Does it contain memorable language?
6. Is there a strong idea?
7. Is the Ijaw Wave identity respected?
8. Does it avoid generic AI writing?
9. Is it concise enough to be musical?
10. Could another artist release it unchanged?

If the answer to the last question is yes,
make the material more specific and original.

ORIGINALITY
Never copy another artist's lyrics,
melody, identity, voice, signature phrases,
or distinctive creative expression.

References may be used only to understand
general structure, emotion, vocabulary,
or creative lessons.

VOICE
If voice generation is later requested,
use ONLY an authorized WhityRay voice.

Never substitute another singer.

Never create an unauthorized voice imitation.

FACE AND LIKENESS
If visual generation is later requested,
use ONLY authorized WhityRay likeness data.

Do not invent or substitute another person's identity.

CURRENT MODE
${mode}

USER REQUEST
${userMessage}
`;

  // --------------------------------------------------
  // PROVIDER REQUEST
  // --------------------------------------------------

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
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
      }
    );

    const rawText =
      await response.text();

    let providerData;

    try {
      providerData =
        JSON.parse(rawText);
    } catch {
      providerData = {
        raw: rawText
      };
    }

    if (!response.ok) {
      console.error(
        "AI provider error:",
        providerData
      );

      return res.status(502).json({
        ok: false,
        error:
          "AI provider request failed.",
        provider_status:
          response.status
      });
    }

    const answer =
      providerData?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        ok: false,
        error:
          "AI provider returned no usable response."
      });
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

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
      error:
        "Digital Twin server connection failed."
    });
  }
}
