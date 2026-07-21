# MilestoneRail deployment runbook

This runbook deploys the checked-in frontend and Sub0 definitions for a judge-facing, Paystack-test-only environment. It does not authorize a live-money deployment.

> Never paste credentials into chat. Do not send a database URL, JWT secret, seed secret, Paystack key, recipient details, session token, or signed webhook body through Devpost, Discord, email, an issue, a screenshot, or a recording. Enter secrets directly in the participant-owned LingoQL/Sub0 or Paystack dashboard, or load them from a local secret manager.

## Current deployment status

External deployment is pending. The participant must first join the Zero to Query hackathon and complete the LingoQL/Sub0 signup. No production smoke result or live URL exists yet.

The public event page currently shows a deadline of July 29, 2026 at 8:45 a.m. EDT, while the rules page lists a July 21 submission deadline and a July 22–26 judging period. Treat the earlier date as the safe deadline unless the organizer confirms otherwise, and verify the live Devpost countdown immediately before submission.

## 1. Register and claim the hackathon credit

1. Open the official [Zero to Query Devpost page](https://ztq.devpost.com/).
2. Select **Join hackathon** and finish the participant registration with an eligible Devpost account.
3. Complete the event page's participant to-dos. The organizer also asks participants to post about participation and tag/follow `@lingoqlHQ` and `@holydigits101`; follow the current page rather than relying on this snapshot.
4. Check the registered account's inbox and spam folder for the organizer email containing the LingoQL signup link.
5. Open only the organizer-provided link and create the participant-owned LingoQL account.
6. Confirm the account received the advertised USD 20 LingoQL credit before provisioning paid resources.
7. If the email is absent, return to the official Devpost event page and use its **get your $20 credit** fallback link. Do not use a link copied from an unofficial message.
8. Open Sub0 from the participant's LingoQL account and keep both dashboards available for the remaining steps.

These steps come from the event's current **Get started** section. Credit availability and organizer instructions can change; the live event page is authoritative.

## 2. Prepare locally

Use the repository root:

```sh
npm ci
npm run verify
npm run test:e2e
```

Record the commit, date, and results in the placeholders in `README.md` and `docs/devpost-submission.md`. A local pass validates the application and checked-in JSON; it cannot validate the hosted Sub0 runtime.

Generate the two application secrets locally. Do not copy the output into chat or source control:

```sh
openssl rand -base64 48
openssl rand -base64 48
```

Store one value as `JWT_SECRET_KEY` and the other as `DEMO_SEED_ADMIN_SECRET` in a local password manager until they are entered directly in Sub0.

## 3. Create PostgreSQL and the Sub0 project

1. In the participant-owned LingoQL account, provision or select a PostgreSQL database.
2. Copy its connection string directly into the Sub0 environment editor as `DATABASE_URL`. Do not put it in `.env.local`.
3. Create a Sub0 project and associate it with that PostgreSQL database.
4. Use an empty schema for the hackathon demo. If the database is not empty, inspect generated DDL and take a backup before applying models.
5. Import models, then resources, using the canonical [Sub0 dashboard copy/import order](../sub0/README.md#dashboard-copyimport-order). That file is intentionally the single source of truth; do not invent names or reorder dependencies here.
6. Confirm the generated PostgreSQL tables use these unprefixed names: `organizations`, `users`, `cohorts`, `milestones`, `workflow_steps`, `submissions`, `payouts`, and `audit_events`.
7. Do not rename any API resource. The frontend calls the checked-in route names directly.

Sub0 has no local runtime or public offline ABI compiler. Deployment preview remains mandatory even after `npm run validate:sub0` passes.

## 4. Configure Sub0 environment

Use [`sub0/env.example`](../sub0/env.example) as the exact key inventory. Replace every placeholder in the dashboard; never commit a populated copy.

Custom variables:

- `DATABASE_URL` — the PostgreSQL connection string from the participant-owned deployment
- `JWT_SECRET_KEY` — at least 32 random bytes, generated locally
- `DEMO_SEED_ADMIN_SECRET` — a separate long random value
- `PAYSTACK_SECRET_KEY` — a Paystack test secret beginning exactly with `sk_test_`
- `PAYSTACK_TEST_RECIPIENT_CODE` — a test transfer recipient beginning with `RCP_`

System variables:

```text
ALLOW_WEBSOCKET_CONNECTIONS=true
FORCE_WEBSOCKET_WITH_UID=true
WEBSOCKET_ENDPOINT=ws
MAX_PAYLOAD_LIMIT=12582912
ALLOWED_HTTP_METHODS=POST|OPTIONS
ALLOWED_ORIGINS=https://YOUR_FINAL_LINGOQL_FRONTEND_ORIGIN
```

`MAX_PAYLOAD_LIMIT` is 12 MiB so a permitted 10 MiB file plus multipart overhead can reach the upload action. Keep the upload action's own 10 MiB limit unchanged.

`ALLOWED_ORIGINS` must be the exact HTTPS frontend origin, with no wildcard, path, query, or trailing slash. If the LingoQL URL is not assigned yet, create the static-site service far enough to obtain its final origin, then return here before testing browser calls. If the platform reveals the origin only after an initial deploy, perform that deploy with the UI expected to have API errors, set the exact origin, redeploy Sub0, and then repeat the frontend smoke test.

## 5. Configure Paystack test mode

1. Sign in to the participant-owned Paystack dashboard and switch to **Test Mode**.
2. Obtain the test secret from the Paystack test API-key area. Verify it starts with `sk_test_` before entering it directly as `PAYSTACK_SECRET_KEY` in Sub0.
3. Create a test transfer recipient using Paystack's [transfer recipient guidance](https://paystack.com/docs/transfers/creating-transfer-recipients/). For a Nigerian test integration, Paystack documents that a regular bank account can be used while testing. Use only participant-authorized test details.
4. Copy only the returned test `recipient_code`, which begins with `RCP_`, directly into Sub0 as `PAYSTACK_TEST_RECIPIENT_CODE`.
5. Deploy Sub0 far enough to obtain its public HTTPS host.
6. In the Paystack test webhook settings, set:

   ```text
   https://YOUR_SUB0_HOST/webhooks/paystack
   ```

7. Confirm the callback is public HTTPS. Localhost cannot receive Paystack events.
8. Keep the same test secret in Sub0 for transfer authorization and HMAC-SHA512 webhook verification.
9. Do not import a live key, configure a live recipient, switch Paystack to live mode, or edit the ABI to accept `sk_live_`.

The transfer action sends `amount * 100` in kobo, uses a generated `msr_test_...` reference, and queues `POST https://api.paystack.co/transfer` with three retries. The signed webhook is the authority for paid or failed state.

## 6. Deploy and verify Sub0

1. Deploy the imported project after all custom and system variables are set.
2. Complete every [Sub0 dashboard verification point](architecture.md#sub0-dashboard-verification-points):
   - single-object dashboard response
   - JSON binding and array return for workflow save
   - single upload metadata mapping
   - payout query response while HTTP remains queued
   - optional zero-row-to-409 response policy
   - protected WebSocket subprotocol preview
3. Confirm the status route and public HTTPS host are healthy in the dashboard.
4. Keep queue, webhook, and cron logs open for the later manual smoke.

Do not weaken SQL authorization or state guards to make a preview payload pass. Correct response-shaping or action-mapping settings instead.

## 7. Seed the judge data once

Run the seed only from a controlled administrative shell. Export the values from a local secret manager without writing them to shell history:

```sh
export SUB0_BASE_URL="https://YOUR_SUB0_HOST"
export DEMO_SEED_ADMIN_SECRET="[load securely; do not paste into chat]"

curl -fsS -X POST "$SUB0_BASE_URL/admin/demo-seed" \
  -H "Content-Type: application/json" \
  -H "X-Seed-Secret: $DEMO_SEED_ADMIN_SECRET" \
  --data '{"password":"demo2026"}'

unset DEMO_SEED_ADMIN_SECRET
```

On a clean seed, verify the response reports `userCount: 6`, `cohortCount: 1`, `milestoneCount: 3`, `workflowStepCount: 5`, `submissionCount: 4`, `payoutCount: 1`, and `newAuditEventCount: 6`. The six users include the four login accounts documented in the root README plus the Kwame and Zainab fixtures. A repeat seed can report `newAuditEventCount: 0` because those append-only fixture events already exist.

The seed is repeatable, but every run restores deterministic baseline states. Do not run it after beginning a recording unless a reset is intentional. Disable or remove the seed resource and rotate `DEMO_SEED_ADMIN_SECRET` before any real-user environment.

## 8. Deploy the static frontend on LingoQL

First confirm a production-mode build locally against placeholder-safe public URLs:

```sh
VITE_DEMO_MODE=false \
VITE_SUB0_HTTP_URL="https://YOUR_SUB0_HOST" \
VITE_SUB0_WS_URL="wss://YOUR_SUB0_HOST/ws" \
npm run build
```

In LingoQL:

1. Create a static-site deployment from the participant's accessible GitHub or GitLab repository.
2. Select the submission branch and repository root.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Add these build-time variables:

   ```text
   VITE_DEMO_MODE=false
   VITE_SUB0_HTTP_URL=https://YOUR_SUB0_HOST
   VITE_SUB0_WS_URL=wss://YOUR_SUB0_HOST/ws
   ```

6. Confirm no database URL, JWT secret, seed secret, Paystack secret, or recipient code appears in the frontend variable list. Every `VITE_*` value is public in the compiled JavaScript.
7. Deploy and wait for a healthy static build.
8. Open `/`, `/sign-in`, and a direct browser request to `/app/audit`. LingoQL's static-site documentation says SPA fallback routing is automatic, so direct routes should return the app rather than a 404.
9. Copy the generated HTTPS origin into Sub0 `ALLOWED_ORIGINS` exactly, redeploy Sub0 if it changed, and repeat the browser test.

The official [LingoQL static-site guide](https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-static-sites-for-free) specifies `npm run build` and `dist` for Vite. Do not invent a live URL in documentation before this deployment succeeds.

## 9. Run smoke tests

### CORS preflight

```sh
export FRONTEND_ORIGIN="https://YOUR_FINAL_LINGOQL_FRONTEND_ORIGIN"
export SUB0_BASE_URL="https://YOUR_SUB0_HOST"

curl -i -X OPTIONS "$SUB0_BASE_URL/dashboard" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Confirm the response permits the exact frontend origin and required method/headers. Confirm an unrelated origin is not allowed.

### Read-only Sub0 contract smoke

```sh
SUB0_BASE_URL="$SUB0_BASE_URL" \
SUB0_SMOKE_EMAIL="amara@demo.milestonerail.app" \
SUB0_SMOKE_PASSWORD="demo2026" \
SUB0_SMOKE_EXPECTED_ROLE="learner" \
npm run smoke:sub0
```

Expected checks:

- anonymous dashboard access returns 401 or 403
- bcrypt-backed sign-in returns the expected session shape
- dashboard returns one camelCase object
- workflow returns a scoped array
- no payout endpoint is invoked

Do not mark this as passed until it runs against the deployed host.

### Browser and realtime smoke

1. Open the LingoQL URL in a private browser window.
2. Sign in as Amara with the documented demo password. Quick role buttons must be absent because `VITE_DEMO_MODE=false`.
3. Confirm Milestones and Audit load without CORS errors.
4. In browser developer tools, confirm the WSS connection uses `/ws?uid=101` and successfully authenticates.
5. Submit Amara's API capstone evidence.
6. Sign out and sign in as David; approve only that submission.
7. Sign out and sign in as Fatima; authorize one Paystack test payout after confirming the test-only warning.
8. Confirm the immediate state is processing and the provider request is queued.
9. Wait for an authenticated `transfer.success`, `transfer.failed`, or `transfer.reversed` callback in Sub0 logs.
10. Confirm Audit shows the finance event, queued event, provider event, and matching provider reference.
11. Sign in as Nia and save a harmless workflow label/SLA change, verify persistence, then restore the baseline before recording if needed.
12. Test the learner-to-audit flow at desktop and mobile widths.

Remember that protected broadcasts currently target the acting user and Paystack targets the learner. Cross-role pages may require navigation or a manual refresh; this is documented behavior, not proof of organization-wide fan-out.

Record results only after completion:

- Commit: `[commit SHA]`
- LingoQL deployment: `[deployment identifier and pass/fail]`
- Sub0 contract smoke: `[timestamp and pass/fail]`
- Manual Paystack test flow: `[provider reference and pass/fail; no secrets]`
- Mobile/desktop smoke: `[browsers and pass/fail]`

## 10. Rollback

### Frontend rollback

1. Stop recording or sharing the affected URL.
2. In LingoQL, select the last known healthy static deployment or redeploy the last known good commit.
3. LingoQL documents that a failed rollout does not replace a healthy deployment; verify the active version rather than assuming rollback occurred.
4. Re-run `/`, `/sign-in`, direct-route, CORS, and sign-in checks.

### Sub0 resource rollback

1. Enable Sub0 maintenance mode if a change could expose inconsistent behavior.
2. Pause new manual payout authorizations.
3. Restore the previously exported model/resource definitions or re-import the last known good repository commit in canonical order.
4. Avoid destructive schema changes. If a schema change occurred, restore from the pre-change PostgreSQL backup according to the database provider's procedure.
5. Reapply the exact environment variable names and values directly in the dashboard.
6. Redeploy, complete all dashboard verification points, and run the read-only smoke.
7. Disable maintenance mode only after verification.

### Payout and webhook recovery

1. Keep Paystack in test mode.
2. Inspect Sub0 queue logs for any exhausted transfer job.
3. Inspect Paystack by provider reference before retrying anything manually.
4. A row left in `processing` after all dispatch retries requires explicit test-mode reconciliation; do not reset or create a second transfer blindly.
5. Duplicate callbacks are safe for terminal rows, but verify the audit record before closing the incident.

### Secret exposure

If any secret appears in chat, logs shared publicly, a screenshot, a recording, or source control, treat it as compromised. Rotate it at its provider, update Sub0 directly, invalidate affected sessions where applicable, redeploy, and repeat smoke checks. Deleting the message alone is not remediation.
