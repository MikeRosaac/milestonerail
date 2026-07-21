import { expect, test, type Page } from '@playwright/test'

type DemoRole = 'Learner' | 'Mentor' | 'Finance' | 'Admin'

const accountButtonNames: Record<DemoRole, RegExp> = {
  Learner: /Amara Okafor/i,
  Mentor: /David Mensah/i,
  Finance: /Fatima Bello/i,
  Admin: /Nia Adeyemi/i,
}

async function enterDemo(page: Page, role: DemoRole) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open local demo', exact: true }).click()
  await page.getByRole('button', { name: `Continue as demo ${role}`, exact: true }).click()
}

async function switchDemoRole(page: Page, currentRole: DemoRole, nextRole: DemoRole) {
  await page.getByRole('button', { name: accountButtonNames[currentRole] }).click()
  await page.getByRole('menuitem', { name: nextRole, exact: true }).click()
}

test('learner evidence reaches a signed Paystack test payout and audit event', async ({ page }) => {
  await enterDemo(page, 'Learner')
  await expect(page.getByRole('heading', { name: 'Keep moving, Amara' })).toBeVisible()

  await page.getByRole('button', { name: 'Submit evidence', exact: true }).click()
  const evidenceDialog = page.getByRole('dialog', { name: 'Submit evidence' })
  await evidenceDialog
    .getByRole('textbox', { name: /Evidence URL/ })
    .fill('https://example.com/amara-api-capstone')
  await evidenceDialog
    .getByRole('textbox', { name: 'Context note' })
    .fill('Review the deployed API workflow, authentication path, and retry behavior.')
  await evidenceDialog.getByRole('button', { name: 'Send to mentor' }).click()
  await expect(page.getByRole('status')).toContainText('Evidence sent to mentor')
  await expect(page.getByRole('status')).toContainText(
    'API capstone is now in the mentor review queue',
  )

  await switchDemoRole(page, 'Learner', 'Mentor')
  await expect(page.getByRole('heading', { name: 'Evidence review queue' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search review queue' }).fill('Amara Okafor')
  const amaraReview = page
    .getByRole('article')
    .filter({ hasText: 'Amara Okafor' })
    .filter({ hasText: 'API capstone' })
  await expect(amaraReview).toHaveCount(1)
  await amaraReview.getByRole('button', { name: 'Review', exact: true }).click()

  const reviewDialog = page.getByRole('dialog', { name: 'Review milestone evidence' })
  await expect(reviewDialog).toContainText('https://example.com/amara-api-capstone')
  await expect(reviewDialog).toContainText(
    'Review the deployed API workflow, authentication path, and retry behavior.',
  )
  await reviewDialog.getByRole('button', { name: 'Approve milestone' }).click()
  await expect(page.getByRole('status')).toContainText('Review decision saved')
  await expect(page.getByRole('status')).toContainText(
    'Amara Okafor’s API capstone is finance-ready',
  )

  await switchDemoRole(page, 'Mentor', 'Finance')
  await expect(page.getByRole('heading', { name: 'Stipend authorization' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search eligible payouts' }).fill('Amara Okafor')
  const amaraPayout = page
    .getByRole('article')
    .filter({ hasText: 'Amara Okafor' })
    .filter({ hasText: 'API capstone' })
  await expect(amaraPayout).toHaveCount(1)
  await amaraPayout.getByRole('button', { name: 'Authorize test payout' }).click()

  const authorizationDialog = page.getByRole('dialog', { name: 'Authorize test payout' })
  await authorizationDialog
    .getByRole('checkbox', { name: /I confirm this is a Paystack test action/ })
    .check()
  await authorizationDialog.getByRole('button', { name: 'Authorize Paystack test' }).click()

  await expect(page.getByRole('status')).toContainText('Signed webhook received', {
    timeout: 10_000,
  })
  await expect(page.getByRole('status')).toContainText('Amara Okafor now has a paid test record')

  await page.getByRole('link', { name: 'Audit', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Shared event history' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search audit events' }).fill('msr_test_402_')

  const paidEvent = page
    .getByRole('article')
    .filter({ hasText: 'Test payout confirmed' })
    .filter({ hasText: 'Amara Okafor' })
    .filter({ hasText: 'API capstone' })
  await expect(paidEvent).toHaveCount(1)
  await expect(paidEvent).toContainText('Signed webhook confirmed NGN 45,000 as paid.')
  await expect(paidEvent).toContainText(/Provider reference: msr_test_402_\d+/)
})

test('admin adds and persists an approval gate in workflow studio', async ({ page }) => {
  await enterDemo(page, 'Admin')
  await page.getByRole('link', { name: 'Workflow', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Visual workflow studio' })).toBeVisible()

  await page.getByRole('button', { name: 'Add approval', exact: true }).click()
  await page.getByRole('textbox', { name: 'Gate label' }).fill('Compliance approval')
  await page
    .getByRole('textbox', { name: 'Description' })
    .fill('Compliance verifies the approval packet before provider handoff.')
  await page.getByRole('combobox', { name: 'Assigned role' }).selectOption('admin')
  await page.getByRole('spinbutton', { name: 'SLA hours' }).fill('12')

  await page.getByRole('button', { name: 'Save workflow' }).click()
  await expect(page.getByRole('status')).toContainText('Workflow persisted')
  await expect(page.getByText('Compliance approval', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Overview', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Good afternoon, operations team' })).toBeVisible()
  await page.getByRole('link', { name: 'Workflow', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Visual workflow studio' })).toBeVisible()
  await expect(page.getByText('Compliance approval', { exact: true })).toBeVisible()
  await expect(page.getByText('Human approvals').locator('..')).toContainText('3')
  await expect(page.getByText('Total stages').locator('..')).toContainText('6')
})
