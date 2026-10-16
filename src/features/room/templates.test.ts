import { describe, expect, it } from 'vitest'
import { createRoomFromTemplate } from './templates'

describe('room templates', () => {
  it('rectangle has 4 external corners', () => {
    const room = createRoomFromTemplate('rectangle', 'Тест')
    expect(room.vertices).toHaveLength(4)
    expect(room.vertices.every((v) => v.cornerType === 'external')).toBe(true)
  })

  it('L-shape has internal corner at C', () => {
    const room = createRoomFromTemplate('lshape', 'Г')
    expect(room.vertices).toHaveLength(6)
    expect(room.vertices.find((v) => v.label === 'C')?.cornerType).toBe('internal')
  })

  it('U-shape has two internal corners', () => {
    const room = createRoomFromTemplate('ushape', 'П')
    expect(room.vertices).toHaveLength(8)
    const internals = room.vertices.filter((v) => v.cornerType === 'internal').map((v) => v.label)
    expect(internals).toEqual(['C', 'E'])
  })
})
