import { expect, test } from '@playwright/test'

test('main survey flow: order → rectangle room → area 12.00', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('orders-title')).toBeVisible()

  await page.getByTestId('new-order').click()
  await expect(page.getByTestId('order-screen')).toBeVisible()

  await page.getByTestId('client-name').fill('Тест Е2Е')
  await page.getByTestId('add-room').click()
  await page.getByTestId('template-rectangle').click()

  await expect(page.getByTestId('room-screen')).toBeVisible()

  const sides = [
    ['A', 'B', '400'],
    ['B', 'C', '300'],
    ['C', 'D', '400'],
    ['D', 'A', '300'],
  ] as const

  for (const [from, to, value] of sides) {
    const input = page.getByTestId(`side-${from}-${to}`)
    await input.fill(value)
    await input.blur()
  }

  const diag = page.getByTestId('diag-A-C')
  await diag.fill('500')
  await diag.blur()

  await expect(page.getByTestId('room-area')).toContainText('12.00')
})

test('settings screen opens and toggles theme', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('open-settings').click()
  await expect(page.getByRole('heading', { name: 'Налаштування' })).toBeVisible()
  await page.getByRole('button', { name: 'Світла (на сонці)' }).click()
  await expect(page.locator('html')).toHaveClass(/light/)
  await page.getByRole('button', { name: 'Темна' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
