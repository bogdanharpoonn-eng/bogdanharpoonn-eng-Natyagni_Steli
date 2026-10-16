import {
  buildRoom,
  DEFAULT_TOLERANCE_MM,
  type BuildRoomResult,
  type BuildRoomSuccess,
  type ErrorStatus,
} from '@/core/geometry'
import { roomToBuildInput, type Room } from '@/data'

export interface RoomSummary {
  result: BuildRoomResult | null
  success: BuildRoomSuccess | null
  areaM2: number | null
  errorStatus: ErrorStatus | 'incomplete' | 'error'
}

export function summarizeRoom(room: Room, toleranceMm = DEFAULT_TOLERANCE_MM): RoomSummary {
  const sidesReady = room.sides.length >= 3 && room.sides.every((s) => s.length > 0)
  if (!sidesReady) {
    return { result: null, success: null, areaM2: null, errorStatus: 'incomplete' }
  }
  const input = roomToBuildInput(room, toleranceMm)
  input.diagonals = input.diagonals.filter((d) => d.length > 0)
  const result = buildRoom(input)
  if (!result.ok) {
    return { result, success: null, areaM2: null, errorStatus: 'error' }
  }
  return {
    result,
    success: result,
    areaM2: result.areaM2,
    errorStatus: result.errorStatus,
  }
}
