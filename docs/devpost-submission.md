# Devpost submission kit

Replace every bracketed placeholder before publishing. Do not add a live, repository, video, customer, revenue, or impact claim until it is independently true and judge-accessible.

## Submission fields

### Project name

MilestoneRail

### Tagline

One accountable rail from learner evidence to approved test payout.

### One-sentence pitch

MilestoneRail gives training programs and their learners one role-aware workflow for milestone proof, mentor review, finance authorization, Paystack test payout state, and an auditable receipt.

### Current access status

Use this text until external deployment succeeds:

> A complete deterministic judge demo runs locally from the public source and setup instructions. External LingoQL/Sub0 deployment currently awaits the participant's hackathon registration and platform signup, so we do not claim a live URL or hosted smoke result yet.

After deployment, replace that paragraph only with verified facts:

> The frontend is deployed on LingoQL and the backend is deployed with Sub0 at the live URL below. The final smoke results and date are recorded in the repository documentation. All payout activity remains in Paystack test mode.

## Ready-to-paste project description

### Inspiration

Training stipends are often conditional on completed work, but the evidence, mentor decision, finance check, payout status, and audit proof live in separate tools. That fragmentation makes delays difficult to explain to learners and forces program teams to reconcile the same milestone across messages, spreadsheets, file links, and provider dashboards.

A public multi-country African training-allowance case study describes manual reconciliation between paper attendance, cash balances, and payment records, while South African public program guidance explicitly requires payment records to be reconciled against appointment and attendance data. Those sources establish a real operating problem; they are not customer evidence for MilestoneRail.

### What it does

MilestoneRail turns each earned milestone into a visible approval rail:

1. A learner submits an HTTPS link or evidence file with context.
2. A mentor reviews the proof against a rubric and either approves it or requests changes.
3. Finance sees only approved items, checks eligibility and cohort budget context, and authorizes a Paystack test transfer.
4. A signed provider webhook—not the authorization button—moves the test payout to paid or failed.
5. Learners and program roles can inspect one ordered audit history with actors, timestamps, decisions, and provider references.

Administrators can also configure approval roles, ordering, active state, and SLA hours in a visual workflow studio. A scheduled scan turns overdue steps into deduplicated audit events.

### How we built it

The frontend is a responsive React 19 and TypeScript single-page application built with Vite 8 and Tailwind CSS 4. React Router enforces role-specific pages, TanStack Query manages server state, React Hook Form and Zod validate evidence input, XYFlow renders the workflow studio, and Recharts presents cohort activity.

The production backend is expressed as eight PostgreSQL models and eleven version-controlled Sub0 API/ABI resources. Sub0 handles:

- bcrypt-backed sign-in and eight-hour HS256 JWTs
- payload validation and endpoint rate limits
- SQL-level user, role, organization, ownership, and state checks
- evidence links and one-file, 10 MiB allow-listed uploads
- action chaining before storage and external dispatch
- queued Paystack test transfer requests with three retries
- raw-body HMAC-SHA512 webhook verification
- targeted WebSocket broadcasts for submissions, payouts, and workflows
- a 15-minute SLA cron with event deduplication
- an administrative, secret-protected, idempotent demo seed

Protected writes repeat the expected submission status inside their update, so stale actions cannot overwrite a newer transition. Payout creation checks for an existing active or paid payout and conditionally moves the submission before inserting. The webhook updates only non-terminal test payouts, so duplicate callbacks cannot regress terminal state.

LingoQL is the intended static frontend host using `npm run build` and `dist`; Sub0 is the required backend runtime. The repository includes dashboard verification steps because Sub0 has no local runtime or public offline ABI compiler.

### Challenges

The hardest part was preserving one client contract across a fast local judge demo and the deployed Sub0 path without pretending they provide the same evidence. The browser demo simulates a successful signed provider event after a short delay; the checked-in Sub0 resource performs the real queued Paystack test request and verifies the raw callback signature.

We also had to make multi-tenant and workflow-state controls explicit in declarative SQL, ensure file authorization happens before storage, keep provider latency out of the finance request, and make duplicate callbacks safe. Dashboard-only response shaping and action-output mapping remain deployment verification points rather than claims proven by static JSON checks.

### Accomplishments

- A coherent learner-to-audit journey across four role-specific workspaces
- Separation of mentor approval from finance authorization
- Test-only provider safety enforced in both configuration and SQL
- Append-only human and provider audit events
- Visual approval policy with SLAs and a scheduled attention scan
- Version-controlled Sub0 models/resources plus a dedicated invariant validator
- Automated unit/integration coverage and desktop/mobile end-to-end flows
- Documentation that distinguishes fixture metrics, public benchmarks, and deployed evidence

These are implementation accomplishments, not claims of customers, real disbursements, measured impact, or completed production deployment.

### What we learned

The payout button is not the end of a payment workflow. Reliable operations require a state machine, an authenticated provider event, idempotent handling, visible failure states, and a reconciliation path. Sub0's action chaining, queues, webhook verifier, WebSockets, cron, and environment accessors let those concerns live beside the data policy rather than in scattered framework glue.

We also learned that realtime safety and realtime reach are separate concerns. Current broadcasts are deliberately targeted to the actor or affected learner to prevent cross-tenant leakage; full cross-role fan-out will require an organization-scoped recipient design.

### What's next

The immediate next step is to complete participant registration, import the checked-in resources into Sub0, deploy the static frontend on LingoQL, run the dashboard and smoke checklist, and record the hosted test flow.

Beyond the hackathon, validation would begin with program operators and learners. Production work would include organization-scoped realtime fan-out, SSO, recipient onboarding, exception reconciliation, exports, observability, backup/restore drills, malware scanning, retention controls, accessibility testing, an independent security review, and applicable privacy/payment compliance. Live money is explicitly out of scope for this demo.

### Business model

The proposed model is business-to-business SaaS: a base fee per active program or cohort, usage tiers by active learners and workflow volume, and higher tiers for multi-organization controls, configurable policies, exports, SSO, and support. Implementation and reconciliation services could support larger operators. This is a hypothesis, not revenue or market-validation evidence.

## Judging-criteria evidence map

### Innovation and Creativity — 25%

Evidence to show:

- One visual rail connects evidence, human gates, a provider callback, and a shared receipt.
- The workflow studio exposes role, order, activation, and SLA instead of hiding policy in code.
- Provider state and human decisions share one searchable chronology.

Repository evidence:

- `src/pages/workflow.tsx`
- `src/pages/audit.tsx`
- `sub0/resources/sla-scan.json`
- `sub0/resources/paystack-webhook.json`
- `docs/demo-script.md`

Claim boundary: this is a differentiated implementation approach, not proof that no comparable product exists.

### Technical Implementation — 30%

Evidence to show:

- Eight relational models and eleven named Sub0 resources
- JWT, bcrypt, SQL role/tenant/ownership checks, validation, and rate limits
- Authorized upload chaining, queued HTTP request, retries, HMAC webhook, WebSockets, and cron
- Guarded state transitions, duplicate-callback behavior, deterministic seed, and static validator
- React Query cache invalidation and bounded WebSocket reconnection
- Unit/integration tests plus desktop and mobile Playwright flows

Repository evidence:

- `sub0/models/`
- `sub0/resources/`
- `sub0/README.md`
- `scripts/validate-sub0.mjs`
- `scripts/smoke-sub0.mjs`
- `src/lib/api.ts`
- `src/hooks/use-app-data.ts`
- `e2e/milestonerail.e2e.ts`
- `docs/architecture.md`

Claim boundary: static validation proves checked-in invariants, not hosted Sub0 execution. Record hosted checks only after they pass.

### Practical Utility — 25%

Evidence to show:

- Clear users: learners, mentors, finance staff, and program administrators
- A complete explanation path for delayed or failed milestones
- Separate quality and financial controls
- Budget context, SLA attention, and audit references for reconciliation
- A proposed cohort/usage SaaS model

Repository evidence:

- `README.md`
- `src/pages/milestones.tsx`
- `src/pages/reviews.tsx`
- `src/pages/payouts.tsx`
- `docs/research.md`

Claim boundary: public sources support the problem and analogous digitization value. MilestoneRail has no claimed customers, revenue, field study, or measured outcome.

### Presentation and Demo — 20%

Evidence to show:

- Problem and user value in the first 25 seconds
- A live state transition through learner, mentor, finance, callback, and audit
- Test-money and simulation labels visible throughout
- Workflow and architecture explained within a 3–5 minute recording
- Clear README, deployment runbook, architecture, research, and contribution docs

Repository evidence:

- `docs/demo-script.md`
- `README.md`
- `docs/deployment.md`
- `docs/architecture.md`
- `[ADD PUBLIC VIDEO URL]`

Claim boundary: edit out no failures that materially change what works; use a local demo label whenever local fixtures are shown.

### Bonus considerations

- Cross-ecosystem: Sub0 backend plus intended LingoQL static deployment
- Reusable source: version-controlled model/resource definitions, invariant validator, and deployment checklist
- Production-readiness signals: tenant/state guards, test-key enforcement, webhook verification, retries, audit history, and explicit known gaps
- Monetization: a stated SaaS hypothesis

Do not call the project fully deployed or production-ready until all stated gaps are resolved and the organizer's hosted requirements are verified.

## Built with

Use this list in Devpost's **Built with** field:

```text
LingoQL, Sub0, PostgreSQL, Paystack Test Transfers, React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, XYFlow, Recharts, Vitest, Playwright, Testing Library, MSW, Oxlint, Prettier
```

## Links

- Source repository: `[ADD PUBLIC GITHUB OR GITLAB URL]`
- Live application: `[PENDING PARTICIPANT LINGOQL/SUB0 SIGNUP AND VERIFIED DEPLOYMENT]`
- Demo video: `[ADD PUBLIC OR UNLISTED 3–5 MINUTE VIDEO URL]`
- Optional pitch deck: `[ADD URL OR REMOVE FIELD]`
- Setup instructions: `[LINK TO PUBLIC README AFTER REPOSITORY IS AVAILABLE]`
- Architecture: `[LINK TO PUBLIC docs/architecture.md]`
- Deployment evidence: `[LINK TO PUBLIC docs/deployment.md AND FINAL RESULT RECORD]`

Before submission, open every link in a private window. Judges must not need repository membership, a local account, or a request-access workflow.

## Screenshot plan

The repository includes eight clean local-demo captures in `docs/screenshots/`:

1. `01-landing-rail.png` — hero and five-stage evidence-to-payout preview
2. `02-learner-milestones.png` — Amara's milestones, eligible amount, and next action
3. `03-learner-evidence.png` — evidence URL and context submission
4. `04-mentor-rubric.png` — evidence and rubric in the review dialog
5. `05-finance-controls.png` — budget context and test authorization checks
6. `06-audit-provider-event.png` — simulated paid event with actor and provider reference
7. `07-workflow-studio.png` — five-node visual rail and role/SLA inspector
8. `08-mobile-milestones.png` — responsive learner experience

Regenerate the sanitized set with `npm run screenshots` after returning the demo to its baseline.

Screenshot rules:

- Keep **Paystack test** or **local demo** labeling visible where relevant.
- Do not show keys, tokens, browser storage, authorization headers, environment editors, or real recipient details.
- Do not crop away context that distinguishes fixtures from production evidence.
- Use deterministic demo names only after confirming they contain no real person's data.
- Add concise captions; do not claim a live provider result from a local screenshot.

## Eligibility checklist

- [ ] The participant meets the live Devpost eligibility requirements.
- [ ] Any discrepancy between the event overview and rules is resolved with the organizer. The current overview says students only, while the rules page describes broader worldwide participation.
- [ ] The project was created during the official hacking period and was not pre-built or previously submitted; the participant can attest to this.
- [ ] The team has no more than four members.
- [ ] Every contributor is listed and has agreed to the submission.
- [ ] Third-party assets and dependencies are used under compatible licenses.
- [ ] The backend submitted for judging uses Sub0.
- [ ] The frontend is deployed on LingoQL, or any temporary lack of deployment is disclosed without claiming compliance.
- [ ] All Paystack actions are test mode and no real money moves.

## Final submission checklist

- [ ] Join the hackathon and complete the current Devpost to-dos.
- [ ] Verify the authoritative deadline with the organizer because the current overview and rules dates conflict.
- [ ] Add the public source URL and test it while signed out.
- [ ] Add the verified LingoQL live URL; otherwise keep the pending disclosure and setup instructions.
- [ ] Add a public/unlisted 3–5 minute video and verify its runtime and permissions.
- [ ] Paste the project description and Built with list.
- [ ] Upload screenshots with honest captions.
- [ ] Confirm README covers problem, solution, stack, and LingoQL/Sub0 use.
- [ ] Run `npm run verify` and record the commit/date/result.
- [ ] Run `npm run test:e2e` and record desktop/mobile results.
- [ ] Run `npm run smoke:sub0` against the deployed backend and record the result, or leave it explicitly pending.
- [ ] Complete all dashboard verification points.
- [ ] Run one controlled Paystack test flow and match its provider reference to the audit event.
- [ ] Search the repository and media for credentials or personal data.
- [ ] Confirm no live URL, customer, revenue, transfer, production-readiness, or measured-impact claim is unsupported.
- [ ] Confirm the license and contributor permissions.
- [ ] Preview the Devpost entry on desktop and mobile.
- [ ] Submit before the earliest plausible deadline and retain confirmation.

## Honest evidence language

Use:

- “The local demo simulates a successful signed provider event.”
- “The Sub0 resource is configured to verify Paystack's HMAC-SHA512 signature.”
- “Automated tests passed on `[commit/date]`.”
- “A public vendor case study reports a reduction in reconciliation time for its own customer.”
- “MilestoneRail is designed to reduce fragmented handoffs.”
- “The business model is a proposal.”
- “External deployment is pending participant signup.”

Avoid:

- “MilestoneRail reduced reconciliation from days to hours.”
- “Customers save 80%.”
- “The payout succeeded” when showing a local timer.
- “Production-ready,” “bank-grade,” “secure,” or “compliant” without a defined, completed assessment.
- “Realtime for every role” while broadcasts remain actor/learner-targeted.
- “Live on LingoQL” before a public URL and smoke result exist.
- “Paystack partnership” or “Paystack-certified”; this is an API integration in test mode.
