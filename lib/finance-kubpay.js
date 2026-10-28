const COOKIE = "kubpay_session";
const SESSION_SECONDS = 24 * 60 * 60;

function send(res, status, body) {
  return res.status(status).setHeader("Cache-Control", "no-store").json(body);
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host.toLowerCase() === String(host).toLowerCase(); }
  catch { return false; }
}
function baseUrl() {
  const raw = process.env.KUBPAY_API_BASE_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const local = ["localhost", "127.0.0.1"].includes(u.hostname);
    if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return null;
    if (u.username || u.password || u.search || u.hash) return null;
    return u.toString().replace(/\/+$/, "");
  } catch { return null; }
}
function getSession(req) {
  const header = req.headers.cookie || "";
  const part = header.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  if (!part) return null;
  try { return decodeURIComponent(part.slice(COOKIE.length + 1)); } catch { return null; }
}
function setSession(res, token) {
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/api/finance; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/api/finance; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 12000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}
async function kubpay(path, token, options = {}) {
  const root = baseUrl();
  if (!root) {
    const e = new Error("KubPay bridge is not configured. Set KUBPAY_API_BASE_URL to the HTTPS KubPay server URL in Vercel server environment variables.");
    e.status = 503;
    throw e;
  }
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  const response = await fetch(root + path, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(12000)
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: "KubPay returned invalid JSON" }; }
  return { ok: response.ok, status: response.status, data };
}
export { COOKIE, send, sameOrigin, baseUrl, getSession, setSession, clearSession, readJson, kubpay };
