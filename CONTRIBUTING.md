# Contributing to MilestoneRail

MilestoneRail welcomes focused fixes, tests, accessibility improvements, and documentation corrections.

## Setup

```sh
npm ci
npm run dev
```

Use the documented local demo accounts and keep `VITE_DEMO_MODE=true` for fixture-based development.

## Before opening a change

1. Keep the change scoped and explain the user or operational problem it solves.
2. Preserve role, organization, ownership, and submission-state checks.
3. Keep Paystack in test mode. Never add support for a live key as part of a routine contribution.
4. If a Sub0 model or resource changes, update `sub0/README.md`, relevant architecture/deployment documentation, and static validation.
5. Add or update tests for changed behavior.
6. Run:

   ```sh
   npm run verify
   npm run test:e2e
   ```

7. Format only files included in the change.

## Pull request notes

Include:

- the problem and approach
- affected roles and state transitions
- tests run and results
- screenshots for visible UI changes
- deployment or dashboard verification still required
- explicit confirmation that no real money or live credential was used

Do not describe fixture metrics, local simulation, or third-party benchmarks as production evidence.

## Security

Do not commit or post database URLs, JWT or seed secrets, Paystack keys, recipient details, session tokens, signed payloads, or personal data. If a secret is exposed, rotate it at the provider; deleting it from a later commit is not sufficient.

Report a suspected vulnerability privately to the repository owner rather than opening a public exploit report. Until a private contact is published, do not include sensitive reproduction data in an issue.

By contributing, you agree that your contribution may be distributed under the [MIT License](LICENSE).
