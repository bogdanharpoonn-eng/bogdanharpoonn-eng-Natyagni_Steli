import { orderSchema, SCHEMA_VERSION, type Order } from '@/data'

export interface OrderExportEnvelope {
  format: 'zamir-order'
  formatVersion: 1
  schemaVersion: typeof SCHEMA_VERSION
  exportedAt: string
  order: Order
}

export function orderToJson(order: Order): string {
  const parsed = orderSchema.parse(order)
  const envelope: OrderExportEnvelope = {
    format: 'zamir-order',
    formatVersion: 1,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    order: parsed,
  }
  return `${JSON.stringify(envelope, null, 2)}\n`
}

export function orderFromJson(raw: string): Order {
  const data = JSON.parse(raw) as unknown
  if (!data || typeof data !== 'object') {
    throw new Error('Невірний JSON')
  }
  const obj = data as Record<string, unknown>
  // Accept envelope or bare order
  const orderCandidate =
    obj.format === 'zamir-order' && obj.order && typeof obj.order === 'object'
      ? obj.order
      : data
  return orderSchema.parse(orderCandidate)
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safeFilename(part: string): string {
  const cleaned = part.trim().replace(/[^\w\-а-яА-ЯіІїЇєЄґҐ ]+/g, '_').slice(0, 40)
  return cleaned || 'order'
}
