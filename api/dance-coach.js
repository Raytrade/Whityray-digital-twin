const MAX_IMAGE_CHARS = 1_500_000;

function extractOpenAIText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data.output || []) {
    for (const block of item.content || []) {
      if (block.type === "output_text" && block.text) parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const imageData = typeof body.image_data === "string" ? body.image_data : "";
  const request = typeof body.request === "string" ? body.request.slice(0, 2000) : "";
  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ error: "A valid JPEG, PNG, or WebP image is required." });
  if (imageData.length > MAX_IMAGE_CHARS) {
    return res.status(413).json({ error: "Image is too large. Try again with a smaller frame." });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const prompt = [
    "You are Immortal, the supportive dance coach for WhityRay / The Ijaw Wave.",
    "Describe only what is visible in this single still frame. Give practical, respectful coaching about visible posture, balance, body alignment, arm/leg placement, and safe ways to practise.",
    "Do not identify the person. Do not claim you can infer motion, rhythm, speed, timing, or a whole dance from one still image. If the full body or feet are out of frame, say so. Do not shame the dancer or overstate certainty.",
    "Give: (1) what looks promising, (2) one or two specific changes to try, (3) one simple drill. Keep it clear, encouraging, and concise.",
    request
  ].filter(Boolean).join("\n\n");

  try {
    if (process.env.OPENAI_API_KEY) {
      const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4.1-mini";
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageData, detail: "low" }
            ]
          }],
          max_output_tokens: 450
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Dance coach OpenAI error", { status: response.status, message: data.error?.message || "" });
        return res.status(502).json({ error: "The vision provider could not analyse this frame.", hint: "Check OPENAI_API_KEY, vision model access, and provider quota in deployment settings." });
      }
      const answer = extractOpenAIText(data);
      if (!answer) return res.status(502).json({ error: "The vision provider returned no coaching text." });
      return res.status(200).json({ answer, provider: "openai-vision", model });
    }

    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(process.env.GEMINI_API_KEY), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ] }],
          generationConfig: { maxOutputTokens: 450, temperature: 0.5 }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Dance coach Gemini error", { status: response.status, message: data.error?.message || "" });
        return res.status(502).json({ error: "The vision provider could not analyse this frame.", hint: "Check GEMINI_API_KEY, model access, and provider quota in deployment settings." });
      }
      const answer = (data.candidates || []).flatMap(candidate => candidate.content?.parts || []).map(part => part.text || "").join("\n").trim();
      if (!answer) return res.status(502).json({ error: "The vision provider returned no coaching text." });
      return res.status(200).json({ answer, provider: "google-gemini-vision", model });
    }

    return res.status(503).json({
      error: "Dance vision is not configured.",
      hint: "Add OPENAI_API_KEY or GEMINI_API_KEY in Vercel Environment Variables, then redeploy. The camera preview itself does not require an AI key."
    });
  } catch (error) {
    console.error("Dance coach runtime error", { message: error?.message || "Unknown error" });
    return res.status(502).json({ error: "Could not reach the vision provider.", hint: "Try again later and inspect deployment logs if the problem continues." });
  }
}
