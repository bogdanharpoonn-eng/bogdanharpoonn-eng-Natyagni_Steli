import type { Mm, Point } from './types'

export const EPS = 1e-6

export function dist(a: Point, b: Point): Mm {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y
}

/** Signed area of polygon (positive = CCW, negative = CW). */
export function signedArea(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length
    sum += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return sum / 2
}

export function polygonAreaAbs(points: Point[]): number {
  return Math.abs(signedArea(points))
}

/**
 * Interior angle at vertex b for a clockwise polygon walk a→b→c, degrees in (0, 360).
 * Convex CW corners are &lt; 180°; reflex (internal) corners are &gt; 180°.
 */
export function interiorAngleDegCw(a: Point, b: Point, c: Point): number {
  const inVec = sub(b, a)
  const outVec = sub(c, b)
  const back = { x: -inVec.x, y: -inVec.y }
  let interior = Math.atan2(cross(back, outVec), dot(back, outVec))
  if (interior < 0) interior += 2 * Math.PI
  return (interior * 180) / Math.PI
}

export function intersectCircles(p1: Point, r1: Mm, p2: Point, r2: Mm): Point[] {
  const d = dist(p1, p2)
  if (d < EPS) return []
  if (d > r1 + r2 + EPS) return []
  if (d < Math.abs(r1 - r2) - EPS) return []

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const hSq = r1 * r1 - a * a
  const h = hSq <= 0 ? 0 : Math.sqrt(hSq)
  const mx = p1.x + (a * (p2.x - p1.x)) / d
  const my = p1.y + (a * (p2.y - p1.y)) / d
  if (h < EPS) return [{ x: mx, y: my }]

  const rx = (-h * (p2.y - p1.y)) / d
  const ry = (h * (p2.x - p1.x)) / d
  return [
    { x: mx + rx, y: my + ry },
    { x: mx - rx, y: my - ry },
  ]
}

export function segmentsProperIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(sub(b, a), sub(c, a))
  const d2 = cross(sub(b, a), sub(d, a))
  const d3 = cross(sub(d, c), sub(a, c))
  const d4 = cross(sub(d, c), sub(b, c))
  return (
    ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
    ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
  )
}

export function polygonSelfIntersects(points: Point[]): boolean {
  const n = points.length
  for (let i = 0; i < n; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % n]
    for (let j = i + 1; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue
      if ((i + 1) % n === j || (j + 1) % n === i) continue
      const c = points[j]
      const d = points[(j + 1) % n]
      if (segmentsProperIntersect(a, b, c, d)) return true
    }
  }
  return false
}

export function roundTo(value: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function edgeKey(i: number, j: number): string {
  return i < j ? `${i}-${j}` : `${j}-${i}`
}

/** Chord intersection test on a convex position circle of vertex indices. */
export function chordsProperIntersect(i: number, j: number, k: number, l: number): boolean {
  const norm = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a])
  const [a, b] = norm(i, j)
  const [c, d] = norm(k, l)
  if (a === c || a === d || b === c || b === d) return false
  const between = (x: number, lo: number, hi: number) => x > lo && x < hi
  return between(c, a, b) !== between(d, a, b)
}
