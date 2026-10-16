import { describe, expect, it } from 'vitest'
import { buildRoom } from '@/core/geometry'
import { createEmptyRoom, createVertex } from './factories'
import { roomToBuildInput } from './mappers'
import { cmToMm } from '@/core/geometry'

describe('roomToBuildInput', () => {
  it('maps a rectangle room into geometry engine', () => {
    const room = createEmptyRoom('Тест')
    room.vertices = [
      createVertex('A'),
      createVertex('B'),
      createVertex('C'),
      createVertex('D'),
    ]
    room.sides = [
      { from: 'A', to: 'B', length: cmToMm(400) },
      { from: 'B', to: 'C', length: cmToMm(300) },
      { from: 'C', to: 'D', length: cmToMm(400) },
      { from: 'D', to: 'A', length: cmToMm(300) },
    ]
    room.diagonals = [{ from: 'A', to: 'C', length: cmToMm(500), isControl: false }]

    const result = buildRoom(roomToBuildInput(room))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.areaM2).toBe(12)
  })
})
