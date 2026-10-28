import { send, sameOrigin, baseUrl, setSession, readJson, kubpay } from "../../lib/finance-kubpay.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return send(res, 403, { error: "Same-origin request required" });
  if (!baseUrl()) return send(res, 503, { error: "KubPay bridge is not configured. Add KUBPAY_API_BASE_URL as a server-only Vercel environment variable." });
  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: "Invalid or oversized request body" }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) {
    return send(res, 400, { error: "Enter a valid email and password (8–256 characters)." });
  }
  try {
    const result = await kubpay("/api/v1/login", null, { method: "POST", body: { email, password } });
    if (!result.ok) return send(res, result.status === 401 ? 401 : result.status >= 500 ? 502 : result.status, { error: result.data?.error || "KubPay login failed" });
    const token = result.data?.token;
    if (typeof token !== "string" || token.length < 20 || token.length > 8192) return send(res, 502, { error: "KubPay did not return a valid session token" });
    setSession(res, token);
    return send(res, 200, { connected: true, user: result.data?.user || null, message: "Signed in to KubPay. Balance is fetched separately from the ledger." });
  } catch (error) {
    return send(res, error.status || 502, { error: error.status ? error.message : "Could not reach KubPay. Check the server URL and service health." });
  }
}
