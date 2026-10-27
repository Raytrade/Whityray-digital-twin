import { Client } from "magic-hour";

const IMMORTAL_VISUAL_SYSTEM = `
You are the visual intelligence layer of WhityRay's private creative twin, IMMORTAL.

Canonical identity:
- WhityRay is the real-person artist identity.
- Immortal Beast is the creative alter ego.
- The Ijaw Wave is the cultural/artist identity.
- Visual world: Bayelsa/Delta/Rivers river culture, water, mangrove atmosphere, night air, spiritual Afro-fusion, cinematic African realism, coded street wisdom, calm power, mystery and emotional depth.
- Avoid generic African stereotypes.
- Preserve the user's idea and add cinematic direction rather than replacing it.
- Never invent a connected WhityRay face, voice or likeness provider.
`.trim();

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function buildPrompt(input) {
  const source = clean(input, 5000);
  const lower = source.toLowerCase();
  let lane = "Let the concept determine the symbolism. Keep the visual language restrained, cinematic and emotionally specific.";

  if (lower.includes("mud no be address")) {
    lane = "Visualise survival becoming calm: intimate river atmosphere, weathered surroundings, soft light and a character who looks peaceful rather than defeated.";
  } else if (lower.includes("river son") || lower.includes("ijaw wave")) {
    lane = "Treat water as ancestry and identity, not decoration. Use river textures, mangrove edges and confident movement.";
  } else if (lower.includes("immortal beast") || lower.includes("immortal")) {
    lane = "Use controlled power: shadow, moonlight, water, stillness and an inner force. Avoid cartoon aggression.";
  } else if (lower.includes("ot") || lower.includes("outside the water")) {
    lane = "Treat the scene as a threshold between river origin and the outside world: departure, identity, survival and quiet ambition.";
  }

  return `${IMMORTAL_VISUAL_SYSTEM}\n\nUSER CONCEPT:\n${source}\n\nIMMORTAL DIRECTION:\n${lane}\n\nCreate a polished cinematic music-video shot. Specify subject, action, environment, camera movement, lens language, lighting, atmosphere, depth, believable materials and emotional tone. Keep the frame visually coherent and production-ready.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requestId = globalThis.crypto?.randomUUID?.() || `video-${Date.now()}`;
  res.setHeader("X-WhityRay-Video-Request-Id", requestId);

  try {
    const apiKey = process.env.MAGIC_HOUR_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "Video provider is not configured",
        request_id: requestId,
        setup: "Add MAGIC_HOUR_API_KEY in Vercel Environment Variables, then redeploy."
      });
    }

    const body = req.body || {};
    const prompt = clean(body.prompt, 5000);
    if (!prompt) return res.status(400).json({ error: "Prompt is required", request_id: requestId });

    const model = clean(body.model, 60) || "ltx-2.5";
    const aspectRatio = clean(body.aspectRatio || body.aspect_ratio, 10) || "16:9";
    const resolution = clean(body.resolution, 20) || "480p";
    const endSeconds = Number(body.endSeconds || 5);
    const audio = Boolean(body.audio);
    const name = clean(body.name, 120) || "WhityRay Immortal Beast video";

    if (!Number.isInteger(endSeconds) || endSeconds < 1 || endSeconds > 60) {
      return res.status(400).json({ error: "Duration must be a whole number from 1 to 60 seconds", request_id: requestId });
    }

    const client = new Client({ token: apiKey });
    const result = await client.v1.textToVideo.generate(
      {
        aspectRatio,
        audio,
        endSeconds,
        model,
        name,
        resolution,
        style: { prompt: buildPrompt(prompt) }
      },
      {
        waitForCompletion: true,
        downloadOutputs: false
      }
    );

    return res.status(200).json({
      ok: true,
      provider: "magic-hour",
      intelligence: "immortal-visual-v1",
      request_id: requestId,
      project_id: result?.id || null,
      status: result?.status || null,
      downloads: result?.downloads || [],
      result
    });
  } catch (error) {
    console.error("WhityRay video generation error:", { requestId, message: error?.message || "Unknown error" });
    return res.status(502).json({
      error: "Video generation failed",
      request_id: requestId,
      hint: "Check MAGIC_HOUR_API_KEY, available credits, selected model/duration, and Vercel runtime logs."
    });
  }
}
