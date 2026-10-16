import type { ZamirDatabase } from './db'
import { getDb } from './db'
import { orderSchema, type Order } from './schemas'
import type { OrderListQuery, OrderRepository } from './repository'

function matchesSearch(order: Order, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  const { name, phone, address } = order.client
  return (
    name.toLowerCase().includes(q) ||
    phone.toLowerCase().includes(q) ||
    address.toLowerCase().includes(q)
  )
}

export class DexieOrderRepository implements OrderRepository {
  constructor(private readonly db: ZamirDatabase = getDb()) {}

  async listOrders(query?: OrderListQuery): Promise<Order[]> {
    const all = await this.db.orders.orderBy('updatedAt').reverse().toArray()
    const search = query?.search
    const filtered = search ? all.filter((o) => matchesSearch(o, search)) : all
    return filtered.map((o) => orderSchema.parse(o))
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const row = await this.db.orders.get(id)
    return row ? orderSchema.parse(row) : undefined
  }

  async saveOrder(order: Order): Promise<Order> {
    const parsed = orderSchema.parse(order)
    await this.db.orders.put(parsed)
    return parsed
  }

  async deleteOrder(id: string): Promise<void> {
    await this.db.orders.delete(id)
  }
}
