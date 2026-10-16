import { describe, it, expect } from 'vitest'
import { buildRoom } from './buildRoom'
import type { BuildRoomInput, CornerType } from './types'

type P = [number, number]
const L = (i: number) => String.fromCharCode(65 + i)
const d = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function signedArea(p: P[]) {
  let a = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length]
    a += p[i][0] * q[1] - q[0] * p[i][1]
  }
  return a / 2
}
function cross(o: P, a: P, b: P) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}
function segX(a: P, b: P, c: P, e: P) {
  const d1 = cross(c, e, a), d2 = cross(c, e, b), d3 = cross(a, b, c), d4 = cross(a, b, e)
  return d1 * d2 < 0 && d3 * d4 < 0
}
function pointInTri(p: P, a: P, b: P, c: P) {
  const s1 = cross(a, b, p), s2 = cross(b, c, p), s3 = cross(c, a, p)
  return (s1 < 0 && s2 < 0 && s3 < 0) || (s1 > 0 && s2 > 0 && s3 > 0)
}
// ear clipping on CW polygon (signed area < 0)
function earClip(p: P[]): Array<[number, number]> {
  const idx = p.map((_, i) => i)
  const diags: Array<[number, number]> = []
  let guard = 0
  while (idx.length > 3 && guard++ < 1000) {
    let clipped = false
    for (let k = 0; k < idx.length; k++) {
      const a = idx[(k - 1 + idx.length) % idx.length], b = idx[k], c = idx[(k + 1) % idx.length]
      if (cross(p[a], p[b], p[c]) >= 0) continue // CW convex => cross<0
      let ok = true
      for (const o of idx) if (o !== a && o !== b && o !== c && pointInTri(p[o], p[a], p[b], p[c])) ok = false
      if (!ok) continue
      diags.push([a, c])
      idx.splice(k, 1)
      clipped = true
      break
    }
    if (!clipped) return []
  }
  return diags
}

function makeInput(p: P[], diags: Array<[number, number]>, control: Array<[number, number]>, noise: () => number = () => 0): BuildRoomInput {
  const n = p.length
  const corner = (i: number): CornerType =>
    cross(p[(i - 1 + n) % n], p[i], p[(i + 1) % n]) < 0 ? 'external' : 'internal'
  return {
    vertices: p.map((_, i) => ({ label: L(i), cornerType: corner(i) })),
    sides: p.map((_, i) => ({ from: L(i), to: L((i + 1) % n), length: Math.round(d(p[i], p[(i + 1) % n]) + noise()) })),
    diagonals: [
      ...diags.map(([a, b]) => ({ from: L(a), to: L(b), length: Math.round(d(p[a], p[b]) + noise()), isControl: false })),
      ...control.map(([a, b]) => ({ from: L(a), to: L(b), length: Math.round(d(p[a], p[b]) + noise()), isControl: true })),
    ],
  }
}

function shapeError(orig: P[], built: { x: number; y: number }[]) {
  let m = 0
  for (let i = 0; i < orig.length; i++)
    for (let j = i + 1; j < orig.length; j++)
      m = Math.max(m, Math.abs(d(orig[i], orig[j]) - Math.hypot(built[i].x - built[j].x, built[i].y - built[j].y)))
  return m
}

function randomStar(r: () => number, n: number): P[] {
  const angs = Array.from({ length: n }, () => r() * Math.PI * 2).sort((a, b) => b - a) // decreasing => CW
  return angs.map((a) => {
    const rad = 1500 + r() * 3500
    return [Math.round(rad * Math.cos(a)), Math.round(rad * Math.sin(a))] as P
  })
}
function simple(p: P[]) {
  const n = p.length
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue
    if (segX(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) return false
  }
  return true
}
function minAngleOk(p: P[]) {
  const n = p.length
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n]
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]]
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))
    const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
    if (ang < 20 || ang > 170) return false
    if (d(a, b) < 300) return false
  }
  return true
}

describe('AUDIT', () => {
  it('fuzz random simple polygons with ear-clip triangulation', () => {
    const stats: Record<string, number> = {}
    const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
    const examples: string[] = []
    const r = rng(42)
    let total = 0
    for (let t = 0; total < 600 && t < 20000; t++) {
      const n = 4 + Math.floor(r() * 7) // 4..10
      const p = randomStar(r, n)
      if (signedArea(p) >= 0 || !simple(p) || !minAngleOk(p)) continue
      const diags = earClip(p)
      if (diags.length !== n - 3) continue
      total++
      const res = buildRoom(makeInput(p, diags, []))
      if (!res.ok) { bump('fail:' + res.code); if (examples.length < 5) examples.push(`n=${n} ${res.code} ${res.message} ${JSON.stringify(p)} ${JSON.stringify(diags)}`); continue }
      const err = shapeError(p, res.vertices)
      if (err > 5) { bump('WRONG_SHAPE'); if (examples.length < 8) examples.push(`WRONG n=${n} err=${err.toFixed(0)} ${JSON.stringify(p)} diags=${JSON.stringify(diags)}`) }
      else bump('ok')
    }
    console.log('FUZZ total', total, stats)
    console.log(examples.join('\n'))
    expect(total).toBeGreaterThan(0)
  })

  it('convex only, fan from A', () => {
    const r = rng(7)
    const stats: Record<string, number> = {}
    let total = 0
    for (let t = 0; total < 300 && t < 20000; t++) {
      const n = 4 + Math.floor(r() * 7)
      const p = randomStar(r, n)
      if (signedArea(p) >= 0 || !simple(p) || !minAngleOk(p)) continue
      let convex = true
      for (let i = 0; i < n; i++) if (cross(p[(i - 1 + n) % n], p[i], p[(i + 1) % n]) >= 0) convex = false
      if (!convex) continue
      total++
      const diags: Array<[number, number]> = []
      for (let j = 2; j <= n - 2; j++) diags.push([0, j])
      const res = buildRoom(makeInput(p, diags, []))
      const k = !res.ok ? 'fail:' + res.code : shapeError(p, res.vertices) > 5 ? 'WRONG' : 'ok'
      stats[k] = (stats[k] ?? 0) + 1
    }
    console.log('CONVEX FAN', total, stats)
  })

  it('blunder localisation: +30mm on side vs control', () => {
    const p: P[] = [[0, 0], [0, 3000], [4000, 3000], [4000, 0]].map(([x, y]) => [x, -y]).reverse() as P[]
    // ensure CW
    const poly = signedArea(p) < 0 ? p : [...p].reverse()
    const base = makeInput(poly, [[0, 2]], [[1, 3]])
    const bad = structuredClone(base)
    bad.sides[0].length += 30
    const res = buildRoom(bad)
    console.log('BLUNDER on side', bad.sides[0].from + '-' + bad.sides[0].to, '→', res.ok ? `${res.errorStatus} | ${res.message}` : res.message)
  })

  it('extra non-control diagonal message', () => {
    const poly: P[] = [[0, 0], [0, 3000], [4000, 3000], [4000, 0]]
    const P2 = signedArea(poly) < 0 ? poly : [...poly].reverse()
    const res = buildRoom(makeInput(P2, [[0, 2], [1, 3]], []))
    console.log('EXTRA DIAG →', res.ok ? 'ok' : `${res.code}: ${res.message}`)
  })

  it('near-straight wall (179° and 180°)', () => {
    for (const bend of [0, 50, 20]) {
      // rectangle 4000x3000 with an extra vertex on top wall at x=2000 pushed by `bend` mm
      const poly: P[] = [[0, 0], [0, 3000], [2000, 3000 + bend], [4000, 3000], [4000, 0]]
      const P2 = signedArea(poly) < 0 ? poly : [...poly].reverse()
      const res = buildRoom(makeInput(P2, earClip(P2), []))
      console.log(`BEND ${bend}mm →`, res.ok ? `ok area=${res.areaM2} err=${shapeError(P2, res.vertices).toFixed(1)}` : `${res.code}: ${res.message}`)
    }
  })

  it('realistic noise ±3mm, rect with control', () => {
    const r = rng(3)
    const poly: P[] = [[0, 0], [0, 3000], [4000, 3000], [4000, 0]]
    const P2 = signedArea(poly) < 0 ? poly : [...poly].reverse()
    const st: Record<string, number> = {}
    for (let k = 0; k < 200; k++) {
      const res = buildRoom(makeInput(P2, [[0, 2]], [[1, 3]], () => (r() - 0.5) * 6))
      const key = res.ok ? res.errorStatus : res.code
      st[key] = (st[key] ?? 0) + 1
    }
    console.log('NOISE ±3mm', st)
  })
})
