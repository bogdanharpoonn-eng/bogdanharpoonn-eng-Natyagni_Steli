import type { Room } from '@/data'
import { createPolygonRoom } from './createPolygonRoom'

export type RoomTemplateId = 'rectangle' | 'lshape' | 'ushape' | 'custom'

export interface RoomTemplateOption {
  id: RoomTemplateId
  corners?: number
}

/** Empty measurement shells with correct corner topology for field entry. */
export function createRoomFromTemplate(
  template: RoomTemplateId,
  name: string,
  customCorners = 5,
): Room {
  switch (template) {
    case 'rectangle': {
      return createPolygonRoom(4, name)
    }
    case 'lshape': {
      const room = createPolygonRoom(6, name)
      room.vertices = room.vertices.map((v) =>
        v.label === 'C' ? { ...v, cornerType: 'internal' } : v,
      )
      return room
    }
    case 'ushape': {
      const room = createPolygonRoom(8, name)
      room.vertices = room.vertices.map((v) =>
        v.label === 'C' || v.label === 'E' ? { ...v, cornerType: 'internal' } : v,
      )
      return room
    }
    case 'custom':
    default:
      return createPolygonRoom(customCorners, name)
  }
}

export function applyTemplateToRoom(
  room: Room,
  template: RoomTemplateId,
  customCorners = 5,
): Room {
  const next = createRoomFromTemplate(template, room.name, customCorners)
  next.id = room.id
  next.note = room.note
  next.height = room.height
  next.fixtures = room.fixtures
  return next
}
