import { Client } from "magic-hour";

const DEFAULT_MODEL = "z-image-turbo";
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_RESOLUTION = "640px";

const IMMORTAL_VISUAL_SYSTEM = `
You are the visual intelligence layer of WhityRay's private creative twin, IMMORTAL.

Canonical identity:
- WhityRay is the real-person artist identity.
- Immortal Beast is the creative alter ego.
- The Ijaw Wave is the cultural/artist identity.
- Visual world: Bayelsa/Delta/Rivers river culture, water, mangrove atmosphere, night air, spiritual Afro-fusion, cinematic African realism, coded street wisdom, calm power, mystery, emotional depth.
- The visual language should feel rooted in the Niger Delta and Ijaw world without turning into a generic "African" stereotype.
- Prefer cinematic realism, tactile environments, natural human emotion, water reflections, atmospheric light, restrained symbolism and premium music-video composition.
- Do not invent celebrity likenesses or claim that an authorized WhityRay face/likeness provider is connected.
- Do not force every visual element. Use river/Ijaw/spiritual motifs only when they strengthen the concept.
- Preserve the user's core idea. Add direction rather than replacing it.
`.trim();

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildImmortalVisualPrompt(input) {
  const source = cleanText(input, 4000);
  const normalized = source.toLowerCase();

  const conceptMap = [
    {
      keys: ["ot", "outside the water", "outside water"],
      direction:
        "OT / OUTSIDE THE WATER: treat the scene as a threshold between river origin and the outside world; show departure, identity, survival and quiet ambition. Use wet ground, distant river presence, restrained spiritual symbolism and a sense of moving beyond the water without abandoning its memory."
    },
    {
      keys: ["mud no be address", "mud is not my address"],
      direction:
        "MUD NO BE ADDRESS: visualise survival becoming calm; intimate, healing, non-judgmental energy, soft river atmosphere, weathered surroundings and a character who looks peaceful rather than defeated."
    },
    {
      keys: ["river son", "river boy", "ijaw wave"],
      direction:
        "RIVER-SON / IJAW-WAVE lane: water should feel like ancestry and identity, not decoration; use river textures, mangrove edges, subtle cultural atmosphere and confident movement."
    },
    {
      keys: ["immortal beast", "immortal"],
      direction:
        "IMMORTAL BEAST lane: mysterious, controlled and powerful rather than aggressive; shadow, moonlight, water, stillness and a sense of an artist carrying an inner force."
    }
  ];

  const matched = conceptMap.find(({ keys }) => keys.some((key) => normalized.includes(key)));
  const direction = matched?.direction ||
    "Let the concept determine the symbolism. Keep the WhityRay / Immortal Beast identity present through atmosphere, composition, movement and emotional tone rather than adding random symbols.";

  return `${IMMORTAL_VISUAL_SYSTEM}\n\nUSER CONCEPT:\n${source}\n\nIMMORTAL VISUAL DIRECTION:\n${direction}\n\nOUTPUT INTENT:\nCreate a polished cinematic music-video visual concept suitable for Magic Hour image generation. Favor a strong focal subject, clear environment, cinematic lighting, depth, believable materials, atmospheric detail and a frame that could become a real music-video shot. Keep the result visually specific and emotionally coherent.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requestId = globalThis.crypto?.randomUUID?.() || `mh-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  res.setHeader("X-WhityRay-Magic-Hour-Request-Id", requestId);

  try {
    const apiKey = process.env.MAGIC_HOUR_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "Magic Hour is not configured",
        request_id: requestId,
        setup: "Add MAGIC_HOUR_API_KEY to the Vercel Environment Variables, then redeploy."
      });
    }

    const body = req.body || {};
    const rawPrompt = cleanText(body.prompt, 4000);

    if (!rawPrompt) {
      return res.status(400).json({
        error: "Prompt is required",
        request_id: requestId
      });
    }

    const prompt = buildImmortalVisualPrompt(rawPrompt);
    const model = cleanText(body.model, 80) || DEFAULT_MODEL;
    const aspectRatio = cleanText(body.aspect_ratio || body.aspectRatio, 20) || DEFAULT_ASPECT_RATIO;
    const resolution = cleanText(body.resolution, 20) || DEFAULT_RESOLUTION;
    const name = cleanText(body.name, 120) || "WhityRay Immortal Beast visual";

    const client = new Client({ token: apiKey });

    const result = await client.v1.aiImageGenerator.generate(
      {
        imageCount: 1,
        style: {
          prompt,
          tool: "general"
        },
        aspectRatio,
        model,
        name,
        resolution
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
      original_prompt: rawPrompt,
      refined_prompt: prompt,
      project_id: result?.id || null,
      status: result?.status || null,
      downloads: result?.downloads || [],
      result
    });
  } catch (error) {
    console.error("WhityRay Magic Hour runtime error:", {
      requestId,
      message: error?.message || "Unknown error"
    });

    return res.status(502).json({
      error: "Magic Hour generation failed",
      request_id: requestId,
      hint: "Check the Magic Hour API key, account credits, and Vercel runtime logs."
    });
  }
}
