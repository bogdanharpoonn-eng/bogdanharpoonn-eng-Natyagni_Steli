import { createId } from './ids'
import { SCHEMA_VERSION, type Order, type Room, type Vertex } from './schemas'

export function createEmptyClient(): Order['client'] {
  return { name: '', phone: '', address: '' }
}

export function createVertex(label: string, cornerType: Vertex['cornerType'] = 'external'): Vertex {
  return {
    id: createId(),
    label,
    cornerType,
  }
}

export function createEmptyRoom(name = 'Приміщення 1'): Room {
  return {
    id: createId(),
    name,
    vertices: [],
    sides: [],
    diagonals: [],
    fixtures: [],
    note: '',
  }
}

export function createEmptyOrder(): Order {
  const now = new Date().toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    client: createEmptyClient(),
    note: '',
    rooms: [],
    status: 'draft',
  }
}

/** Touch updatedAt for persistence. */
export function touchOrder(order: Order): Order {
  return {
    ...order,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  }
}
