import { expect, test } from '@playwright/test'

test('unauthenticated players are redirected to sign in before entering the game room', async ({ page }) => {
  await page.goto('/app')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')
})
