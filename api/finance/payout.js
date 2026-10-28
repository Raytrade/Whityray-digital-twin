import { send, sameOrigin, baseUrl, getSession, kubpay, readJson } from "../../lib/finance-kubpay.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return send(res, 403, { error: "Same-origin request required" });
  if (process.env.FINANCE_ENABLE_PAYOUTS !== "true") return send(res, 403, { error: "Payouts are locked. The owner must explicitly enable FINANCE_ENABLE_PAYOUTS after test-mode verification." });
  if (!baseUrl()) return send(res, 503, { error: "KubPay bridge is not configured." });
  const token = getSession(req);
  if (!token) return send(res, 401, { error: "Sign in to KubPay first." });
  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: "Invalid or oversized request body" }); }
  const idempotencyKey = String(req.headers["idempotency-key"] || "");
  if (!/^[A-Za-z0-9._:-]{12,120}$/.test(idempotencyKey)) return send(res, 400, { error: "A unique Idempotency-Key is required." });
  const amount = Number(body.amount_naira);
  const accountNumber = String(body.account_number || "").trim();
  const bankCode = String(body.bank_code || "").trim();
  const accountName = String(body.account_name || "").trim().slice(0, 120);
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100 || amount > 50000) return send(res, 400, { error: "Enter a valid amount up to ₦50,000 per transfer." });
  if (!/^\d{10}$/.test(accountNumber) || !/^[A-Za-z0-9_-]{2,20}$/.test(bankCode)) return send(res, 400, { error: "Check the 10-digit account number and bank code." });
  try {
    const me = await kubpay("/api/v1/me", token);
    if (me.status === 401) return send(res, 401, { error: "KubPay session expired. Sign in again." });
    if (!me.ok || me.data?.role !== "FOUNDER") return send(res, 403, { error: "Founder authorization is required for payout requests." });
    const result = await kubpay("/api/v1/payouts", token, { method: "POST", idempotencyKey, body: {
      account_number: accountNumber, bank_code: bankCode, account_name: accountName,
      amount_kobo: Math.round(amount * 100), reason: "WhityRay Digital Twin payout request"
    }});
    if (!result.ok) return send(res, result.status >= 500 ? 502 : result.status, { error: result.data?.error || "KubPay did not accept the payout request." });
    return send(res, 202, { accepted: true, payout: result.data, message: "KubPay accepted the request. This is not proof that the bank transfer succeeded; check the final provider-confirmed status." });
  } catch {
    return send(res, 502, { error: "KubPay request failed or timed out. Check the payout status before retrying." });
  }
}
