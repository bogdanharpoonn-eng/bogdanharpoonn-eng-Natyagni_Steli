import type { Order } from './schemas'

export interface OrderListQuery {
  /** Case-insensitive substring match on name, phone, or address */
  search?: string
}

/**
 * Persistence port — IndexedDB today, remote sync later without rewriting UI.
 */
export interface OrderRepository {
  listOrders(query?: OrderListQuery): Promise<Order[]>
  getOrder(id: string): Promise<Order | undefined>
  /** Insert or update; implementation should bump updatedAt if needed by caller. */
  saveOrder(order: Order): Promise<Order>
  deleteOrder(id: string): Promise<void>
}
