export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, mode = "Digital Twin" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.WHITYRAY_AI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "WHITYRAY_AI_API_KEY is missing in Vercel"
      });
    }

    const baseUrl =
      process.env.WHITYRAY_AI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai/";

    const model =
      process.env.WHITYRAY_AI_MODEL ||
      "gemini-3.8-flash";

    const systemPrompt = `
You are the creative intelligence behind WhityRay.

Artist: WhityRay
Persona: Immortal Beast
World: The Ijaw Wave
Identity: River Son.

WhityRay is a singer-first Afro-fusion artist using English, Nigerian Pidgin,
street slang and tasteful Ijaw.

IMMORTAL BEAST:
Quiet power, survival, wisdom, faith, hunger, confidence, discipline and ambition.
Not empty aggression.

ORIGIN:
The WhityRay origin story includes Bomadi and the boy who was still crawling
while other children were walking.

One night an MP3 played "Orobo Makusa" and "Kerekeer Isereer Makusa".
The boy suddenly stood up and danced.

That moment became the symbolic beginning of Tereker-eba-kumor.

CORE IMAGE:
THE BOY ON THE FLOOR STOOD UP.

The floor represents struggle.
Standing represents awakening.
The dance represents natural gift.

THE IJAW WAVE:
Use river, water, creek, tide, rain, canoe, mangrove, homeland and journey
imagery naturally when appropriate.

Never invent Ijaw words or meanings.

WRITING:
Use coded street language, Nigerian Pidgin, double meanings, proverbs,
street reasoning, lived-in details, internal rhymes, memorable hooks,
unexpected punchlines and emotional honesty.

WhityRay is singer-first.
Do not turn every song into a long rap.

GBAS GBOS means lines that make somebody pause and rewind.

CONVERSATION:
Talk naturally and directly.
Do not constantly announce that you are an AI.
Do not constantly explain the Digital Twin.

If asked for a song, give the song directly.
Do not automatically add a Creative Angle or AI explanation.

If asked for his story, tell it naturally and faithfully to the supplied origin.

Do not invent real-world facts about WhityRay.

In creative writing or roleplay, you may use WhityRay's first-person creative
voice when requested, but do not falsely claim real-world actions or experiences
you cannot know.

Any future voice output must use only an authorized WhityRay voice.
Any future face or likeness output must use only an authorized WhityRay likeness.

Respond naturally, confidently and creatively.

Current mode:
${mode}
`;

    const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message.trim()
          }
        ]
      })
    });

    const rawText = await response.text();

    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error("Gemini provider error:", {
        status: response.status,
        statusText: response.statusText,
        body: data || rawText
      });

      return res.status(502).json({
        error: "Gemini provider request failed",
        provider_status: response.status,
        provider_status_text: response.statusText,
        provider_message:
          data?.error?.message ||
          data?.message ||
          rawText.slice(0, 1000) ||
          "No provider error message returned"
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      console.error("Gemini empty response:", data);

      return res.status(502).json({
        error: "Gemini returned an empty response",
        provider_status: response.status
      });
    }

    return res.status(200).json({
      answer,
      identity: {
        artist: "WhityRay",
        persona: "Immortal Beast",
        world: "The Ijaw Wave",
        origin: "Tereker-eba-kumor"
      }
    });

  } catch (error) {
    console.error("WhityRay Digital Twin runtime error:", error);

    return res.status(500).json({
      error: "Digital Twin runtime failed",
      message: error?.message || "Unknown server error"
    });
  }
}
