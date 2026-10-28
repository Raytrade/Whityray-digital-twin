const PROVIDERS = [
  {
    id: "gemini",
    label: "Google Gemini / Digital Brain",
    env: ["GEMINI_API_KEY"],
    note: "Direct Gemini API route used by /api/chat."
  },
  {
    id: "ai-gateway",
    label: "Vercel AI Gateway",
    env: ["AI_GATEWAY_API_KEY"],
    note: "Used when AI_GATEWAY_ENABLED=true; direct Gemini fallback requires GEMINI_API_KEY."
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs voice",
    env: ["ELEVENLABS_API_KEY"],
    note: "Secure text-to-speech route is available at /api/voice; configuration presence does not verify credentials or quota."
  },
  {
    id: "music",
    label: "Music generation",
    env: ["SUNO_API_KEY"],
    note: "Provider slot only; use an authorized integration and never expose its key in the browser."
  },
  {
    id: "magic-hour",
    label: "Magic Hour video / visual studio",
    env: ["MAGIC_HOUR_API_KEY"],
    note: "Secure server-side video and visual generation route at /api/video and /api/magic-hour."
  },
  {
    id: "kubpay",
    label: "KubPay finance bridge",
    env: ["KUBPAY_API_BASE_URL"],
    note: "Presence only. Login and account endpoints must pass live checks; payouts remain separately gated."
  }
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const providers = PROVIDERS.map(({ id, label, env, note }) => ({
    id,
    label,
    configured: env.some((name) => Boolean(process.env[name])),
    note
  }));

  return res.status(200).json({
    identity: "WhityRay Digital Twin",
    checked_at: new Date().toISOString(),
    providers,
    finance: {
      kubpay_configured: Boolean(process.env.KUBPAY_API_BASE_URL),
      payout_requests_enabled: process.env.FINANCE_ENABLE_PAYOUTS === "true",
      note: "Configuration presence is not proof of provider health, available funds, or successful transfers."
    }
  });
}
