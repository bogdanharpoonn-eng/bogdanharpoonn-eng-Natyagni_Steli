import { describe, expect, it } from 'vitest'
import { buildRoom } from './buildRoom'
import type { BuildRoomInput } from './types'

type P = readonly [number, number]

const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * Regression: wall kink +5 cm at mid of long side.
 * A(0,0) B(0,3000) C(2000,3050) D(4000,3000) E(4000,0) mm, CW.
 * Construction diagonals E-B, E-C. Expected area 12.10 m², all corners external.
 */
function wallBend5cmInput(): BuildRoomInput {
  const A: P = [0, 0]
  const B: P = [0, 3000]
  const C: P = [2000, 3050]
  const D: P = [4000, 3000]
  const E: P = [4000, 0]
  const pts = { A, B, C, D, E } as const
  const order = ['A', 'B', 'C', 'D', 'E'] as const

  return {
    vertices: order.map((label) => ({ label, cornerType: 'external' as const })),
    sides: order.map((from, i) => {
      const to = order[(i + 1) % order.length]
      return { from, to, length: Math.round(dist(pts[from], pts[to])) }
    }),
    diagonals: [
      { from: 'E', to: 'B', length: Math.round(dist(E, B)), isControl: false },
      { from: 'E', to: 'C', length: Math.round(dist(E, C)), isControl: false },
    ],
  }
}

describe('wall bend +5 cm regression', () => {
  it('builds 12.10 m² with all external corners', () => {
    const result = buildRoom(wallBend5cmInput())

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.areaM2).toBeCloseTo(12.1, 2)
    expect(result.vertices).toHaveLength(5)
    for (const v of result.vertices) {
      expect(v.cornerType).toBe('external')
      expect(v.interiorAngleDeg).toBeLessThan(180)
    }
  })
})
