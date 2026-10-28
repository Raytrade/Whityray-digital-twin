import { send, sameOrigin, clearSession } from "../../lib/finance-kubpay.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return send(res, 403, { error: "Same-origin request required" });
  clearSession(res);
  return send(res, 200, { connected: false });
}
