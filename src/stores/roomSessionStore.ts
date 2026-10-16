import { create } from 'zustand'
import {
  buildRoom,
  cmToMm,
  DEFAULT_TOLERANCE_MM,
  suggestMissingDiagonals,
  type BuildRoomResult,
  type BuildRoomSuccess,
  type SuggestedDiagonal,
} from '@/core/geometry'
import {
  createAutosave,
  createEmptyOrder,
  DexieOrderRepository,
  roomToBuildInput,
  type AutosaveController,
  type Order,
  type Room,
} from '@/data'
import { createPolygonRoom, resizeRoomCorners } from '@/features/room/createPolygonRoom'
import { parseCmInput } from '@/features/room/labels'

const repo = new DexieOrderRepository()
let autosave: AutosaveController | undefined

function getAutosave(): AutosaveController {
  if (!autosave) {
    autosave = createAutosave(repo, { delayMs: 150 })
  }
  return autosave
}

function activeRoom(order: Order, roomId: string): Room | undefined {
  return order.rooms.find((r) => r.id === roomId)
}

function replaceRoom(order: Order, room: Room): Order {
  return {
    ...order,
    rooms: order.rooms.map((r) => (r.id === room.id ? room : r)),
  }
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
  toleranceMm: number
  result: BuildRoomResult | null
  lastSuccess: BuildRoomSuccess | null
  booting: boolean
  bootError: string | null
  boot: () => Promise<void>
  getRoom: () => Room | null
  setRoomName: (name: string) => void
  setCornerCount: (n: number) => void
  setSideCm: (from: string, to: string, rawCm: string) => void
  setDiagonalCm: (from: string, to: string, rawCm: string, isControl?: boolean) => void
  toggleDiagonalControl: (from: string, to: string) => void
  setCornerType: (label: string, cornerType: 'internal' | 'external') => void
  suggestedDiagonals: () => SuggestedDiagonal[]
  flushSave: () => Promise<void>
}

function applyRoomUpdate(roomUpdater: (room: Room) => Room): void {
  const state = useRoomSessionStore.getState()
  const { order, roomId, toleranceMm, lastSuccess } = state
  if (!order || !roomId) return
  const room = activeRoom(order, roomId)
  if (!room) return
  const nextOrder = replaceRoom(order, roomUpdater(room))
  const nextRoom = activeRoom(nextOrder, roomId)!
  const computed = recompute(nextRoom, toleranceMm, lastSuccess)
  getAutosave().schedule(nextOrder)
  useRoomSessionStore.setState({
    order: nextOrder,
    result: computed.result,
    lastSuccess: computed.lastSuccess,
  })
}

export const useRoomSessionStore = create<RoomSessionState>((set, get) => ({
  order: null,
  roomId: null,
  toleranceMm: DEFAULT_TOLERANCE_MM,
  result: null,
  lastSuccess: null,
  booting: true,
  bootError: null,

  async boot() {
    set({ booting: true, bootError: null })
    try {
      const existing = await repo.listOrders()
      let order = existing[0]
      if (!order || order.rooms.length === 0) {
        order = createEmptyOrder()
        const room = createPolygonRoom(4, 'Приміщення 1')
        order = { ...order, rooms: [room] }
        await repo.saveOrder(order)
      }
      const roomId = order.rooms[0]!.id
      const room = order.rooms[0]!
      const { result, lastSuccess } = recompute(room, get().toleranceMm, null)
      set({ order, roomId, result, lastSuccess, booting: false })
    } catch (error) {
      set({
        booting: false,
        bootError: error instanceof Error ? error.message : 'Помилка завантаження',
      })
    }
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

  setSideCm(from, to, rawCm) {
    const cm = parseCmInput(rawCm)
    const length = cm === null ? 0 : cmToMm(cm)
    applyRoomUpdate((room) => ({
      ...room,
      sides: room.sides.map((s) =>
        (s.from === from && s.to === to) || (s.from === to && s.to === from)
          ? { ...s, length }
          : s,
      ),
    }))
  },

  setDiagonalCm(from, to, rawCm, isControl = false) {
    const cm = parseCmInput(rawCm)
    applyRoomUpdate((room) => {
      const diagonals = [...room.diagonals]
      const idx = diagonals.findIndex(
        (d) =>
          (d.from === from && d.to === to) || (d.from === to && d.to === from),
      )
      if (cm === null || cm === 0) {
        if (idx >= 0) diagonals.splice(idx, 1)
      } else {
        const length = cmToMm(cm)
        if (idx >= 0) {
          diagonals[idx] = { ...diagonals[idx], length }
        } else {
          diagonals.push({ from, to, length, isControl })
        }
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
    await getAutosave().flush()
  },
}))
