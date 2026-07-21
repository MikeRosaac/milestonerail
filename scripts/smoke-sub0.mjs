import process from 'node:process'

const help = `
MilestoneRail deployed Sub0 smoke checks

Required:
  SUB0_BASE_URL
  SUB0_SMOKE_EMAIL
  SUB0_SMOKE_PASSWORD

Optional:
  SUB0_SMOKE_EXPECTED_ROLE=learner|mentor|finance|admin
  SUB0_SMOKE_RUN_SEED=true
  SUB0_SMOKE_SEED_SECRET
  SUB0_SMOKE_SEED_PASSWORD
  SUB0_SMOKE_ALLOW_HTTP=true
  SUB0_SMOKE_TIMEOUT_MS=15000

The default run is read-only apart from sign-in rate-limit accounting. The seed is
run only when explicitly enabled. This script never invokes a payout.
`.trim()

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(help)
  process.exit(0)
}

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required. Run with --help for usage.`)
  return value
}

const baseUrl = required('SUB0_BASE_URL').replace(/\/+$/, '')
const email = required('SUB0_SMOKE_EMAIL')
const password = required('SUB0_SMOKE_PASSWORD')
const expectedRole = process.env.SUB0_SMOKE_EXPECTED_ROLE?.trim()
const allowHttp = process.env.SUB0_SMOKE_ALLOW_HTTP === 'true'
const timeoutMs = Number(process.env.SUB0_SMOKE_TIMEOUT_MS ?? 15000)

if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) {
  throw new Error('SUB0_SMOKE_TIMEOUT_MS must be between 1000 and 120000.')
}

const parsedBaseUrl = new URL(baseUrl)
if (parsedBaseUrl.protocol !== 'https:' && !allowHttp) {
  throw new Error('SUB0_BASE_URL must use HTTPS unless SUB0_SMOKE_ALLOW_HTTP=true.')
}

if (expectedRole && !['learner', 'mentor', 'finance', 'admin'].includes(expectedRole)) {
  throw new Error('SUB0_SMOKE_EXPECTED_ROLE is not a supported MilestoneRail role.')
}

async function post(route, { body = {}, token, headers = {}, expectFailure = false } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${baseUrl}/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await response.text()
    let payload = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        throw new Error(`${route} returned non-JSON content with HTTP ${response.status}.`)
      }
    }
    if (expectFailure) return { response, payload }
    if (!response.ok) {
      const message = payload?.message ?? payload?.error ?? text ?? 'no response body'
      throw new Error(`${route} failed with HTTP ${response.status}: ${message}`)
    }
    return { response, payload }
  } finally {
    clearTimeout(timeout)
  }
}

function dataOf(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data
  return payload
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

if (process.env.SUB0_SMOKE_RUN_SEED === 'true') {
  const seedSecret = required('SUB0_SMOKE_SEED_SECRET')
  const seedPassword = required('SUB0_SMOKE_SEED_PASSWORD')
  const { payload } = await post('admin/demo-seed', {
    body: { password: seedPassword },
    headers: { 'X-Seed-Secret': seedSecret },
  })
  const seed = dataOf(payload)
  assert(
    seed && typeof seed === 'object' && Number(seed.userCount) >= 4,
    'Demo seed did not return its expected count object.',
  )
  console.log('✓ Admin-protected demo seed completed')
}

const unauthorized = await post('dashboard', { expectFailure: true })
assert(
  unauthorized.response.status === 401 || unauthorized.response.status === 403,
  `Unauthenticated dashboard should return 401/403, received ${unauthorized.response.status}.`,
)
console.log('✓ Protected dashboard rejects anonymous requests')

const signInResult = await post('auth/sign-in', { body: { email, password } })
const session = dataOf(signInResult.payload)
assert(session && typeof session === 'object', 'Sign-in response data must be an object.')
assert(typeof session.token === 'string' && session.token.length > 20, 'Sign-in token is missing.')
assert(Number.isFinite(Number(session.id)), 'Sign-in id is missing or not numeric.')
assert(
  Number.isFinite(Number(session.organizationId)),
  'Sign-in organizationId is missing or not numeric.',
)
assert(['learner', 'mentor', 'finance', 'admin'].includes(session.role), 'Sign-in role is invalid.')
assert(
  session.email?.toLowerCase() === email.toLowerCase(),
  'Sign-in response email does not match the requested account.',
)
if (expectedRole) {
  assert(session.role === expectedRole, `Expected role ${expectedRole}, received ${session.role}.`)
}
console.log('✓ Bcrypt-backed sign-in returned the expected session shape')

const dashboardResult = await post('dashboard', { token: session.token })
const dashboard = dataOf(dashboardResult.payload)
assert(
  !Array.isArray(dashboard),
  'Dashboard returned an array; apply the README single-row setting.',
)
assert(dashboard && typeof dashboard === 'object', 'Dashboard data must be an object.')
for (const key of ['cohort', 'summary', 'activity', 'submissions', 'payouts', 'events']) {
  assert(key in dashboard, `Dashboard data is missing ${key}.`)
}
for (const key of ['activity', 'submissions', 'payouts', 'events']) {
  assert(Array.isArray(dashboard[key]), `Dashboard ${key} must be an array.`)
}
assert(
  dashboard.cohort &&
    Number.isFinite(Number(dashboard.cohort.organizationId)) &&
    typeof dashboard.cohort.programName === 'string',
  'Dashboard cohort does not match the camelCase client contract.',
)
assert(
  dashboard.summary &&
    Number.isFinite(Number(dashboard.summary.activeLearners)) &&
    Number.isFinite(Number(dashboard.summary.completionRate)),
  'Dashboard summary does not match the client contract.',
)
console.log('✓ Dashboard matches the camelCase DashboardData shape')

const workflowResult = await post('workflows/list', { token: session.token })
const workflow = dataOf(workflowResult.payload)
assert(Array.isArray(workflow), 'workflows/list data must be an array.')
for (const step of workflow) {
  assert(
    Number.isFinite(Number(step.id)) &&
      Number.isFinite(Number(step.cohortId)) &&
      typeof step.label === 'string' &&
      typeof step.active === 'boolean',
    'A workflow step does not match the camelCase client contract.',
  )
}
console.log(`✓ Workflow list returned ${workflow.length} scoped step(s)`)
console.log('Sub0 smoke checks passed; no payout endpoint was invoked.')
