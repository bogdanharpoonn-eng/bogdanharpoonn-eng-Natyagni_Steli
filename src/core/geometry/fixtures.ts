import type { BuildRoomInput, CornerType, DiagonalInput, SideInput, VertexInput } from './types'
import { cmToMm } from './units'

function labels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i))
}

function vertices(n: number, internal: number[] = []): VertexInput[] {
  return labels(n).map((label, i) => ({
    label,
    cornerType: (internal.includes(i) ? 'internal' : 'external') as CornerType,
  }))
}

function sidesFromCm(lengthsCm: number[]): SideInput[] {
  const labs = labels(lengthsCm.length)
  return lengthsCm.map((cm, i) => ({
    from: labs[i],
    to: labs[(i + 1) % labs.length],
    length: cmToMm(cm),
  }))
}

function diagonal(from: string, to: string, lengthCm: number, isControl: boolean): DiagonalInput {
  return { from, to, length: cmToMm(lengthCm), isControl }
}

function distPts(a: readonly [number, number], b: readonly [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** Rectangle 400×300 cm, diagonal 500 cm. */
export function rectangle400x300(options?: {
  controlDiagonalCm?: number
  includeControl?: boolean
}): BuildRoomInput {
  const controlCm = options?.controlDiagonalCm
  const diagonals: DiagonalInput[] = [diagonal('A', 'C', 500, false)]
  if (options?.includeControl || controlCm !== undefined) {
    diagonals.push(diagonal('B', 'D', controlCm ?? 500, true))
  }
  return {
    vertices: vertices(4),
    sides: sidesFromCm([400, 300, 400, 300]),
    diagonals,
  }
}

/** Parallelogram with same side lengths as rectangle but diagonal 450 cm. */
export function parallelogram400x300(): BuildRoomInput {
  return {
    vertices: vertices(4),
    sides: sidesFromCm([400, 300, 400, 300]),
    diagonals: [diagonal('A', 'C', 450, false)],
  }
}

/** Trapezoid: bases 400 & 280, legs 180 & 180. */
export function trapezoid(): BuildRoomInput {
  const h = Math.sqrt(180 ** 2 - 60 ** 2)
  const ac = Math.hypot(340, h)
  return {
    vertices: vertices(4),
    sides: sidesFromCm([400, 180, 280, 180]),
    diagonals: [diagonal('A', 'C', ac, false)],
  }
}

/**
 * L-shape (6 corners, 1 internal at C):
 * A(0,300)–B(200,300)–C(200,150)–D(400,150)–E(400,0)–F(0,0) cm.
 * Fan from A: A-C, A-D, A-E.
 */
export function lShape(): BuildRoomInput {
  const A = [0, 300] as const
  const C = [200, 150] as const
  const D = [400, 150] as const
  const E = [400, 0] as const

  return {
    vertices: vertices(6, [2]),
    sides: sidesFromCm([200, 150, 200, 150, 400, 300]),
    diagonals: [
      diagonal('A', 'C', distPts(A, C), false),
      diagonal('A', 'D', distPts(A, D), false),
      diagonal('A', 'E', distPts(A, E), false),
    ],
  }
}

/**
 * U-shape (8 corners, 2 internal at C and E):
 * A(0,300) B(120,300) C(120,150) D(280,150) E(280,300) F(400,300) G(400,0) H(0,0)
 * Fan from H: H-B, H-C, H-D, H-E, H-F (placement tries all start edges).
 */
export function uShape(): BuildRoomInput {
  const B = [120, 300] as const
  const C = [120, 150] as const
  const D = [280, 150] as const
  const E = [280, 300] as const
  const F = [400, 300] as const
  const H = [0, 0] as const

  return {
    vertices: vertices(8, [2, 4]),
    sides: sidesFromCm([120, 150, 160, 150, 120, 300, 400, 300]),
    diagonals: [
      diagonal('H', 'B', distPts(H, B), false),
      diagonal('H', 'C', distPts(H, C), false),
      diagonal('H', 'D', distPts(H, D), false),
      diagonal('H', 'E', distPts(H, E), false),
      diagonal('H', 'F', distPts(H, F), false),
    ],
  }
}
