# MilestoneRail Sub0 backend

This directory is the version-controlled source for the PostgreSQL models and Sub0 ABI resources used by MilestoneRail. The JSON follows the current syntax in `https://docs.lingoql.com/llms.txt`; every JSON file is strict JSON.

## Dashboard copy/import order

1. Create a Sub0 project and attach a PostgreSQL database. Use an empty schema or review the generated DDL before applying these models.
2. In the model editor, create one model with the exact table name shown below and paste only the contents of the matching file, in this order:
   1. `organizations` ← `models/organizations.json`
   2. `users` ← `models/users.json`
   3. `cohorts` ← `models/cohorts.json`
   4. `milestones` ← `models/milestones.json`
   5. `workflow_steps` ← `models/workflow_steps.json`
   6. `submissions` ← `models/submissions.json`
   7. `payouts` ← `models/payouts.json`
   8. `audit_events` ← `models/audit_events.json`
3. Confirm that Sub0 generated the unprefixed PostgreSQL table names above. The SQL resources intentionally use those exact names.
4. In the API/ABI editor, create resources and paste the files in this order:
   1. `resources/auth-sign-in.json`
   2. `resources/dashboard.json`
   3. `resources/workflows-list.json`
   4. `resources/workflows-save.json`
   5. `resources/submissions-evidence-link.json`
   6. `resources/submissions-evidence-upload.json`
   7. `resources/submissions-review.json`
   8. `resources/payouts-initiate.json`
   9. `resources/paystack-webhook.json`
   10. `resources/sla-scan.json`
   11. `resources/demo-seed.json`
5. Copy each key from `env.example` into the dashboard environment editor. Replace every `REPLACE_...` value. Restrict `ALLOWED_ORIGINS` to the deployed frontend.
6. Keep `ALLOW_WEBSOCKET_CONNECTIONS=true`, `FORCE_WEBSOCKET_WITH_UID=true`, and `WEBSOCKET_ENDPOINT=ws` so the existing frontend WebSocket client can connect with its authenticated user ID.
7. Deploy, then run the demo seed once as described below. Configure the Paystack test webhook URL as `https://YOUR_SUB0_HOST/webhooks/paystack`.

Do not rename resources: the production client calls `auth/sign-in`, `dashboard`, `workflows/list`, `workflows/save`, `submissions/evidence-link`, `submissions/evidence-upload`, `submissions/review`, and `payouts/initiate`.

## Environment and test-money safety

`JWT_SECRET_KEY`, `DEMO_SEED_ADMIN_SECRET`, the database URL, and the Paystack key are dashboard secrets. ABI files access secrets only through `$ENV`.

`PAYSTACK_SECRET_KEY` must start with `sk_test_`. The payout SQL checks that prefix before it can move a submission or create a payout, and the queued HTTP action cannot obtain its dependency values when that check fails. `scripts/validate-sub0.mjs` also rejects any `sk_live_` text. Never import a live Paystack key into this project. Use a Paystack test recipient code in `PAYSTACK_TEST_RECIPIENT_CODE`; the placeholder in `env.example` deliberately cannot transfer.

The transfer action sends the amount in kobo, queues the Paystack request, and retries it three times. The HMAC-SHA512 webhook uses the raw request body verification provided by Sub0 and only changes `queued`/`processing` rows, so duplicate callbacks cannot regress or duplicate a terminal payout. A provider request that exhausts all retries may remain `processing`; investigate the Sub0 queue logs and reconcile it in test mode.

## Demo seed

Call the seed only from an administrative environment:

```sh
curl -fsS -X POST "$SUB0_BASE_URL/admin/demo-seed" \
  -H "Content-Type: application/json" \
  -H "X-Seed-Secret: $DEMO_SEED_ADMIN_SECRET" \
  --data '{"password":"demo2026"}'
```

It is rate-limited, protected by `DEMO_SEED_ADMIN_SECRET`, hashes the submitted password with bcrypt cost 12, upserts deterministic demo rows, and inserts audit rows with `ON CONFLICT DO NOTHING`. Re-running it is idempotent but intentionally restores the demo rows to their baseline states.

Frontend demo accounts all use password `demo2026`:

- `amara@demo.milestonerail.app` — learner
- `david@demo.milestonerail.app` — mentor
- `fatima@demo.milestonerail.app` — finance
- `nia@demo.milestonerail.app` — admin

The seed also creates the non-login fixture learners Kwame and Zainab. Demo credentials are not production credentials; disable or remove the seed resource and rotate `DEMO_SEED_ADMIN_SECRET` before onboarding real users.

## Security and behavior assumptions

- JWTs contain `id`, `organizationId`, `role`, `name`, and `email`, expire after eight hours, and are signed with HS256. Protected resources re-check the caller ID, organization, active state, and role in SQL instead of trusting payload identity.
- Every tenant-owned row carries `organization_id`. Reads and writes join that value through the authenticated caller; learner reads and evidence writes also require `learner_id` ownership.
- Submission transitions use status-qualified updates. Concurrent stale evidence, review, or payout requests therefore return no row instead of overwriting a newer state.
- `audit_events` has no update or delete resource. Workflow transitions, payouts, webhooks, and the SLA scanner append events.
- Uploads are restricted to one allow-listed file of at most 10 MiB. The system payload limit is set higher to allow multipart overhead.
- `jobs/sla-scan` runs every 15 minutes with the required six-field expression `0 */15 * * * *`. Its event key prevents repeated SLA events for the same submission state/update timestamp.
- WebSocket broadcasts use the exact frontend actions `submission.updated`, `payout.updated`, and `workflow.updated`. Protected writes target only the authenticated caller; the Paystack webhook chains its idempotent update into a learner-targeted notification, so result data is never broadcast across organizations.
- PostgreSQL is expected to preserve quoted camelCase aliases. Timestamp values are cast to text because Sub0 documents that as the portable PostgreSQL response form.

## Dashboard verification required

Sub0 has no local runtime or public offline ABI compiler, so static validation cannot prove dashboard execution behavior. Before exposing the frontend, use the dashboard preview for these checks:

1. `dashboard` must return one object in `data`, not a one-element array. Its one-row SQL result has the exact `DashboardData` keys. If the project/runtime wraps one-row PostgreSQL results in an array, select the dashboard's single-record/first-result response mode for action 1.
2. `workflows/save` must bind `$PAYLOAD.steps` as JSON for PostgreSQL's `jsonb_array_elements` and return the rows as an array.
3. `submissions/evidence-upload` must pass the sole upload metadata object to action 3. If that runtime retains a one-element upload array, map `url`, `storage_key`, and `original_file_name` from index `0` in the action-chaining editor.
4. `payouts/initiate` must use query action 1 as `main_returnable` while HTTP action 2 stays queued in the background. Confirm the immediate response is the payout object rather than queue metadata.
5. A zero-row optimistic guard should be mapped to HTTP `409 Conflict` in the dashboard response/error policy if that project exposes custom zero-result status mapping. The JSON ABI itself safely performs no stale write.
6. Preview a protected WebSocket connection using subprotocols `["x-access-token", "<JWT>"]`; this is the protocol format used by the existing client.

These are response/editor integration checks, not missing authorization controls. Do not weaken the SQL guards to make a preview payload succeed.

## Local checks

Run:

```sh
node scripts/validate-sub0.mjs
```

After deployment, opt into read-only smoke checks with:

```sh
SUB0_BASE_URL=https://YOUR_SUB0_HOST \
SUB0_SMOKE_EMAIL=amara@demo.milestonerail.app \
SUB0_SMOKE_PASSWORD=demo2026 \
node scripts/smoke-sub0.mjs
```

The smoke script never invokes `payouts/initiate`. Seeding is separately opt-in through environment variables printed by `node scripts/smoke-sub0.mjs --help`.
