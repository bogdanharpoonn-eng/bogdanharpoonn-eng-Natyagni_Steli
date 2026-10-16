import { expect, test } from '@playwright/test'

async function fillSide(
  page: import('@playwright/test').Page,
  from: string,
  to: string,
  value: string,
) {
  const input = page.getByTestId(`side-${from}-${to}`)
  await input.fill(value)
  await input.blur()
}

async function fillDiag(
  page: import('@playwright/test').Page,
  from: string,
  to: string,
  value: string,
) {
  const input = page.getByTestId(`diag-${from}-${to}`)
  await input.fill(value)
  await input.blur()
}

test('main survey flow: order → rectangle room → area 12.00 (≤60s)', async ({ page }) => {
  const started = Date.now()
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
    await fillSide(page, from, to, value)
  }

  await fillDiag(page, 'A', 'C', '500')

  await expect(page.getByTestId('room-area')).toContainText('12.00')
  expect(Date.now() - started).toBeLessThan(60_000)
})

test('L-shape room → area 9.00 (≤120s)', async ({ page }) => {
  test.setTimeout(120_000)
  const started = Date.now()
  await page.goto('/')
  await page.getByTestId('new-order').click()
  await page.getByTestId('client-name').fill('Тест Г')
  await page.getByTestId('add-room').click()
  await page.getByTestId('template-lshape').click()
  await expect(page.getByTestId('room-screen')).toBeVisible()

  const sides = [
    ['A', 'B', '200'],
    ['B', 'C', '150'],
    ['C', 'D', '200'],
    ['D', 'E', '150'],
    ['E', 'F', '400'],
    ['F', 'A', '300'],
  ] as const

  for (const [from, to, value] of sides) {
    await fillSide(page, from, to, value)
  }

  await expect(page.getByTestId('diag-A-C')).toBeVisible()
  await fillDiag(page, 'A', 'C', '250')
  await fillDiag(page, 'A', 'D', '427.2')
  await fillDiag(page, 'A', 'E', '500')

  await expect(page.getByTestId('room-area')).toContainText('9.00')
  expect(Date.now() - started).toBeLessThan(120_000)
})

test('reload mid-entry keeps client name (autosave)', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('new-order').click()
  await expect(page.getByTestId('order-screen')).toBeVisible()

  const name = `Persist ${Date.now()}`
  await page.getByTestId('client-name').fill(name)
  await page.getByTestId('client-name').blur()
  // Autosave delayMs=150; give IndexedDB time to flush
  await page.waitForTimeout(600)
  await page.reload()
  await expect(page.getByTestId('orders-title')).toBeVisible()
  await expect(page.getByText(name)).toBeVisible()
  await page.getByText(name).click()
  await expect(page.getByTestId('order-screen')).toBeVisible()
  await expect(page.getByTestId('client-name')).toHaveValue(name)
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
