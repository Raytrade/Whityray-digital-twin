const API = "https://gen.daydream.live/v1";
function clean(value, max = 400) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
async function callDaydream(path, init = {}) {
  const key = process.env.DAYDREAM_API_KEY;
  if (!key) { const e = new Error("Daydream is not configured. Add DAYDREAM_API_KEY in Vercel Environment Variables and redeploy."); e.status = 503; throw e; }
  const r = await fetch(API + path, { ...init, headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", ...(init.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.message || data.error || "Daydream request failed."); e.status = r.status; throw e; }
  return data;
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = req.body || {};
    if (b.task === "usage") return res.status(200).json(await callDaydream("/usage"));
    if (b.task === "status") {
      const id = clean(b.id, 100);
      if (!/^sng_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "Valid song ID required." });
      return res.status(200).json(await callDaydream("/songs/" + encodeURIComponent(id)));
    }
    if (b.task !== "create") return res.status(400).json({ error: "Choose create, status or usage." });
    const prompt = clean(b.prompt, 400), duration = Number(b.duration ?? 120), bpm = Number(b.bpm ?? 100), variations = Number(b.variations ?? 1);
    if (!prompt) return res.status(400).json({ error: "Describe the instrumental first." });
    if (!Number.isInteger(duration) || duration < 10 || duration > 120) return res.status(400).json({ error: "Duration must be 10–120 seconds." });
    if (!Number.isInteger(bpm) || bpm < 60 || bpm > 200) return res.status(400).json({ error: "BPM must be 60–200." });
    if (![1, 2].includes(variations)) return res.status(400).json({ error: "Choose one or two variations." });
    const payload = { prompt, duration, bpm, variations, loop: b.loop === true };
    const key = clean(b.key, 20); if (key) payload.key = key;
    return res.status(202).json(await callDaydream("/songs", { method: "POST", body: JSON.stringify(payload) }));
  } catch (e) {
    console.error("Daydream API error:", e.message);
    return res.status(e.status || 502).json({ error: e.message || "Daydream request failed." });
  }
}