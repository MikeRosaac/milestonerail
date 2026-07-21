import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const sub0Dir = path.join(rootDir, 'sub0')
const modelDir = path.join(sub0Dir, 'models')
const resourceDir = path.join(sub0Dir, 'resources')
const errors = []

function check(condition, message) {
  if (!condition) errors.push(message)
}

async function jsonFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(directory, entry.name))
    .sort()
}

async function parseJson(file) {
  const source = await readFile(file, 'utf8')
  try {
    return { source, value: JSON.parse(source) }
  } catch (error) {
    errors.push(`${path.relative(rootDir, file)} is not strict JSON: ${error.message}`)
    return { source, value: null }
  }
}

function walk(value, visit, pointer = '$') {
  visit(value, pointer)
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${pointer}[${index}]`))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => walk(item, visit, `${pointer}.${key}`))
  }
}

function actionables(resource, mode) {
  return (resource.actionables ?? []).filter((action) => !mode || action.mode === mode)
}

function sqlFor(resource) {
  return actionables(resource, 'QUERY')
    .map((action) => action.sql_query?.query)
    .filter((query) => typeof query === 'string')
    .join('\n')
}

const expectedModels = [
  'audit_events.json',
  'cohorts.json',
  'milestones.json',
  'organizations.json',
  'payouts.json',
  'submissions.json',
  'users.json',
  'workflow_steps.json',
]

const expectedResourceFiles = [
  'auth-sign-in.json',
  'dashboard.json',
  'demo-seed.json',
  'payouts-initiate.json',
  'paystack-webhook.json',
  'sla-scan.json',
  'submissions-evidence-link.json',
  'submissions-evidence-upload.json',
  'submissions-review.json',
  'workflows-list.json',
  'workflows-save.json',
]

const expectedRoutes = [
  'admin/demo-seed',
  'auth/sign-in',
  'dashboard',
  'jobs/sla-scan',
  'payouts/initiate',
  'submissions/evidence-link',
  'submissions/evidence-upload',
  'submissions/review',
  'webhooks/paystack',
  'workflows/list',
  'workflows/save',
]

const claims = ['id', 'organizationId', 'role', 'name', 'email']
const modelFiles = await jsonFiles(modelDir)
const resourceFiles = await jsonFiles(resourceDir)

check(
  JSON.stringify(modelFiles.map((file) => path.basename(file))) === JSON.stringify(expectedModels),
  `Expected exactly these model files: ${expectedModels.join(', ')}`,
)
check(
  JSON.stringify(resourceFiles.map((file) => path.basename(file))) ===
    JSON.stringify(expectedResourceFiles),
  `Expected exactly these resource files: ${expectedResourceFiles.join(', ')}`,
)

const models = new Map()
for (const file of modelFiles) {
  const { value } = await parseJson(file)
  if (value) models.set(path.basename(file, '.json'), value)
}

const allowedModelTypes = new Set([
  'Number',
  'Float',
  'String',
  'Boolean',
  'DateTime',
  'JSON_OBJECT',
  'JSON_ARRAY',
])

for (const [name, model] of models) {
  check(model && !Array.isArray(model), `models/${name}.json must contain one model object`)
  check(model.id?.primary_key === true, `models/${name}.json must have an id primary key`)
  for (const [fieldName, field] of Object.entries(model)) {
    check(
      field && allowedModelTypes.has(field.type),
      `models/${name}.json field ${fieldName} has an unsupported or missing type`,
    )
    if (field.foreign_key) {
      check(
        models.has(field.foreign_key.of),
        `models/${name}.json field ${fieldName} references unknown model ${field.foreign_key.of}`,
      )
      check(
        field.foreign_key.key === 'id',
        `models/${name}.json field ${fieldName} must reference an id`,
      )
    }
  }
}

const resources = new Map()
const resourceIds = new Set()
for (const file of resourceFiles) {
  const { source, value } = await parseJson(file)
  if (!value) continue
  const relative = path.relative(rootDir, file)
  check(
    !/sk_live_[A-Za-z0-9]{8,}/.test(source),
    `${relative} contains what appears to be a live Paystack credential`,
  )
  check(typeof value.id === 'string' && value.id.length > 0, `${relative} needs a resource id`)
  check(
    !resourceIds.has(value.id),
    `${relative} reuses resource id ${value.id}; Sub0 resource IDs must be unique`,
  )
  resourceIds.add(value.id)
  check(
    typeof value.resource === 'string' && value.resource.length > 0,
    `${relative} needs a resource route`,
  )
  check(
    Array.isArray(value.actionables) && value.actionables.length > 0,
    `${relative} needs actionables`,
  )
  resources.set(value.resource, value)

  walk(value, (item, pointer) => {
    if (typeof item !== 'string') return
    if (
      (pointer.endsWith('.encryption_key') || pointer.endsWith('.secret_key')) &&
      !item.startsWith('$ENV.')
    ) {
      errors.push(`${relative} ${pointer} must be a $ENV accessor`)
    }
    if (
      pointer.endsWith('.headers.Authorization') &&
      /(?:Bearer|Basic)\s/.test(item) &&
      !item.includes('$ENV.')
    ) {
      errors.push(`${relative} ${pointer} contains a non-environment credential`)
    }
  })

  for (const action of actionables(value, 'QUERY')) {
    const query = action.sql_query?.query ?? ''
    const placeholderNumbers = [...query.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]))
    const expectedParameterCount =
      placeholderNumbers.length > 0 ? Math.max(...placeholderNumbers) : 0
    check(
      !/\$(?:PAYLOAD|PROTECTED|ENV)\./.test(query),
      `${relative} embeds a request accessor in SQL instead of a parameter list`,
    )
    check(
      (action.sql_query?.parameters ?? []).length === expectedParameterCount,
      `${relative} action ${action.id} has ${expectedParameterCount} SQL placeholders but ${
        action.sql_query?.parameters?.length ?? 0
      } parameters`,
    )
    check(
      !/\b(?:UPDATE|DELETE\s+FROM)\s+audit_events\b/i.test(query),
      `${relative} mutates append-only audit_events`,
    )
  }
}

check(
  JSON.stringify([...resources.keys()].sort()) === JSON.stringify(expectedRoutes),
  `Expected exactly these resource routes: ${expectedRoutes.join(', ')}`,
)

const protectedRoutes = [
  'dashboard',
  'workflows/list',
  'workflows/save',
  'submissions/evidence-link',
  'submissions/evidence-upload',
  'submissions/review',
  'payouts/initiate',
]

for (const route of protectedRoutes) {
  const resource = resources.get(route)
  if (!resource) continue
  check(
    resource.tokenize?.type === 'JWT' &&
      resource.tokenize?.algorithm === 'HS256' &&
      resource.tokenize?.encryption_key === '$ENV.JWT_SECRET_KEY',
    `${route} must verify HS256 JWTs with $ENV.JWT_SECRET_KEY`,
  )
  check(
    resource.protected?.provide_as === 'Authorization',
    `${route} must require the Authorization header`,
  )
  check(
    JSON.stringify(resource.protected?.extract_claims) === JSON.stringify(claims),
    `${route} must extract exactly ${claims.join(', ')}`,
  )
  for (const action of actionables(resource, 'QUERY')) {
    const parameters = action.sql_query?.parameters ?? []
    for (const accessor of ['$PROTECTED.id', '$PROTECTED.organizationId', '$PROTECTED.role']) {
      check(
        parameters.includes(accessor),
        `${route} query action ${action.id} must scope with ${accessor}`,
      )
    }
    check(
      /\borganization_id\b/i.test(action.sql_query?.query ?? ''),
      `${route} query action ${action.id} must scope organization_id`,
    )
    check(
      /\brole\b/i.test(action.sql_query?.query ?? ''),
      `${route} query action ${action.id} must enforce or re-check role`,
    )
  }
}

const signIn = resources.get('auth/sign-in')
if (signIn) {
  check(
    JSON.stringify(signIn.tokenize?.custom_claim_fields) === JSON.stringify(claims),
    'auth/sign-in must issue the five expected JWT claims',
  )
  check(signIn.tokenize?.expiration === 28800, 'auth/sign-in JWT must expire in eight hours')
  check(
    signIn.rate_limit?.limit <= 5 && signIn.rate_limit?.expires_after >= 300,
    'auth/sign-in needs a strict login rate limit',
  )
  check(
    actionables(signIn, 'QUERY').some((action) =>
      action.verify_hashables?.some(
        (hashable) => hashable.property === 'password' && hashable.algorithm === 'BCRYPT',
      ),
    ),
    'auth/sign-in must verify the password with BCRYPT',
  )
  check(
    !actionables(signIn).some((action) => action.returnables?.includes('password')),
    'auth/sign-in must not return password hashes',
  )
  check(
    /JOIN organizations\b/i.test(sqlFor(signIn)) && /\bu\.active = TRUE\b/i.test(sqlFor(signIn)),
    'auth/sign-in must reject inactive users and organizations',
  )
  check(
    /SELECT COUNT\(\*\) FROM users u2/.test(sqlFor(signIn)),
    'auth/sign-in must reject ambiguous duplicate active emails',
  )
}

for (const route of [
  'workflows/save',
  'submissions/evidence-link',
  'submissions/evidence-upload',
  'submissions/review',
  'payouts/initiate',
]) {
  const resource = resources.get(route)
  check(
    actionables(resource ?? {}, undefined).some(
      (action) => Array.isArray(action.payload_validation) && action.payload_validation.length > 0,
    ),
    `${route} must validate its untrusted payload`,
  )
}

const evidenceLinkSql = sqlFor(resources.get('submissions/evidence-link') ?? {})
check(
  /status IN \('draft', 'changes_requested'\)/.test(evidenceLinkSql),
  'evidence-link needs an optimistic draft/changes_requested guard',
)
check(
  /(?:s\.learner_id = ca\.id|ca\.id = s\.learner_id)/.test(evidenceLinkSql),
  'evidence-link must enforce learner ownership',
)

const reviewSql = sqlFor(resources.get('submissions/review') ?? {})
check(/s\.status = 'submitted'/.test(reviewSql), 'review needs a submitted-state guard')
check(
  /u\.role IN \('mentor', 'admin'\)/.test(reviewSql),
  'review must be restricted to mentor or admin',
)

const upload = resources.get('submissions/evidence-upload')
if (upload) {
  const uploadAction = actionables(upload, 'UPLOAD')[0]
  check(uploadAction?.uploads?.max_file_uploads === 1, 'evidence upload must allow one file')
  check(
    uploadAction?.uploads?.max_upload_file_size <= 10 * 1024 * 1024,
    'evidence upload must be at most 10 MiB',
  )
  check(
    Array.isArray(uploadAction?.uploads?.allowed_mimetypes) &&
      uploadAction.uploads.allowed_mimetypes.length > 0,
    'evidence upload must use a MIME allow-list',
  )
  check(
    uploadAction?.uploads?.upload_folder.includes('$PROTECTED.organizationId') &&
      uploadAction?.uploads?.upload_folder.includes('$PROTECTED.id'),
    'evidence upload path must be organization/user scoped',
  )
  check(
    Array.isArray(uploadAction?.depends_on) && uploadAction.depends_on.length > 0,
    'evidence upload must authorize through action chaining before storage',
  )
}

const workflowSave = resources.get('workflows/save')
check(
  workflowSave &&
    /jsonb_array_elements/.test(sqlFor(workflowSave)) &&
    /u\.role = 'admin'/.test(sqlFor(workflowSave)),
  'workflows/save must validate JSON steps and enforce admin role in SQL',
)

const payout = resources.get('payouts/initiate')
if (payout) {
  const payoutSql = sqlFor(payout)
  const httpAction = actionables(payout, 'HTTPREQUEST')[0]
  check(
    /\$5 LIKE 'sk_test_%'/.test(payoutSql) && /\$5 NOT LIKE 'sk_live_%'/.test(payoutSql),
    'payouts/initiate must operationally reject non-test Paystack keys',
  )
  check(
    /s\.status = 'awaiting_finance'/.test(payoutSql) &&
      /s\.status = 'awaiting_finance'/.test(payoutSql),
    'payouts/initiate needs an optimistic awaiting_finance guard',
  )
  check(
    httpAction?.http?.url === 'https://api.paystack.co/transfer' &&
      httpAction?.http?.method === 'POST',
    'payouts/initiate must use the Paystack transfer API',
  )
  check(
    httpAction?.http?.headers?.Authorization === 'Bearer $ENV.PAYSTACK_SECRET_KEY',
    'Paystack transfer authorization must use $ENV.PAYSTACK_SECRET_KEY',
  )
  check(
    httpAction?.queue?.delay === 0 && httpAction?.retries >= 3,
    'Paystack transfer must be queued with at least three retries',
  )
  check(
    payout.actionables[0]?.id === 1 &&
      payout.actionables[0]?.mode === 'QUERY' &&
      payout.actionables[0]?.main_returnable === true,
    'payouts/initiate must synchronously return the guarded payout before queueing',
  )
  check(
    httpAction?.depends_on?.[0]?.action_ids?.includes(3) &&
      payout.actionables.find((action) => action.id === 3)?.no_op === true,
    'Paystack HTTP request must depend on the scoped no-op dispatch query',
  )
}

const webhook = resources.get('webhooks/paystack')
if (webhook) {
  const verifier = webhook.webhook?.verifications?.HmacSignatureVerifier
  check(
    verifier?.sig_header === '$HEADER.X-Paystack-Signature' &&
      verifier?.secret_key === '$ENV.PAYSTACK_SECRET_KEY' &&
      verifier?.algorithm === 'sha512',
    'Paystack webhook must verify HMAC-SHA512 with the test secret',
  )
  const webhookSql = sqlFor(webhook)
  check(
    /p\.status IN \('queued', 'processing'\)/.test(webhookSql),
    'Paystack webhook must update only non-terminal payout states',
  )
  check(
    /i\.event_name IN \('transfer\.success', 'transfer\.failed', 'transfer\.reversed'\)/.test(
      webhookSql,
    ),
    'Paystack webhook must allow-list transfer events',
  )
  const notificationAction = webhook.actionables.find((action) => action.id === 2)
  check(
    notificationAction?.depends_on?.[0]?.action_ids?.includes(1) &&
      notificationAction?.broadcast_websocket_message?.broadcast_type === 'SINGLE' &&
      notificationAction?.broadcast_websocket_message?.broadcast_to === '$PAYLOAD.uid',
    'Paystack webhook must chain into a learner-targeted WebSocket notification',
  )
}

const cron = resources.get('jobs/sla-scan')
if (cron) {
  const cronAction = actionables(cron)[0]
  const expression = cronAction?.cron_job?.execution_interval
  check(
    typeof expression === 'string' && expression.trim().split(/\s+/).length === 6,
    'SLA scan must use a six-field cron expression',
  )
  check(cronAction?.run_in_background === true, 'SLA scan must run in the background')
  check(
    /NOT EXISTS \(SELECT 1 FROM audit_events/.test(sqlFor(cron)),
    'SLA scan must deduplicate append-only events',
  )
}

const broadcastActions = new Set()
for (const [route, resource] of resources) {
  for (const action of actionables(resource)) {
    const broadcast = action.broadcast_websocket_message
    const event = broadcast?.action
    if (event) broadcastActions.add(event)
    check(
      broadcast?.broadcast_type !== 'ALL',
      `${route} must not broadcast tenant data to all WebSocket clients`,
    )
    if (event && protectedRoutes.includes(route)) {
      check(
        broadcast.broadcast_type === 'SINGLE' && broadcast.broadcast_to === '$PROTECTED.id',
        `${route} WebSocket broadcasts must target the authenticated caller`,
      )
    }
  }
}
for (const event of ['submission.updated', 'payout.updated', 'workflow.updated']) {
  check(broadcastActions.has(event), `Missing WebSocket broadcast action ${event}`)
}

const seed = resources.get('admin/demo-seed')
if (seed) {
  const verifier = seed.webhook?.verifications?.HeaderTokenVerifier
  check(
    verifier?.header_key === '$HEADER.X-Seed-Secret' &&
      verifier?.secret_key === '$ENV.DEMO_SEED_ADMIN_SECRET',
    'Demo seed must require the environment-backed admin secret',
  )
  check(
    actionables(seed, 'QUERY').some((action) =>
      action.hashables?.some(
        (hashable) =>
          hashable.property === 'password' &&
          hashable.algorithm === 'BCRYPT' &&
          hashable.options?.rounds_cost >= 12,
      ),
    ),
    'Demo seed must bcrypt-hash its password at cost 12 or higher',
  )
  const seedSql = sqlFor(seed)
  for (const email of [
    'amara@demo.milestonerail.app',
    'david@demo.milestonerail.app',
    'fatima@demo.milestonerail.app',
    'nia@demo.milestonerail.app',
  ]) {
    check(seedSql.includes(email), `Demo seed is missing ${email}`)
  }
  check(
    /ON CONFLICT \(id\) DO NOTHING RETURNING id/.test(seedSql),
    'Demo audit seed must be append-only and idempotent',
  )
}

const dashboard = resources.get('dashboard')
if (dashboard) {
  const sql = sqlFor(dashboard)
  for (const alias of ['cohort', 'summary', 'activity', 'submissions', 'payouts', 'events']) {
    check(
      dashboard.actionables[0]?.returnables?.includes(alias),
      `dashboard response is missing ${alias}`,
    )
  }
  for (const camelField of [
    "'organizationId'",
    "'programName'",
    "'activeLearners'",
    "'learnerName'",
    "'providerReference'",
    "'eventType'",
  ]) {
    check(sql.includes(camelField), `dashboard SQL is missing camelCase field ${camelField}`)
  }
}

const envExample = await readFile(path.join(sub0Dir, 'env.example'), 'utf8')
check(!envExample.includes('sk_live_'), 'sub0/env.example must never mention a live key value')
check(
  /^PAYSTACK_SECRET_KEY=sk_test_REPLACE_/m.test(envExample),
  'sub0/env.example must require a Paystack test key',
)
for (const key of [
  'DATABASE_URL',
  'JWT_SECRET_KEY',
  'DEMO_SEED_ADMIN_SECRET',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_TEST_RECIPIENT_CODE',
  'ALLOW_WEBSOCKET_CONNECTIONS',
  'FORCE_WEBSOCKET_WITH_UID',
  'MAX_PAYLOAD_LIMIT',
  'ALLOWED_ORIGINS',
]) {
  check(new RegExp(`^${key}=`, 'm').test(envExample), `sub0/env.example is missing ${key}`)
}

const readme = await readFile(path.join(sub0Dir, 'README.md'), 'utf8')
check(readme.includes('demo2026'), 'sub0/README.md must document the demo password')
check(
  readme.includes('Sub0 has no local runtime'),
  'sub0/README.md must identify dashboard-only runtime verification',
)
check(
  readme.includes('must start with `sk_test_`'),
  'sub0/README.md must document the Paystack test-key requirement',
)

if (errors.length > 0) {
  console.error(`Sub0 validation failed with ${errors.length} error(s):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log(
    `Sub0 validation passed: ${models.size} models, ${resources.size} resources, strict JSON and security invariants verified.`,
  )
}
