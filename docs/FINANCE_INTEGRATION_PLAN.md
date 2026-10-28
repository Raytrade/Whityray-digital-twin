# Finance, Earnings & Live Reflection Integration Plan

## Current verified state
- The Digital Twin has a browser-based Finance & Live Reflection dashboard at `/finance.html`.
- Reflection notes are stored only in the visitor's browser localStorage and can be exported; this is not server-side memory.
- The dashboard intentionally shows no balance and keeps financial actions disabled until authenticated backend endpoints are integrated.
- The Global Distribution Desk prepares metadata and links to distribution services; it does not deliver audio worldwide by itself.
- KubPay must be inspected and tested before any Digital Twin connection is described as live.

## Required architecture
1. Browser UI calls only Digital Twin server-side API routes; it never receives provider secrets.
2. Digital Twin backend authenticates the user and checks the founder role on every protected request.
3. Backend calls KubPay over an authenticated, server-to-server connection.
4. KubPay ledger is the source of truth for wallet balances and transaction history.
5. Deposit credit requires a verified provider event or provider-side status lookup, reference/amount/currency matching, and idempotent ledger posting.
6. Withdrawal flow: create request -> enforce limits -> risk/approval checks -> submit to provider -> reconcile actual provider status. Never report success from request acceptance alone.
7. All money mutations require audit events, replay protection, rate limiting and clear PROCESSING / SUCCESS / FAILED / UNKNOWN states.

## Proposed server-only environment variables (names must be matched to the actual KubPay implementation)
- `KUBPAY_API_BASE_URL`
- `KUBPAY_SERVICE_TOKEN` (only if KubPay implements service-token authentication)
- `FINANCE_FEATURE_ENABLED=false` by default
- Provider credentials remain in KubPay's server environment.

Never put secrets in client-side JavaScript, public files, screenshots, chat messages or Git history.

## Release gates
- Inspect actual KubPay routes, auth middleware, ledger and webhook implementation.
- Add contract tests and sandbox tests, including duplicate webhook delivery and wrong amount/currency.
- Verify user identity and founder authorization.
- Confirm transfer limits and approval rules are enforced by KubPay itself, not merely by the UI.
- Test rollback/reconciliation and provider timeouts.
- Enable live mode only after explicit owner review and applicable Nigerian regulatory/compliance checks.
