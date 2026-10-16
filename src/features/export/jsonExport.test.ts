import { describe, expect, it } from 'vitest'
import { createEmptyOrder, createEmptyRoom } from '@/data'
import { orderFromJson, orderToJson } from './jsonExport'

describe('order JSON export/import', () => {
  it('round-trips an order envelope', () => {
    const order = createEmptyOrder()
    order.client = { name: 'Тест', phone: '123', address: 'Київ' }
    order.rooms = [createEmptyRoom('Кухня')]

    const json = orderToJson(order)
    const restored = orderFromJson(json)

    expect(restored.id).toBe(order.id)
    expect(restored.client.name).toBe('Тест')
    expect(restored.rooms[0]?.name).toBe('Кухня')
  })

  it('accepts bare order JSON', () => {
    const order = createEmptyOrder()
    const restored = orderFromJson(JSON.stringify(order))
    expect(restored.id).toBe(order.id)
  })
})
