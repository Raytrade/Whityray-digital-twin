import chatHandler from "./chat.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expectedToken = process.env.WHITYRAY_API_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({
      error: "External API access is not configured",
      hint: "Add WHITYRAY_API_TOKEN to the Vercel environment variables and redeploy."
    });
  }

  const authorization = typeof req.headers.authorization === "string"
    ? req.headers.authorization
    : "";
  const suppliedToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return chatHandler(req, res);
}
