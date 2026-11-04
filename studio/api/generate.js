module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.TREBLO_API_KEY;
  if (!key) return res.status(503).json({ error: "Treblo API key is not configured for this deployment." });
  try {
    const { prompt = "", lyrics = "", instrumental = false, output_format = "mp3" } = req.body || {};
    const idea = String(prompt).trim();
    const words = String(lyrics).trim();
    if (!idea && !words) return res.status(400).json({ error: "Add a song idea or lyrics." });
    const safeFormat = ["mp3", "wav", "m4a", "ogg", "flac"].includes(output_format) ? output_format : "mp3";
    const identity = "Original WhityRay sound: melody-first emotional Afro-fusion, soulful intimate lead vocal, natural Nigerian English and Pidgin phrasing with tasteful Ijaw touches, warm Afrobeats groove, subtle highlife percussion and atmospheric soulful textures. Keep the vocal melodic and human, not rap-led.";
    const payload = { prompt: [identity, idea].filter(Boolean).join(". "), output_format: safeFormat, instrumental: Boolean(instrumental) };
    if (words && !instrumental) payload.lyrics = words.slice(0, 12000);
    const upstream = await fetch("https://api.treblo.com/v1/generations/v3", {
      method: "POST", headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const raw = await upstream.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw.slice(0, 500) }; }
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.message || data.error || "Treblo rejected the request." });
    if (!data.task_id) return res.status(502).json({ error: "Treblo did not return a task ID." });
    return res.status(200).json({ task_id: data.task_id });
  } catch (e) {
    console.error("Treblo generation request failed:", e && e.message ? e.message : "unknown error");
    return res.status(500).json({ error: "Generation request failed. Check Vercel runtime logs." });
  }
};