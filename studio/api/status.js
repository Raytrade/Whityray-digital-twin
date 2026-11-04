module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.TREBLO_API_KEY;
  if (!key) return res.status(503).json({ error: "Treblo API key is not configured." });
  const taskId = String(req.query.task_id || "");
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(taskId)) return res.status(400).json({ error: "A valid task ID is required." });
  try {
    const headers = { "Authorization": "Bearer " + key };
    const statusResponse = await fetch("https://api.treblo.com/v1/generations/status/" + encodeURIComponent(taskId), { headers });
    const statusRaw = await statusResponse.text();
    let statusData = statusRaw;
    try { statusData = JSON.parse(statusRaw); } catch {}
    if (!statusResponse.ok) return res.status(statusResponse.status).json({ error: "Treblo status request failed: " + String(statusRaw).slice(0, 300) });
    const status = typeof statusData === "string" ? statusData.replace(/^"|"$/g, "") : statusData && statusData.status;
    if (status !== "SUCCESS") return res.status(200).json({ status: status || "PROCESSING" });
    const resultResponse = await fetch("https://api.treblo.com/v1/generations/" + encodeURIComponent(taskId), { headers });
    const resultRaw = await resultResponse.text();
    let result = {};
    try { result = resultRaw ? JSON.parse(resultRaw) : {}; } catch {}
    if (!resultResponse.ok) return res.status(resultResponse.status).json({ error: "Track completed but Treblo could not return its audio URL." });
    const audioUrl = Array.isArray(result.song_paths) ? result.song_paths[0] : null;
    if (!audioUrl) return res.status(502).json({ error: "Treblo marked the task successful but returned no audio URL." });
    return res.status(200).json({ status: "SUCCESS", audio_url: audioUrl });
  } catch (e) {
    console.error("Treblo status request failed:", e && e.message ? e.message : "unknown error");
    return res.status(500).json({ error: "Status check failed. Check Vercel runtime logs." });
  }
};