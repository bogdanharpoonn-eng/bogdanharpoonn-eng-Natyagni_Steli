import { cross, dist, edgeKey, EPS, intersectCircles, signedArea, sub } from './math'
import type { Triangle } from './triangulation'
import type { CornerType, Mm, Point } from './types'

export type LengthMap = Map<string, Mm>

export function checkTriangleInequality(
  triangles: Triangle[],
  lengths: LengthMap,
): { ok: true } | { ok: false; triangleName: string; sides: string } {
  for (const t of triangles) {
    const ab = lengths.get(edgeKey(t.a, t.b))
    const bc = lengths.get(edgeKey(t.b, t.c))
    const ac = lengths.get(edgeKey(t.a, t.c))
    if (ab === undefined || bc === undefined || ac === undefined) {
      return { ok: false, triangleName: t.name, sides: 'невідомі сторони' }
    }
    const lens = [ab, bc, ac].sort((x, y) => y - x)
    if (lens[0] >= lens[1] + lens[2] - 1e-3) {
      return {
        ok: false,
        triangleName: t.name,
        sides: `${ab.toFixed(0)}, ${bc.toFixed(0)}, ${ac.toFixed(0)} мм`,
      }
    }
  }
  return { ok: true }
}

/**
 * Try sequential CW placement starting from each boundary edge.
 * Mirror at each step: external corner → right turn; internal → left turn.
 */
export function placeVertices(
  n: number,
  triangles: Triangle[],
  lengths: LengthMap,
  cornerTypes: CornerType[],
): Point[] | null {
  void triangles
  let best: Point[] | null = null
  let bestError = Number.POSITIVE_INFINITY

  for (let start = 0; start < n; start += 1) {
    const placed = placeSequentialFrom(start, n, lengths, cornerTypes)
    if (!placed) continue
    const err = lengthMismatch(placed, lengths)
    if (err < bestError) {
      bestError = err
      best = placed
    }
    if (err < 1e-3) break
  }

  if (!best || bestError > 1) return null
  return best
}

function placeSequentialFrom(
  start: number,
  n: number,
  lengths: LengthMap,
  cornerTypes: CornerType[],
): Point[] | null {
  const map = (k: number) => (start + k) % n
  const pointsLocal: Point[] = []

  const len01 = lengths.get(edgeKey(map(0), map(1)))
  if (len01 === undefined) return null
  pointsLocal[0] = { x: 0, y: 0 }
  pointsLocal[1] = { x: len01, y: 0 }

  for (let i = 2; i < n; i += 1) {
    const prev = i - 1
    const realI = map(i)
    const realPrev = map(prev)
    const sideLen = lengths.get(edgeKey(realPrev, realI))
    if (sideLen === undefined) return null

    const refs: number[] = []
    for (let j = 0; j < prev; j += 1) {
      if (lengths.has(edgeKey(map(j), realI))) refs.push(j)
    }
    if (refs.length === 0) return null

    let placed: Point | null = null
    for (const ref of refs) {
      const refLen = lengths.get(edgeKey(map(ref), realI))
      if (refLen === undefined) continue
      const candidates = intersectCircles(pointsLocal[prev], sideLen, pointsLocal[ref], refLen)
      if (candidates.length === 0) continue
      const corner = cornerTypes[realPrev]
      placed = pickByTurn(pointsLocal[prev - 1], pointsLocal[prev], candidates, corner)
      if (placed) break
    }
    if (!placed) return null
    pointsLocal[i] = placed
  }

  // Map local points back to real vertex indices
  const points: Point[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }))
  for (let i = 0; i < n; i += 1) {
    points[map(i)] = pointsLocal[i]
  }

  if (signedArea(points) > 0) {
    for (const p of points) p.y = -p.y
  }

  return points
}

function pickByTurn(
  prev2: Point,
  prev1: Point,
  candidates: Point[],
  cornerAtPrev1: CornerType,
): Point | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const incoming = sub(prev1, prev2)
  const wantLeft = cornerAtPrev1 === 'internal'

  const scored = candidates.map((c) => {
    const outgoing = sub(c, prev1)
    const cr = cross(incoming, outgoing)
    const isLeft = cr > EPS
    const isRight = cr < -EPS
    let score = 0
    if (wantLeft && isLeft) score += 100
    if (!wantLeft && isRight) score += 100
    if (wantLeft && isRight) score -= 100
    if (!wantLeft && isLeft) score -= 100
    score += Math.min(Math.abs(cr), 1e9) / 1e9
    return { c, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.c ?? null
}

function lengthMismatch(points: Point[], lengths: LengthMap): number {
  let max = 0
  for (const [key, measured] of lengths) {
    const [a, b] = key.split('-').map(Number)
    max = Math.max(max, Math.abs(dist(points[a], points[b]) - measured))
  }
  return max
}

export function rebuildLengths(points: Point[]): LengthMap {
  const map: LengthMap = new Map()
  const n = points.length
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      map.set(edgeKey(i, j), dist(points[i], points[j]))
    }
  }
  return map
}
