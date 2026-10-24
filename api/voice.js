export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "ElevenLabs is not configured",
      hint: "Add ELEVENLABS_API_KEY in your deployment environment variables, then redeploy."
    });
  }

  const body = req.body || {};
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const voiceId = typeof body.voice_id === "string"
    ? body.voice_id.trim()
    : (process.env.ELEVENLABS_VOICE_ID || "").trim();

  if (!text) return res.status(400).json({ error: "Enter text to speak." });
  if (text.length > 5000) {
    return res.status(413).json({ error: "Text is too long. Maximum is 5,000 characters." });
  }
  if (!voiceId || !/^[a-zA-Z0-9_-]{2,128}$/.test(voiceId)) {
    return res.status(400).json({
      error: "A valid voice ID is required.",
      hint: "Copy the ID of your authorized WhityRay voice from ElevenLabs and enter it in the Voice panel."
    });
  }

  try {
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voiceId) + "?output_format=mp3_44100_128",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: modelId
        })
      }
    );

    if (!response.ok) {
      const providerMessage = await response.text().catch(() => "");
      console.error("ElevenLabs TTS request failed", {
        status: response.status,
        detail: providerMessage.slice(0, 500)
      });
      return res.status(response.status === 401 || response.status === 403 ? 502 : 502).json({
        error: "ElevenLabs could not generate speech.",
        provider_status: response.status,
        hint: response.status === 401 || response.status === 403
          ? "Check the key permissions and account access. Confirm Text to Speech is enabled."
          : response.status === 429
            ? "The account may have reached its quota or rate limit. Check ElevenLabs usage and billing."
            : "Check the voice ID, model access, and ElevenLabs request log."
      });
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", String(audio.length));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (error) {
    console.error("ElevenLabs runtime error", { message: error?.message || "Unknown error" });
    return res.status(502).json({
      error: "Could not reach ElevenLabs.",
      hint: "Check deployment logs and try again."
    });
  }
}
