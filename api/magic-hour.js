import { Client } from "magic-hour";

const DEFAULT_MODEL = "z-image-turbo";
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_RESOLUTION = "640px";

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
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
    const prompt = cleanText(body.prompt, 4000);

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
        request_id: requestId
      });
    }

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
      request_id: requestId,
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
