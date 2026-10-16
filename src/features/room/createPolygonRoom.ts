import { createEmptyRoom, createVertex } from '@/data'
import type { Room } from '@/data'
import { vertexLabels } from './labels'

/** Room shell with n corners (CW), empty side lengths, no diagonals yet. */
export function createPolygonRoom(cornerCount: number, name = 'Приміщення 1'): Room {
  const n = Math.min(20, Math.max(3, cornerCount))
  const labels = vertexLabels(n)
  const room = createEmptyRoom(name)
  room.vertices = labels.map((label) => createVertex(label, 'external'))
  room.sides = labels.map((from, i) => ({
    from,
    to: labels[(i + 1) % n],
    length: 0,
  }))
  room.diagonals = []
  return room
}

export function resizeRoomCorners(room: Room, cornerCount: number): Room {
  const next = createPolygonRoom(cornerCount, room.name)
  next.id = room.id
  next.note = room.note
  next.height = room.height
  next.fixtures = room.fixtures

  // Preserve lengths where edge labels still match
  for (const side of next.sides) {
    const prev = room.sides.find(
      (s) =>
        (s.from === side.from && s.to === side.to) ||
        (s.from === side.to && s.to === side.from),
    )
    if (prev) side.length = prev.length
  }
  for (const v of next.vertices) {
    const prev = room.vertices.find((x) => x.label === v.label)
    if (prev) v.cornerType = prev.cornerType
  }
  next.diagonals = room.diagonals.filter((d) => {
    const labels = new Set(next.vertices.map((v) => v.label))
    return labels.has(d.from) && labels.has(d.to)
  })
  return next
}
