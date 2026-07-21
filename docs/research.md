# MilestoneRail research and hackathon strategy

Last reviewed: July 21, 2026.

This document separates three kinds of evidence:

- Official platform and event sources define what must be submitted and how the integrations are expected to behave.
- Public problem sources show that stipend reconciliation is a real operating concern.
- MilestoneRail repository evidence shows what this prototype implements.

None of the external sources is customer validation for MilestoneRail. No external benchmark may be restated as a measured MilestoneRail result.

## Problem evidence

### Training allowances create a multi-record reconciliation problem

South Africa's Department of Basic Education published a June 2025 reconciliation guideline for Phase V of the Basic Education Employment Initiative, part of the Presidential Employment Stimulus.[1] The program funds youth stipends through multiple funding and payment paths. Its guideline calls for reconciliation across approved allocations, appointments, school or system records, payment schedules, transfers, stipends, and UIF contributions, including adjustments for vacancies, late appointments, terminations, and overpayments.[1]

That primary source supports the underlying product premise: a stipend is not just a payment. It is a controlled chain connecting eligibility or participation evidence, approval, amount, transfer, and an audit trail. MilestoneRail narrows that broad problem to milestone-based training programs; it does not claim to implement the BEEI program or its statutory requirements.

### A public African training-allowance case study reports manual friction

Tati Software's January 2026 Digital Daily Subsistence Allowance case study describes an anonymized customer operating training and business-development programs across multiple African countries.[2] The reported starting process used paper attendance, physical cash, and manual reconciliation, with weak visibility between attendance and payment records.[2]

The vendor reports that its own digital platform changed routine reconciliation from an estimated two to three working days to same-day or under one working day for standard cohorts.[2] This is useful analogous evidence for why linked evidence and payment records may matter. It is not independent research, the customer is unnamed, its measurement method is described only at a high level, and the result belongs to Tati's implementation—not MilestoneRail.

Permitted wording:

> Public program guidance and a vendor case study show that training stipends can require reconciliation across evidence, participant, approval, and payment records.[1][2]

Not permitted:

> MilestoneRail cuts reconciliation from three days to one.

MilestoneRail has no production cohort, customer study, or measured impact.

## Hackathon requirements and judging strategy

### Baseline requirements

The official Zero to Query event page says participants should register on Devpost, use the emailed LingoQL signup link, and receive USD 20 in LingoQL credits; it provides an on-page fallback for registrants who do not receive the email.[3] It requires a clear project description, frontend source repository, 3–5 minute demo video, live deployed URL or setup instructions, and documentation of the problem, solution, stack, and LingoQL/Sub0 use.[3]

The official rules separately require the backend to use Sub0, say the frontend should be deployed on LingoQL infrastructure, require an accessible source repository and demo video, cap teams at four, and require work to be created during the hacking period.[4]

There are material inconsistencies on the current official pages:

- The event overview shows a July 29, 2026 at 8:45 a.m. EDT deadline, while the rules list a July 21 submission deadline and July 22–26 judging period.[3][4]
- The overview's eligibility panel says students only and excludes companies/professional organizations, while the rules describe developers, designers, founders, students, and builders worldwide.[3][4]

The participant should obtain organizer clarification, verify the live Devpost countdown, and act against the earliest deadline. This repository cannot determine personal eligibility.

### Judging priorities

The rules assign Technical Implementation 30%, Innovation and Creativity 25%, Practical Utility 25%, and Presentation and Demo 20%.[4] The strategy follows those weights:

1. Make technical depth inspectable. The submission points judges to the eight models, eleven resources, SQL guards, upload chain, queue, retries, signed webhook, WebSockets, cron, validator, tests, and known dashboard checks.
2. Demonstrate utility through one uninterrupted role journey. The demo follows learner evidence, mentor review, finance authorization, provider state, and audit rather than touring disconnected screens.
3. Explain the distinctive idea in plain language. The visible “rail” is a shared state and evidence model, not a visual theme alone.
4. Preserve presentation time for architecture and limitations. The 3–5 minute script labels test money, local simulation, and pending deployment rather than spending credibility on inflated claims.
5. Satisfy eligibility and platform requirements before pursuing bonus points. A polished local demo does not replace the Sub0/LingoQL deployment expectation in the rules.

Devpost's participant guidance reinforces this approach: check eligibility and required tools first, expose required URLs, keep the demo concise, show technological implementation, make the experience understandable, research the problem, and align directly to the event's published criteria.[5]

### Evidence by criterion

- Technical Implementation: `sub0/`, `scripts/validate-sub0.mjs`, `scripts/smoke-sub0.mjs`, `src/lib/api.ts`, `e2e/`, and `docs/architecture.md`
- Innovation and Creativity: the visual approval rail, provider-driven finality, and shared audit chronology
- Practical Utility: explicit learner/mentor/finance/admin jobs plus the problem sources above
- Presentation and Demo: `docs/demo-script.md`, screenshots, and the final public video
- Bonus considerations: cross-ecosystem Sub0/LingoQL use, reusable checked-in ABI definitions, explicit production controls, and a proposed SaaS model

## LingoQL and Sub0 sources

LingoQL describes itself as infrastructure for apps, APIs, workers, cron jobs, realtime services, databases, queues, and websites; it describes Sub0 as its backend construction engine for data models, business logic, policies, and interfaces.[6][7] These are vendor descriptions, so the submission should show concrete repository usage rather than repeat marketing claims.

The official static-site guide says a deployment needs a build command and output directory, recommends defining both explicitly, lists `npm run build` and `dist` for Vite, and says SPA fallback routing is handled automatically.[8] Those settings are used in the MilestoneRail deployment runbook.

The official Sub0 documentation supports the implemented primitives:

- Getting Started says to create a project, define persistent-data models first, then endpoint specifications.[9]
- Authentication documents JWT issuance with `tokenize`, protected endpoints, `$PROTECTED` claims, environment-backed keys, and bearer authorization.[10]
- Action Chaining documents `depends_on`, extracted results, `no_op`, and upload chaining for multi-step workflows.[11]
- File Uploads documents multipart `UPLOAD` actions, count/size/MIME/path restrictions, protected user-scoped paths, and metadata passed to database actions.[12]
- Queueing documents asynchronous action execution, delay/priority, and retries.[13]
- Webhooks documents HMAC verification over the raw request body, `$HEADER` and `$ENV` accessors, asynchronous handling, and follow-up broadcasts.[14]
- WebSockets documents the `/ws` route, optional or required UID, token subprotocol format, and `ALL`, `SINGLE`, and `BULK` broadcasts.[15]
- Cron Jobs documents Sub0's six-part `second minute hour day-of-month month day-of-week` format and background scheduled actionables.[16]
- Environment-variable guidance distinguishes custom secrets from system runtime variables and documents CORS, payload, method, and WebSocket controls.[17]

MilestoneRail uses those features as runtime dependencies, not name-checks. Their exact mapping is in `docs/architecture.md`.

## Paystack sources and safety interpretation

Paystack's Single Transfers guide says a transfer requires a recipient and that final transfer status is delivered to a configured webhook; it also states that test transfers return success because they do not undergo live processing.[18] That is why MilestoneRail treats Paystack test state as demonstration data, not proof of funds movement.

Paystack's recipient guide documents the supported recipient types, the `POST /transferrecipient` flow, and the returned `recipient_code` used for transfers.[19] MilestoneRail stores only a configured test recipient code and requires the `RCP_` prefix before dispatch.

Paystack's webhook guide recommends webhooks over device callbacks for final state, requires a public endpoint returning `200 OK`, and documents the `x-paystack-signature` value as an HMAC-SHA512 signature created with the integration secret.[20] It lists `transfer.success`, `transfer.failed`, and `transfer.reversed`, which are the only event names accepted by the checked-in Sub0 webhook.[20]

Paystack also documents that failed test-mode webhook deliveries are retried hourly for ten hours.[20] MilestoneRail's duplicate-terminal guard is therefore required behavior, not an optional optimization.

No source here authorizes a live transfer. The hackathon deployment must keep an `sk_test_` key, test recipient, test dashboard mode, and the “No real money” disclosure.

## Claim ledger

Claims supported by repository inspection:

- The local demo implements a deterministic four-role evidence-to-test-payout flow.
- The Sub0 JSON defines eight models and eleven resources.
- The checked-in webhook definition uses HMAC-SHA512 and updates non-terminal test payouts.
- The frontend responds to three targeted event names and reconnects with bounded backoff.
- Automated test commands exist for unit/integration, desktop/mobile E2E, Sub0 static validation, and deployed read-only smoke.

Claims that require a final test record:

- All local verification commands pass on the final commit.
- The hosted Sub0 dashboard produces the expected response shapes.
- The deployed frontend can authenticate and call Sub0 with the final CORS origin.
- A Paystack test callback reaches the deployed webhook and matches an audit provider reference.

Claims not established:

- A public live URL
- Production readiness, security certification, or regulatory compliance
- Real-money movement
- Customers, users outside fixtures, revenue, savings, or measured impact
- Organization-wide realtime fan-out
- A benchmark showing MilestoneRail performance or business outcomes

## References

1. South African Department of Basic Education, [Guideline to Reconcile the Funds: Basic Education Employment Initiative Phase V, a Component of Presidential Employment Stimulus](https://www.education.gov.za/LinkClick.aspx?fileticket=rZAV5d4jBpc%3D&mid=14155&portalid=0&tabid=2824), June 2025. Official public-sector guidance. Accessed July 21, 2026.
2. Tati Software, [Digital Daily Subsistence Allowance Management System](https://tati.digital/case-studies/digital-daily-subsistence-allowance-management-sys/), January 12, 2026. Public vendor case study with an anonymized customer; use with the limitations above. Accessed July 21, 2026.
3. Devpost and LingoQL, [Zero to Query: LingoQL Hackathon overview](https://ztq.devpost.com/). Official event requirements, registration/credit instructions, current overview eligibility panel, judging summary, and displayed countdown. Accessed July 21, 2026.
4. Devpost and LingoQL, [Zero to Query official rules](https://ztq.devpost.com/rules). Official dates, eligibility text, submission requirements, weighted criteria, and bonus considerations. Accessed July 21, 2026.
5. Devpost, [Understanding hackathon submission and judging criteria: What really counts](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria). Official participant guidance. Accessed July 21, 2026.
6. LingoQL, [Documentation index](https://docs.lingoql.com/llms.txt). Official index for LingoQL and Sub0 documentation. Accessed July 21, 2026.
7. LingoQL, [Sub0 introduction](https://docs.lingoql.com/sub0/introduction). Official description of the backend construction engine. Accessed July 21, 2026.
8. LingoQL, [Deploy Static Sites For Free](https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-static-sites-for-free). Official static-site build/output and SPA routing guidance. Accessed July 21, 2026.
9. LingoQL, [Sub0 Getting Started](https://docs.lingoql.com/sub0/getting-started). Official project, model, and endpoint sequence. Accessed July 21, 2026.
10. LingoQL, [Sub0 Authentication](https://docs.lingoql.com/sub0/apis-abi/authentication). Official JWT and protected-resource syntax. Accessed July 21, 2026.
11. LingoQL, [Sub0 Action Chaining](https://docs.lingoql.com/sub0/apis-abi/action-chaining). Official multi-action dependency syntax. Accessed July 21, 2026.
12. LingoQL, [Sub0 File Uploads](https://docs.lingoql.com/sub0/apis-abi/file-uploads). Official upload policy and metadata behavior. Accessed July 21, 2026.
13. LingoQL, [Sub0 Queueing](https://docs.lingoql.com/sub0/apis-abi/queueing). Official asynchronous queue and retry behavior. Accessed July 21, 2026.
14. LingoQL, [Sub0 Webhooks](https://docs.lingoql.com/sub0/apis-abi/webhooks). Official verifier and background processing behavior. Accessed July 21, 2026.
15. LingoQL, [Sub0 WebSockets](https://docs.lingoql.com/sub0/apis-abi/websockets). Official UID, token subprotocol, and broadcast behavior. Accessed July 21, 2026.
16. LingoQL, [Sub0 Cron Jobs](https://docs.lingoql.com/sub0/apis-abi/cron-jobs). Official six-part cron syntax. Accessed July 21, 2026.
17. LingoQL, [Managing Sub0 Environment Variables](https://docs.lingoql.com/sub0/managing-env.-variables). Official custom/system variable and CORS guidance. Accessed July 21, 2026.
18. Paystack, [Single Transfers](https://paystack.com/docs/transfers/single-transfers/). Official test-transfer and final-status guidance. Accessed July 21, 2026.
19. Paystack, [Creating Transfer Recipients](https://paystack.com/docs/transfers/creating-transfer-recipients/). Official recipient creation and recipient-code guidance. Accessed July 21, 2026.
20. Paystack, [Webhooks](https://paystack.com/docs/payments/webhooks/). Official callback acknowledgement, retry, signature, and event guidance. Accessed July 21, 2026.
