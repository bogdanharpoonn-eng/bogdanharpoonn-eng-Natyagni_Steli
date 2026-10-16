import { create } from 'zustand'
import {
  buildRoom,
  suggestMissingDiagonals,
  type BuildRoomResult,
  type BuildRoomSuccess,
  type SuggestedDiagonal,
} from '@/core/geometry'
import {
  getOrderAutosave,
  getOrderRepository,
  roomToBuildInput,
  type Order,
  type Room,
} from '@/data'
import { resizeRoomCorners } from '@/features/room/createPolygonRoom'
import { parseLengthInput } from '@/features/room/labels'
import { applyTemplateToRoom, type RoomTemplateId } from '@/features/room/templates'
import { useSettingsStore } from '@/stores/settingsStore'

function activeRoom(order: Order, roomId: string): Room | undefined {
  return order.rooms.find((r) => r.id === roomId)
}

function replaceRoom(order: Order, room: Room): Order {
  return {
    ...order,
    rooms: order.rooms.map((r) => (r.id === room.id ? room : r)),
  }
}

function currentTolerance(): number {
  return useSettingsStore.getState().toleranceMm
}

function recompute(
  room: Room,
  toleranceMm: number,
  prevSuccess: BuildRoomSuccess | null,
): { result: BuildRoomResult | null; lastSuccess: BuildRoomSuccess | null } {
  const sidesReady = room.sides.length >= 3 && room.sides.every((s) => s.length > 0)
  if (!sidesReady) {
    return { result: null, lastSuccess: prevSuccess }
  }
  const input = roomToBuildInput(room, toleranceMm)
  input.diagonals = input.diagonals.filter((d) => d.length > 0)
  const result = buildRoom(input)
  return {
    result,
    lastSuccess: result.ok ? result : prevSuccess,
  }
}

export interface RoomSessionState {
  order: Order | null
  roomId: string | null
  result: BuildRoomResult | null
  lastSuccess: BuildRoomSuccess | null
  loading: boolean
  loadError: string | null
  openRoom: (orderId: string, roomId: string) => Promise<void>
  recomputeActive: () => void
  getRoom: () => Room | null
  setRoomName: (name: string) => void
  setCornerCount: (n: number) => void
  applyTemplate: (template: RoomTemplateId, customCorners?: number) => void
  setSideCm: (from: string, to: string, rawCm: string) => void
  setDiagonalCm: (from: string, to: string, rawCm: string, isControl?: boolean) => void
  toggleDiagonalControl: (from: string, to: string) => void
  setCornerType: (label: string, cornerType: 'internal' | 'external') => void
  suggestedDiagonals: () => SuggestedDiagonal[]
  flushSave: () => Promise<void>
}

function applyRoomUpdate(roomUpdater: (room: Room) => Room): void {
  const state = useRoomSessionStore.getState()
  const { order, roomId, lastSuccess } = state
  if (!order || !roomId) return
  const room = activeRoom(order, roomId)
  if (!room) return
  const nextOrder = replaceRoom(order, roomUpdater(room))
  const nextRoom = activeRoom(nextOrder, roomId)!
  const computed = recompute(nextRoom, currentTolerance(), lastSuccess)
  getOrderAutosave().schedule(nextOrder)
  useRoomSessionStore.setState({
    order: nextOrder,
    result: computed.result,
    lastSuccess: computed.lastSuccess,
  })
}

export const useRoomSessionStore = create<RoomSessionState>((set, get) => ({
  order: null,
  roomId: null,
  result: null,
  lastSuccess: null,
  loading: false,
  loadError: null,

  async openRoom(orderId, roomId) {
    set({ loading: true, loadError: null, order: null, roomId: null, result: null, lastSuccess: null })
    try {
      await getOrderAutosave().flush()
      const order = await getOrderRepository().getOrder(orderId)
      if (!order) {
        set({ loading: false, loadError: 'Замовлення не знайдено' })
        return
      }
      const room = activeRoom(order, roomId)
      if (!room) {
        set({ loading: false, loadError: 'Приміщення не знайдено' })
        return
      }
      const { result, lastSuccess } = recompute(room, currentTolerance(), null)
      set({ order, roomId, result, lastSuccess, loading: false })
    } catch (error) {
      set({
        loading: false,
        loadError: error instanceof Error ? error.message : 'Помилка завантаження',
      })
    }
  },

  recomputeActive() {
    const { order, roomId, lastSuccess } = get()
    if (!order || !roomId) return
    const room = activeRoom(order, roomId)
    if (!room) return
    const computed = recompute(room, currentTolerance(), lastSuccess)
    set({ result: computed.result, lastSuccess: computed.lastSuccess })
  },

  getRoom() {
    const { order, roomId } = get()
    if (!order || !roomId) return null
    return activeRoom(order, roomId) ?? null
  },

  setRoomName(name) {
    applyRoomUpdate((room) => ({ ...room, name }))
  },

  setCornerCount(n) {
    applyRoomUpdate((room) => resizeRoomCorners(room, n))
  },

  applyTemplate(template, customCorners = 5) {
    applyRoomUpdate((room) => applyTemplateToRoom(room, template, customCorners))
  },

  setSideCm(from, to, raw) {
    const unit = useSettingsStore.getState().lengthUnit
    const lengthMm = parseLengthInput(raw, unit)
    const length = lengthMm === null ? 0 : lengthMm
    applyRoomUpdate((room) => ({
      ...room,
      sides: room.sides.map((s) =>
        (s.from === from && s.to === to) || (s.from === to && s.to === from)
          ? { ...s, length }
          : s,
      ),
    }))
  },

  setDiagonalCm(from, to, raw, isControl = false) {
    const unit = useSettingsStore.getState().lengthUnit
    const lengthMm = parseLengthInput(raw, unit)
    applyRoomUpdate((room) => {
      const diagonals = [...room.diagonals]
      const idx = diagonals.findIndex(
        (d) =>
          (d.from === from && d.to === to) || (d.from === to && d.to === from),
      )
      if (lengthMm === null || lengthMm === 0) {
        if (idx >= 0) diagonals.splice(idx, 1)
      } else if (idx >= 0) {
        diagonals[idx] = { ...diagonals[idx], length: lengthMm }
      } else {
        diagonals.push({ from, to, length: lengthMm, isControl })
      }
      return { ...room, diagonals }
    })
  },

  toggleDiagonalControl(from, to) {
    applyRoomUpdate((room) => ({
      ...room,
      diagonals: room.diagonals.map((d) =>
        (d.from === from && d.to === to) || (d.from === to && d.to === from)
          ? { ...d, isControl: !d.isControl }
          : d,
      ),
    }))
  },

  setCornerType(label, cornerType) {
    applyRoomUpdate((room) => ({
      ...room,
      vertices: room.vertices.map((v) =>
        v.label === label ? { ...v, cornerType } : v,
      ),
    }))
  },

  suggestedDiagonals() {
    const room = get().getRoom()
    if (!room) return []
    const labels = room.vertices.map((v) => v.label)
    const construction = room.diagonals
      .filter((d) => !d.isControl && d.length > 0)
      .map((d) => [labels.indexOf(d.from), labels.indexOf(d.to)] as [number, number])
      .filter(([i, j]) => i >= 0 && j >= 0)
    return suggestMissingDiagonals(labels.length, labels, construction)
  },

  async flushSave() {
    await getOrderAutosave().flush()
  },
}))

// Recompute geometry when tolerance changes while a room is open
useSettingsStore.subscribe((state, prev) => {
  if (state.toleranceMm !== prev.toleranceMm) {
    useRoomSessionStore.getState().recomputeActive()
  }
})
