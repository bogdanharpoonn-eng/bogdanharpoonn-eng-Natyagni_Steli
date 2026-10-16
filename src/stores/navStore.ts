import { create } from 'zustand'

export type AppScreen =
  | { name: 'orders' }
  | { name: 'order'; orderId: string }
  | { name: 'room'; orderId: string; roomId: string }
  | { name: 'settings' }

interface NavState {
  screen: AppScreen
  goOrders: () => void
  goOrder: (orderId: string) => void
  goRoom: (orderId: string, roomId: string) => void
  goSettings: () => void
}

export const useNavStore = create<NavState>((set) => ({
  screen: { name: 'orders' },
  goOrders: () => set({ screen: { name: 'orders' } }),
  goOrder: (orderId) => set({ screen: { name: 'order', orderId } }),
  goRoom: (orderId, roomId) => set({ screen: { name: 'room', orderId, roomId } }),
  goSettings: () => set({ screen: { name: 'settings' } }),
}))
