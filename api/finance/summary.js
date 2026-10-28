import { send, baseUrl, getSession, clearSession, kubpay } from "../../lib/finance-kubpay.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  if (!baseUrl()) return send(res, 503, { error: "KubPay bridge is not configured." });
  const token = getSession(req);
  if (!token) return send(res, 401, { error: "Sign in to KubPay first." });
  try {
    const results = await Promise.all([
      kubpay("/api/v1/me", token),
      kubpay("/api/v1/balance", token),
      kubpay("/api/v1/transactions", token),
      kubpay("/api/v1/payouts", token)
    ]);
    if (results.some(r => r.status === 401)) {
      clearSession(res);
      return send(res, 401, { error: "KubPay session expired. Please sign in again." });
    }
    const failed = results.find(r => !r.ok);
    if (failed) return send(res, 502, { error: "KubPay could not return all account data. No balance has been assumed.", provider_status: failed.status });
    const me = results[0].data || {};
    const balance = results[1].data || {};
    const transactions = results[2].data?.transactions || [];
    const payouts = results[3].data?.payouts || [];
    return send(res, 200, {
      connected: true,
      user: { id: me.id, email: me.email, role: me.role },
      balance: { currency: balance.currency || "NGN", available_kobo: balance.available_kobo, reserved_kobo: balance.reserved_kobo, available_naira: balance.available_naira },
      transactions, payouts,
      payouts_enabled: process.env.FINANCE_ENABLE_PAYOUTS === "true" && me.role === "FOUNDER"
    });
  } catch {
    return send(res, 502, { error: "KubPay request failed or timed out. The dashboard has not changed your money." });
  }
}
