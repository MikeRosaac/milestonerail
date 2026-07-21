import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium, devices } from '@playwright/test'

const baseUrl = 'http://127.0.0.1:4174'
const outputDirectory = new URL('../docs/screenshots/', import.meta.url)

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Vite did not become ready for screenshot capture.')
}

async function openAccountMenu(page, name) {
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click()
}

const server = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174'],
  {
    env: { ...process.env, VITE_DEMO_MODE: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

server.stdout.on('data', (chunk) => process.stdout.write(chunk))
server.stderr.on('data', (chunk) => process.stderr.write(chunk))

try {
  await waitForServer()
  await mkdir(outputDirectory, { recursive: true })
  const browser = await chromium.launch()
  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
    })
    const page = await desktop.newPage()

    await page.goto(baseUrl)
    await page.screenshot({
      path: new URL('01-landing-rail.png', outputDirectory).pathname,
      fullPage: true,
    })

    await page.getByRole('link', { name: 'Open local demo', exact: true }).click()
    await page.getByRole('button', { name: 'Continue as demo Learner', exact: true }).click()
    await page.getByRole('heading', { name: 'Keep moving, Amara' }).waitFor()
    await page.screenshot({
      path: new URL('02-learner-milestones.png', outputDirectory).pathname,
      fullPage: true,
    })

    await page.getByRole('button', { name: 'Submit evidence', exact: true }).click()
    const evidenceDialog = page.getByRole('dialog', { name: 'Submit evidence' })
    await evidenceDialog
      .getByRole('textbox', { name: /Evidence URL/ })
      .fill('https://example.com/amara-api-capstone')
    await evidenceDialog
      .getByRole('textbox', { name: 'Context note' })
      .fill('Review the deployed API workflow, authentication path, and retry behavior.')
    await page.screenshot({
      path: new URL('03-learner-evidence.png', outputDirectory).pathname,
      fullPage: false,
    })
    await evidenceDialog.getByRole('button', { name: 'Send to mentor' }).click()

    await openAccountMenu(page, 'Amara Okafor')
    await page.getByRole('menuitem', { name: 'Mentor', exact: true }).click()
    await page.getByRole('searchbox', { name: 'Search review queue' }).fill('Amara')
    await page
      .getByRole('article')
      .filter({ hasText: 'Amara Okafor' })
      .filter({ hasText: 'API capstone' })
      .getByRole('button', { name: 'Review', exact: true })
      .click()
    await page.screenshot({
      path: new URL('04-mentor-rubric.png', outputDirectory).pathname,
      fullPage: false,
    })
    await page
      .getByRole('dialog', { name: 'Review milestone evidence' })
      .getByRole('button', { name: 'Approve milestone' })
      .click()

    await openAccountMenu(page, 'David Mensah')
    await page.getByRole('menuitem', { name: 'Finance', exact: true }).click()
    await page.getByRole('searchbox', { name: 'Search eligible payouts' }).fill('Amara')
    await page
      .getByRole('article')
      .filter({ hasText: 'Amara Okafor' })
      .filter({ hasText: 'API capstone' })
      .getByRole('button', { name: 'Authorize test payout' })
      .click()
    const payoutDialog = page.getByRole('dialog', { name: 'Authorize test payout' })
    await payoutDialog
      .getByRole('checkbox', { name: /I confirm this is a Paystack test action/ })
      .check()
    await page.screenshot({
      path: new URL('05-finance-controls.png', outputDirectory).pathname,
      fullPage: false,
    })
    await payoutDialog.getByRole('button', { name: 'Authorize Paystack test' }).click()
    await page.getByText('Signed webhook received', { exact: true }).waitFor({ timeout: 10_000 })
    await page.getByRole('link', { name: 'Audit', exact: true }).click()
    await page.getByRole('searchbox', { name: 'Search audit events' }).fill('msr_test_402_')
    await page.getByText('Provider reference:', { exact: false }).waitFor()
    await page.screenshot({
      path: new URL('06-audit-provider-event.png', outputDirectory).pathname,
      fullPage: true,
    })

    await openAccountMenu(page, 'Fatima Bello')
    await page.getByRole('menuitem', { name: 'Admin', exact: true }).click()
    await page.getByRole('link', { name: 'Workflow', exact: true }).click()
    await page.getByRole('heading', { name: 'Visual workflow studio' }).waitFor()
    await page.getByText('Mentor review', { exact: true }).first().click()
    await page.screenshot({
      path: new URL('07-workflow-studio.png', outputDirectory).pathname,
      fullPage: true,
    })
    await desktop.close()

    const mobile = await browser.newContext({
      ...devices['Pixel 7'],
      colorScheme: 'light',
    })
    const mobilePage = await mobile.newPage()
    await mobilePage.goto(`${baseUrl}/sign-in`)
    await mobilePage.getByRole('button', { name: 'Continue as demo Learner', exact: true }).click()
    await mobilePage.getByRole('heading', { name: 'Keep moving, Amara' }).waitFor()
    await mobilePage.screenshot({
      path: new URL('08-mobile-milestones.png', outputDirectory).pathname,
      fullPage: true,
    })
    await mobile.close()
  } finally {
    await browser.close()
  }
  console.log('Captured eight sanitized local-demo screenshots in docs/screenshots/.')
} finally {
  server.kill('SIGTERM')
}
