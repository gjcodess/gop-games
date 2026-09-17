import { expect, test } from '@playwright/test'

test('foundation shell is usable on a phone viewport', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('GOP Games')
  await expect(page.getByRole('heading', { name: /make every match feel alive/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeAttached()
})
