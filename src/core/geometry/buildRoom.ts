import { adjustPolygon, type Observation } from './adjust'
import {
  dist,
  edgeKey,
  interiorAngleDegCw,
  polygonAreaAbs,
  polygonSelfIntersects,
  roundTo,
} from './math'
import {
  findTriangles,
  formatDiagonalList,
  suggestMissingDiagonals,
  validateTriangulation,
} from './triangulation'
import { checkTriangleInequality, placeVertices, type LengthMap } from './trilateration'
import {
  DEFAULT_TOLERANCE_MM,
  type BuildRoomInput,
  type BuildRoomResult,
  type BuiltVertex,
  type CornerType,
  type ErrorStatus,
  type MeasurementResidual,
  type VertexLabel,
} from './types'
import { mm2ToM2, mmToMeters } from './units'

export function buildRoom(input: BuildRoomInput): BuildRoomResult {
  const toleranceMm = input.toleranceMm ?? DEFAULT_TOLERANCE_MM
  const n = input.vertices.length

  if (n < 3 || n > 20) {
    return { ok: false, code: 'invalid_input', message: 'Кількість вершин має бути від 3 до 20.' }
  }

  const labels = input.vertices.map((v) => v.label)
  const labelIndex = new Map<VertexLabel, number>(labels.map((l, i) => [l, i]))

  if (new Set(labels).size !== labels.length) {
    return { ok: false, code: 'invalid_input', message: 'Мітки вершин мають бути унікальними.' }
  }

  if (input.sides.length !== n) {
    return {
      ok: false,
      code: 'invalid_input',
      message: `Очікується ${n} сторін (по одній між сусідніми вершинами).`,
    }
  }

  const cornerTypes: CornerType[] = input.vertices.map((v) => v.cornerType)
  const lengths: LengthMap = new Map()

  for (let i = 0; i < n; i += 1) {
    const from = labels[i]
    const to = labels[(i + 1) % n]
    const side = input.sides.find(
      (s) =>
        (s.from === from && s.to === to) || (s.from === to && s.to === from),
    )
    if (!side || !(side.length > 0)) {
      return {
        ok: false,
        code: 'invalid_input',
        message: `Не задано сторону ${from}-${to}.`,
      }
    }
    lengths.set(edgeKey(i, (i + 1) % n), side.length)
  }

  const constructionDiagonals: Array<[number, number]> = []
  const controlDiagonals: Array<[number, number, number]> = []

  for (const d of input.diagonals) {
    const i = labelIndex.get(d.from)
    const j = labelIndex.get(d.to)
    if (i === undefined || j === undefined) {
      return {
        ok: false,
        code: 'invalid_input',
        message: `Діагональ ${d.from}-${d.to}: невідома вершина.`,
      }
    }
    if (Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1) {
      return {
        ok: false,
        code: 'invalid_input',
        message: `${d.from}-${d.to} є стороною, а не діагоналлю.`,
      }
    }
    if (!(d.length > 0)) {
      return {
        ok: false,
        code: 'invalid_input',
        message: `Довжина діагоналі ${d.from}-${d.to} має бути додатньою.`,
      }
    }
    if (d.isControl) {
      controlDiagonals.push([i, j, d.length])
    } else {
      constructionDiagonals.push([i, j])
      lengths.set(edgeKey(i, j), d.length)
    }
  }

  const triangulation = validateTriangulation(n, constructionDiagonals)
  if (!triangulation.ok) {
    const suggested = suggestMissingDiagonals(n, labels, constructionDiagonals)
    if (triangulation.reason === 'count' || triangulation.reason === 'incomplete') {
      const need = n - 3
      const msg =
        suggested.length > 0
          ? `Недостатньо діагоналей для побудови (потрібно ${need}). Додайте: ${formatDiagonalList(suggested)}.`
          : `Недостатньо діагоналей для побудови (потрібно ${need}).`
      return {
        ok: false,
        code: 'missing_diagonals',
        message: msg,
        suggestedDiagonals: suggested,
      }
    }
    return {
      ok: false,
      code: 'invalid_triangulation',
      message:
        suggested.length > 0
          ? `Діагоналі перетинаються або не утворюють тріангуляцію. Спробуйте: ${formatDiagonalList(suggested)}.`
          : 'Діагоналі перетинаються або не утворюють тріангуляцію.',
      suggestedDiagonals: suggested,
    }
  }

  const triangles = findTriangles(n, constructionDiagonals, labels)
  if (triangles.length !== n - 2) {
    const suggested = suggestMissingDiagonals(n, labels, [])
    return {
      ok: false,
      code: 'invalid_triangulation',
      message: `Не вдалося побудувати тріангуляцію. Додайте діагоналі: ${formatDiagonalList(suggested)}.`,
      suggestedDiagonals: suggested,
    }
  }

  const inequality = checkTriangleInequality(triangles, lengths)
  if (!inequality.ok) {
    return {
      ok: false,
      code: 'triangle_inequality',
      message: `Порушено нерівність трикутника ${inequality.triangleName} (сторони ${inequality.sides}). Перевірте виміри.`,
      triangleName: inequality.triangleName,
    }
  }

  let points = placeVertices(n, triangles, lengths, cornerTypes)
  if (!points) {
    return {
      ok: false,
      code: 'build_failed',
      message: 'Не вдалося розмістити вершини за заданими вимірами. Перевірте сторони та діагоналі.',
    }
  }

  if (polygonSelfIntersects(points)) {
    return {
      ok: false,
      code: 'self_intersection',
      message: 'Отриманий багатокутник самоперетинається. Переміряйте сторони та діагоналі.',
    }
  }

  // Residuals vs rigid triangulation (control diagonals included). Status is based on this,
  // so a blunder on a control measurement is not hidden by least-squares absorption.
  const residuals = computeResiduals(input, points, labelIndex)
  const maxResidualMm = residuals.reduce((m, r) => Math.max(m, r.residualMm), 0)
  const { errorStatus, message } = statusFromResiduals(residuals, maxResidualMm, toleranceMm)

  if (controlDiagonals.length > 0 && errorStatus !== 'fail') {
    const observations: Observation[] = []
    for (let i = 0; i < n; i += 1) {
      observations.push({
        i,
        j: (i + 1) % n,
        measured: lengths.get(edgeKey(i, (i + 1) % n))!,
      })
    }
    for (const [i, j] of constructionDiagonals) {
      observations.push({ i, j, measured: lengths.get(edgeKey(i, j))! })
    }
    for (const [i, j, len] of controlDiagonals) {
      observations.push({ i, j, measured: len })
    }
    const adjusted = adjustPolygon(points, observations)
    if (!polygonSelfIntersects(adjusted)) {
      points = adjusted
    }
  }

  const builtVertices: BuiltVertex[] = points.map((p, i) => {
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    return {
      label: labels[i],
      x: p.x,
      y: p.y,
      cornerType: cornerTypes[i],
      interiorAngleDeg: roundTo(interiorAngleDegCw(prev, p, next), 1),
    }
  })

  let perimeterMm = 0
  for (let i = 0; i < n; i += 1) {
    perimeterMm += dist(points[i], points[(i + 1) % n])
  }

  const internalCornerCount = cornerTypes.filter((c) => c === 'internal').length
  const externalCornerCount = n - internalCornerCount

  return {
    ok: true,
    vertices: builtVertices,
    areaM2: roundTo(mm2ToM2(polygonAreaAbs(points)), 2),
    perimeterM: roundTo(mmToMeters(perimeterMm), 2),
    internalCornerCount,
    externalCornerCount,
    residuals,
    maxResidualMm: roundTo(maxResidualMm, 2),
    errorStatus,
    message,
  }
}

function computeResiduals(
  input: BuildRoomInput,
  points: { x: number; y: number }[],
  labelIndex: Map<VertexLabel, number>,
): MeasurementResidual[] {
  const residuals: MeasurementResidual[] = []

  for (const side of input.sides) {
    const i = labelIndex.get(side.from)
    const j = labelIndex.get(side.to)
    if (i === undefined || j === undefined) continue
    const computed = dist(points[i], points[j])
    residuals.push({
      kind: 'side',
      from: side.from,
      to: side.to,
      measured: side.length,
      computed,
      residualMm: Math.abs(computed - side.length),
      isControl: false,
    })
  }

  for (const d of input.diagonals) {
    const i = labelIndex.get(d.from)
    const j = labelIndex.get(d.to)
    if (i === undefined || j === undefined) continue
    const computed = dist(points[i], points[j])
    residuals.push({
      kind: 'diagonal',
      from: d.from,
      to: d.to,
      measured: d.length,
      computed,
      residualMm: Math.abs(computed - d.length),
      isControl: d.isControl,
    })
  }

  return residuals
}

function statusFromResiduals(
  residuals: MeasurementResidual[],
  maxResidualMm: number,
  toleranceMm: number,
): { errorStatus: ErrorStatus; message?: string } {
  if (maxResidualMm <= toleranceMm) {
    return { errorStatus: 'ok' }
  }

  const worst = [...residuals].sort((a, b) => b.residualMm - a.residualMm)[0]
  const label = worst ? `${worst.from}-${worst.to}` : 'вимір'

  if (maxResidualMm <= 2 * toleranceMm) {
    return {
      errorStatus: 'warn',
      message: `Перевірте виміри (найбільша похибка: ${label}).`,
    }
  }

  return {
    errorStatus: 'fail',
    message: `Переміряйте: найімовірніше помилка у ${label}.`,
  }
}
