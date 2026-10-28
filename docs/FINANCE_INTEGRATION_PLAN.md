# Finance, Earnings & Live Reflection Integration Plan

## Current verified state
- The Digital Twin has a browser-based Finance & Live Reflection dashboard at `/finance.html`.
- Reflection notes are stored only in the visitor's browser localStorage and can be exported; this is not server-side memory.
- Server-side login, balance/ledger proxy, logout and a gated founder-only payout-request endpoint now exist in code. They are not live until `KUBPAY_API_BASE_URL` is configured and tested.
- The dashboard displays no fake balance: it only renders values returned by authenticated KubPay endpoints.
- Payout requests remain locked unless `FINANCE_ENABLE_PAYOUTS=true` is set in Vercel server-side environment variables; do not enable this before test-mode verification.
- The Global Distribution Desk prepares metadata and links to distribution services; it does not deliver audio worldwide by itself.
- KubPay's currently inspected API exposes `/health`, `/ready`, `/api/v1/login`, `/api/v1/me`, `/api/v1/balance`, `/api/v1/transactions`, `/api/v1/payouts` and admin approval routes. The Digital Twin bridge has not yet been tested end-to-end against a deployed KubPay server.
- The inspected KubPay webhook handles transfer success/failure/reversal events; incoming earnings/deposit credits are not yet implemented. AI must never create its own wallet credit.

## Required architecture
1. Browser UI calls only Digital Twin server-side API routes; it never receives provider secrets.
2. Digital Twin backend authenticates the user and checks the founder role on every protected request.
3. Backend calls KubPay over an authenticated, server-to-server connection.
4. KubPay ledger is the source of truth for wallet balances and transaction history.
5. Deposit credit requires a verified provider event or provider-side status lookup, reference/amount/currency matching, and idempotent ledger posting.
6. Withdrawal flow: create request -> enforce limits -> risk/approval checks -> submit to provider -> reconcile actual provider status. Never report success from request acceptance alone.
7. All money mutations require audit events, replay protection, rate limiting and clear PROCESSING / SUCCESS / FAILED / UNKNOWN states.

## Server-only Vercel environment variables
- `KUBPAY_API_BASE_URL` — the deployed KubPay HTTPS origin, without `/api/v1` at the end. Do not guess this URL; use the actual deployed server URL.
- `FINANCE_ENABLE_PAYOUTS=false` — keep false until login, balance, ledger, role checks, payout approval and provider reconciliation have been tested.
- KubPay's `JWT_SECRET`, `DATABASE_URL` and `PAYSTACK_SECRET_KEY` remain only in KubPay's server environment. Never copy them into the Digital Twin project or browser.

Never put secrets in client-side JavaScript, public files, screenshots, chat messages or Git history.

## Release gates
- Configure the actual KubPay HTTPS URL in Vercel Environment Variables, then redeploy and verify login, balance, transactions and logout.
- Add rate limiting and security monitoring to the login bridge before production financial use.
- Inspect and test the actual KubPay routes, auth middleware, ledger and webhook implementation.
- Add contract tests and sandbox tests, including duplicate webhook delivery and wrong amount/currency.
- Verify user identity and founder authorization.
- Confirm transfer limits and approval rules are enforced by KubPay itself, not merely by the UI.
- Test rollback/reconciliation and provider timeouts.
- Implement a separate verified incoming-payment/royalty ingestion flow before claiming AI earnings can credit wallets. Match provider reference, expected amount/currency and beneficiary; post once using idempotency and audit records.
- Enable live payout requests only after explicit owner review and applicable Nigerian regulatory/compliance checks.
