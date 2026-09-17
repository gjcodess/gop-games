import { expect, test } from '@playwright/test'

test('foundation shell is usable on a phone viewport', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('GOP Games')
  await expect(page.getByRole('heading', { name: /make every match feel alive/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeAttached()
})

test('keyboard users can reach the skip link and theme control', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeFocused()

  const themeToggle = page.getByRole('button', { name: /switch to (light|dark) mode/i })
  const initialLabel = await themeToggle.getAttribute('aria-label')
  await themeToggle.click()
  await expect(themeToggle).toHaveAttribute('aria-label', /switch to (light|dark) mode/i)
  await expect.poll(async () => themeToggle.getAttribute('aria-label')).not.toBe(initialLabel)
})

test('reduced motion keeps essential controls available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeEnabled()
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeAttached()
})

test('password visibility can be toggled without changing the field value', async ({ page }) => {
  await page.goto('/login')

  const password = page.getByLabel('Password')
  await password.fill('test-password')
  await page.getByRole('button', { name: 'Show' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(password).toHaveValue('test-password')

  await page.getByRole('button', { name: 'Hide' }).click()
  await expect(password).toHaveAttribute('type', 'password')
})
