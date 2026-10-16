import type { BuildRoomInput } from '@/core/geometry'
import type { Room } from './schemas'

/** Map a persisted Room to geometry engine input (skips empty lengths). */
export function roomToBuildInput(room: Room, toleranceMm?: number): BuildRoomInput {
  return {
    vertices: room.vertices.map((v) => ({
      label: v.label,
      cornerType: v.cornerType,
    })),
    sides: room.sides.map((s) => ({
      from: s.from,
      to: s.to,
      length: s.length,
    })),
    diagonals: room.diagonals.map((d) => ({
      from: d.from,
      to: d.to,
      length: d.length,
      isControl: d.isControl,
    })),
    toleranceMm,
  }
}
