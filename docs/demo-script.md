# MilestoneRail 3–5 minute demo script

Target runtime: 3 minutes 45 seconds. The primary recording path uses the local deterministic demo so the complete flow is reliable and contains no external credentials. Say clearly that its provider callback is simulated. If the participant completes LingoQL/Sub0 deployment, use the deployed accounts and describe the actual Paystack test callback only when it is visibly received.

## Before the take

1. Run `npm run verify` and `npm run test:e2e`.
2. Start the local app with `VITE_DEMO_MODE=true npm run dev`.
3. Reload once to restore the baseline. Do not reload after the first learner action.
4. Open the landing page in a clean browser profile at a readable desktop size.
5. Confirm Amara's API capstone is `draft`, Kwame is awaiting mentor review, and Zainab is finance-ready.
6. Keep this script on a second screen, not in the recording.
7. Use `https://example.com/amara-api-capstone` as evidence and this note:

   ```text
   Review the deployed API workflow, authentication path, and retry behavior.
   ```

8. Close password managers, notifications, terminals containing secrets, Paystack key pages, and unrelated tabs.

## Timed script

### 0:00–0:25 — Problem

**Screen:** Landing page hero and workflow preview.

**Say:**

> Training stipends are earned through work, but the proof, approval, budget check, and payout often live in separate tools. Learners cannot see what is blocking them, while program and finance teams reconcile the same milestone repeatedly. MilestoneRail puts that entire evidence-to-payout journey on one accountable rail.

**Do:** Point briefly to Evidence submitted, Mentor review, Finance approval, Paystack test payout, and Audit receipt.

### 0:25–0:40 — Product and safety frame

**Screen:** Continue to the sign-in page.

**Say:**

> This judge flow has four roles, a visible separation of duties, and test money only. The local recording uses deterministic browser data and a simulated signed provider event; the checked-in Sub0 backend contains the real Paystack test queue and HMAC webhook path.

**Do:** Select **Continue as demo Learner**.

### 0:40–1:15 — Learner submits evidence

**Screen:** Amara's Milestones page.

**Say:**

> Amara sees each milestone, its due date, eligible amount, and current gate. Her API capstone is ready for evidence.

**Do:**

1. Select **Submit evidence**.
2. Paste the prepared URL and note.
3. Select **Send to mentor**.
4. Pause on the success notice.

**Say:**

> The submission now advances only to mentor review. In Sub0, the production resource verifies learner ownership, accepts only draft or changes-requested state, and appends the audit event in the guarded write.

### 1:15–1:50 — Mentor approval

**Screen:** Open the account menu and switch to Mentor, then search `Amara`.

**Say:**

> David's queue is role-specific and oldest-first. The evidence, learner context, and rubric stay together.

**Do:**

1. Open Amara's API capstone.
2. Point to the three checked rubric items.
3. Select **Approve milestone**.
4. Pause on the finance-ready notice.

**Say:**

> Mentor approval does not authorize payment. It moves the milestone to an independent finance gate; a stale second decision would be rejected by the submission-state guard.

### 1:50–2:30 — Finance authorizes a test payout

**Screen:** Switch to Finance and find Amara in the eligible queue.

**Say:**

> Fatima sees only mentor-approved records alongside cohort budget context. The authorization panel checks approval, learner eligibility, budget capacity, and payout idempotency.

**Do:**

1. Select **Authorize test payout**.
2. Point to the test-mode warning.
3. Check **I confirm this is a Paystack test action**.
4. Select **Authorize Paystack test**.
5. Wait for **Signed webhook received**.

**Say while waiting:**

> No real money moves. In the deployed resource, Sub0 allows only an `sk_test_` key, creates one guarded provider reference, queues the transfer with three retries, and waits for Paystack rather than marking it paid optimistically.

**After the notice:**

> Here the local demo has emitted its simulated signed callback. A deployed run should use this language only after Sub0 has verified Paystack's HMAC-SHA512 signature.

### 2:30–3:00 — Audit and provider evidence

**Screen:** Open Audit and search `msr_test_402_`.

**Say:**

> The audit view joins human and provider evidence into one chronology. We can see who submitted, who approved, who authorized, when the provider state arrived, and the reference attached to this paid test record. Paid here means a confirmed test event, not a real transfer or measured customer impact.

**Do:** Point to the provider actor, event type, learner/milestone, timestamp, and reference.

### 3:00–3:25 — Visual workflow

**Screen:** Switch to Admin, open Workflow, and select the Mentor review node.

**Say:**

> Administrators can inspect and shape the approval rail visually: role, order, active state, and SLA are explicit. Evidence, payout, and receipt remain system anchors. The Sub0 workflow resources persist the rail, and the scheduled SLA scan turns overdue stages into deduplicated audit events.

**Do:** Show the five nodes and the role/SLA inspector. Do not make a change during the primary take.

### 3:25–3:45 — Architecture, value, and close

**Screen:** Return to the landing preview or show the architecture diagram from `docs/architecture.md`.

**Say:**

> The React application is designed for LingoQL static hosting. Eleven Sub0 resources handle PostgreSQL models, JWT and role checks, uploads, action chaining, queue retries, a signed Paystack test webhook, targeted WebSockets, cron, and audit writes. MilestoneRail gives training operators one explainable path from proof to payout while giving learners visibility into every gate. The proposed business is cohort-based SaaS; the next step is participant signup, external deployment, and operator validation—not an unproven impact claim.

Stop before 4:00. Leave two seconds of silence for editing.

## Recording checklist

- Runtime is between 3:00 and 5:00.
- The first 25 seconds state the problem and target user.
- The recording shows a real state transition for learner, mentor, and finance.
- The test-money warning is visible and spoken.
- The local callback is called simulated; an external callback is called signed only when logs and UI confirm it.
- The audit reference is visible without exposing a token or secret.
- The visual workflow and why Sub0 is essential are both shown.
- The close distinguishes proposed impact/business model from measured evidence.
- No claim suggests a real transfer, customer, revenue, live deployment, or production readiness.
- No terminal, environment editor, browser storage, network authorization header, Paystack secret page, or seed secret appears.
- Demo accounts contain only the documented deterministic fixtures.
- Audio is clear; text is readable at normal playback speed; the cursor is deliberate.
- The final video is public or unlisted-accessible to judges without login.
- The uploaded video URL and final runtime are added to `docs/devpost-submission.md`.

## Contingencies

### The learner baseline is already modified

Reload the local app to recreate the in-memory baseline, sign in as Learner, and restart the take. On a deployed environment, run the protected seed only if resetting all demo progress is intentional.

### A role-switch control is absent

`VITE_DEMO_MODE` is false. For a deployed take, sign out and sign in with the next documented account. For a local take, restart with `VITE_DEMO_MODE=true`.

### The provider event does not arrive

Do not claim success and do not trigger a second transfer blindly.

1. Keep the processing screen visible and say the provider callback is asynchronous.
2. If using the local demo, wait up to 10 seconds; if it still fails, reload to baseline and restart the take.
3. If using Sub0, inspect the queued action and webhook logs by provider reference, verify the public callback and test secret, and reconcile before recording again.
4. If time does not allow repair, show the pre-seeded paid test event for submission 401 and label it fixture evidence. Do not present it as the transfer just initiated.

### The deployed backend is unavailable

Use the local deterministic flow, state that external deployment awaits or is being repaired, and provide setup instructions. The event permits a live URL or setup instructions, but the judged frontend/backend requirements should still be completed as soon as participant signup permits.

### Network or CORS fails during recording

Stop the take. Verify the exact HTTPS frontend origin in `ALLOWED_ORIGINS`, the HTTPS/WSS build variables, and the dashboard WebSocket preview. Do not edit SQL guards to work around an origin or response-shaping problem.

### The workflow layout clips on screen

Use React Flow's fit-view control or reduce browser zoom slightly before restarting. Do not drag nodes; production nodes are intentionally non-draggable and approval order changes through explicit controls.
