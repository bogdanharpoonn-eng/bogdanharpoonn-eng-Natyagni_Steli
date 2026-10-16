import { dist, edgeKey } from './math'
import type { Mm, Point } from './types'

export interface Observation {
  i: number
  j: number
  measured: Mm
}

/**
 * Levenberg-Marquardt adjustment of vertex coordinates against length observations.
 * Gauge: vertex 0 fixed at (0,0), vertex 1 constrained to y=0 (x free).
 */
export function adjustPolygon(
  initial: Point[],
  observations: Observation[],
  options?: { maxIter?: number; lambda?: number },
): Point[] {
  const n = initial.length
  if (n < 3 || observations.length === 0) return initial.map((p) => ({ ...p }))

  const maxIter = options?.maxIter ?? 40
  let lambda = options?.lambda ?? 1e-2

  // Parameters: x1, then (x2,y2), (x3,y3), ... (x_{n-1}, y_{n-1})
  // Index mapping
  const paramCount = 1 + 2 * (n - 2)
  let params = pointsToParams(initial)

  let bestParams = params.slice()
  let bestCost = cost(paramsToPoints(params, n), observations)

  for (let iter = 0; iter < maxIter; iter += 1) {
    const points = paramsToPoints(params, n)
    const { residuals, jacobian } = residualAndJacobian(points, observations, paramCount)

    // Solve (J^T J + λ I) δ = J^T r  for minimizing ½||r||² with r = computed - measured
    // We want to zero residuals, so Newton step on f=r
    const jtJ = matMulAtB(jacobian, jacobian)
    const jtr = matMulAtV(jacobian, residuals)
    for (let i = 0; i < paramCount; i += 1) jtJ[i][i] += lambda

    const delta = solveLinearSystem(jtJ, jtr)
    if (!delta) break

    // Gradient descent direction toward zero residual: params -= delta
    const trial = params.map((p, i) => p - delta[i])
    // Keep x1 positive
    if (trial[0] <= 1e-6) trial[0] = Math.abs(params[0])

    const trialCost = cost(paramsToPoints(trial, n), observations)
    if (trialCost < bestCost) {
      params = trial
      bestParams = trial.slice()
      bestCost = trialCost
      lambda = Math.max(lambda * 0.5, 1e-12)
    } else {
      lambda = Math.min(lambda * 2, 1e8)
    }

    if (bestCost < 1e-8) break
    const stepNorm = Math.hypot(...delta)
    if (stepNorm < 1e-8) break
  }

  return paramsToPoints(bestParams, n)
}

function pointsToParams(points: Point[]): number[] {
  const params: number[] = [points[1].x]
  for (let i = 2; i < points.length; i += 1) {
    params.push(points[i].x, points[i].y)
  }
  return params
}

function paramsToPoints(params: number[], n: number): Point[] {
  const points: Point[] = [{ x: 0, y: 0 }, { x: params[0], y: 0 }]
  let k = 1
  for (let i = 2; i < n; i += 1) {
    points.push({ x: params[k], y: params[k + 1] })
    k += 2
  }
  return points
}

function cost(points: Point[], observations: Observation[]): number {
  let s = 0
  for (const obs of observations) {
    const r = dist(points[obs.i], points[obs.j]) - obs.measured
    s += r * r
  }
  return s
}

function residualAndJacobian(
  points: Point[],
  observations: Observation[],
  paramCount: number,
): { residuals: number[]; jacobian: number[][] } {
  const residuals: number[] = []
  const jacobian: number[][] = []
  const n = points.length

  for (const obs of observations) {
    const pi = points[obs.i]
    const pj = points[obs.j]
    const d = dist(pi, pj)
    residuals.push(d - obs.measured)

    const row = Array.from({ length: paramCount }, () => 0)
    if (d > 1e-12) {
      const dx = (pi.x - pj.x) / d
      const dy = (pi.y - pj.y) / d
      accumulateGrad(row, obs.i, dx, dy, n)
      accumulateGrad(row, obs.j, -dx, -dy, n)
    }
    jacobian.push(row)
  }

  return { residuals, jacobian }
}

/** Map vertex coordinate gradients into parameter vector. */
function accumulateGrad(row: number[], vertex: number, gx: number, gy: number, n: number): void {
  if (vertex === 0) return
  if (vertex === 1) {
    row[0] += gx
    return
  }
  const base = 1 + 2 * (vertex - 2)
  if (base + 1 < row.length && vertex < n) {
    row[base] += gx
    row[base + 1] += gy
  }
}

function matMulAtB(a: number[][], b: number[][]): number[][] {
  const m = a[0]?.length ?? 0
  const out = Array.from({ length: m }, () => Array.from({ length: m }, () => 0))
  for (let i = 0; i < m; i += 1) {
    for (let j = 0; j < m; j += 1) {
      let s = 0
      for (let k = 0; k < a.length; k += 1) s += a[k][i] * b[k][j]
      out[i][j] = s
    }
  }
  return out
}

function matMulAtV(a: number[][], v: number[]): number[] {
  const m = a[0]?.length ?? 0
  const out = Array.from({ length: m }, () => 0)
  for (let i = 0; i < m; i += 1) {
    let s = 0
    for (let k = 0; k < a.length; k += 1) s += a[k][i] * v[k]
    out[i] = s
  }
  return out
}

/** Gaussian elimination with partial pivoting. */
function solveLinearSystem(aIn: number[][], bIn: number[]): number[] | null {
  const n = bIn.length
  const a = aIn.map((row) => row.slice())
  const b = bIn.slice()

  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    }
    if (Math.abs(a[pivot][col]) < 1e-14) return null
    if (pivot !== col) {
      ;[a[pivot], a[col]] = [a[col], a[pivot]]
      ;[b[pivot], b[col]] = [b[col], b[pivot]]
    }
    const div = a[col][col]
    for (let c = col; c < n; c += 1) a[col][c] /= div
    b[col] /= div
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue
      const factor = a[r][col]
      for (let c = col; c < n; c += 1) a[r][c] -= factor * a[col][c]
      b[r] -= factor * b[col]
    }
  }
  return b
}

export function observationKey(i: number, j: number): string {
  return edgeKey(i, j)
}
