export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.TREBLO_API_KEY;
  if (!key) return res.status(503).json({ error: "Studio is not connected yet. Add TREBLO_API_KEY to this Vercel project's encrypted environment variables." });
  try {
    const { prompt = "", lyrics = "", instrumental = false, output_format = "mp3" } = req.body || {};
    if (!String(prompt).trim() && !String(lyrics).trim()) return res.status(400).json({ error: "Add a song idea or lyrics." });
    const safeFormat = ["mp3", "wav", "m4a", "ogg", "flac"].includes(output_format) ? output_format : "mp3";
    const identity = "Original WhityRay sound: melody-first emotional Afro-fusion, soulful and intimate lead vocal, natural Nigerian English and Pidgin phrasing with tasteful Ijaw touches when fitting, warm Afrobeats groove, subtle highlife percussion and atmospheric soulful textures. Keep the vocal melodic and human, not rap-led. Do not imitate or name any existing artist.";
    const payload = { prompt: [identity, String(prompt).trim()].filter(Boolean).join(". "), instrumental: Boolean(instrumental), output_format: safeFormat, enable_streaming: false };
    if (String(lyrics).trim() && !instrumental) payload.lyrics = String(lyrics).slice(0, 12000);
    const upstream = await fetch("https://api.treblo.com/v1/generations/v3", {
      method: "POST", headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.message || data.error || "Treblo rejected the request." });
    if (!data.task_id) return res.status(502).json({ error: "Treblo did not return a task ID." });
    return res.status(200).json({ task_id: data.task_id });
  } catch (e) { return res.status(500).json({ error: "Generation request failed. Please try again." }); }
}