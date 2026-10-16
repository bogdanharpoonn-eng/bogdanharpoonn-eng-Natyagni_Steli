import { create } from 'zustand'
import {
  createEmptyOrder,
  getOrderAutosave,
  getOrderRepository,
  type Order,
  type OrderStatus,
} from '@/data'
import { createRoomFromTemplate, type RoomTemplateId } from '@/features/room/templates'

interface OrdersState {
  orders: Order[]
  current: Order | null
  search: string
  loading: boolean
  error: string | null
  setSearch: (search: string) => void
  refreshList: () => Promise<void>
  loadOrder: (orderId: string) => Promise<void>
  createOrder: () => Promise<Order>
  deleteOrder: (orderId: string) => Promise<void>
  updateClient: (patch: Partial<Order['client']>) => void
  updateNote: (note: string) => void
  updateStatus: (status: OrderStatus) => void
  addRoom: (template: RoomTemplateId, customCorners?: number) => string | null
  removeRoom: (roomId: string) => void
  flushSave: () => Promise<void>
}

function scheduleCurrent(order: Order): void {
  getOrderAutosave().schedule(order)
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  current: null,
  search: '',
  loading: false,
  error: null,

  setSearch(search) {
    set({ search })
  },

  async refreshList() {
    set({ loading: true, error: null })
    try {
      await getOrderAutosave().flush()
      const orders = await getOrderRepository().listOrders({
        search: get().search || undefined,
      })
      set({ orders, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Помилка списку',
      })
    }
  },

  async loadOrder(orderId) {
    set({ loading: true, error: null })
    try {
      await getOrderAutosave().flush()
      const current = await getOrderRepository().getOrder(orderId)
      if (!current) {
        set({ current: null, loading: false, error: 'Замовлення не знайдено' })
        return
      }
      set({ current, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Помилка замовлення',
      })
    }
  },

  async createOrder() {
    const order = createEmptyOrder()
    await getOrderRepository().saveOrder(order)
    set({ current: order })
    await get().refreshList()
    return order
  },

  async deleteOrder(orderId) {
    await getOrderAutosave().flush()
    await getOrderRepository().deleteOrder(orderId)
    if (get().current?.id === orderId) set({ current: null })
    await get().refreshList()
  },

  updateClient(patch) {
    const current = get().current
    if (!current) return
    const next = {
      ...current,
      client: { ...current.client, ...patch },
    }
    scheduleCurrent(next)
    set({ current: next })
  },

  updateNote(note) {
    const current = get().current
    if (!current) return
    const next = { ...current, note }
    scheduleCurrent(next)
    set({ current: next })
  },

  updateStatus(status) {
    const current = get().current
    if (!current) return
    const next = { ...current, status }
    scheduleCurrent(next)
    set({ current: next })
  },

  addRoom(template, customCorners = 5) {
    const current = get().current
    if (!current) return null
    const index = current.rooms.length + 1
    const room = createRoomFromTemplate(template, `Приміщення ${index}`, customCorners)
    const next = { ...current, rooms: [...current.rooms, room] }
    scheduleCurrent(next)
    set({ current: next })
    return room.id
  },

  removeRoom(roomId) {
    const current = get().current
    if (!current) return
    const next = { ...current, rooms: current.rooms.filter((r) => r.id !== roomId) }
    scheduleCurrent(next)
    set({ current: next })
  },

  async flushSave() {
    await getOrderAutosave().flush()
  },
}))
