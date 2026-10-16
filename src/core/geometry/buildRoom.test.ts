import { describe, expect, it } from 'vitest'
import { buildRoom } from './buildRoom'
import {
  lShape,
  parallelogram400x300,
  rectangle400x300,
  trapezoid,
  uShape,
} from './fixtures'
import { cmToMm } from './units'

describe('buildRoom — rectangle 400×300', () => {
  it('builds with 90° angles and area 12.00 m²', () => {
    const result = buildRoom(rectangle400x300())
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.areaM2).toBe(12)
    expect(result.perimeterM).toBe(14)
    expect(result.errorStatus).toBe('ok')
    for (const v of result.vertices) {
      expect(v.interiorAngleDeg).toBeCloseTo(90, 0)
    }
  })

  it('control diagonal off by 3 mm → ok', () => {
    // True BD = 500 cm; 500.3 cm → +3 mm
    const result = buildRoom(rectangle400x300({ controlDiagonalCm: 500.3 }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.errorStatus).toBe('ok')
    expect(result.maxResidualMm).toBeLessThanOrEqual(10)
  })

  it('control diagonal off by 25 mm → fail with BD indicated', () => {
    const result = buildRoom(rectangle400x300({ controlDiagonalCm: 502.5 }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.errorStatus).toBe('fail')
    expect(result.message).toMatch(/B-D|BD/i)
    const worst = [...result.residuals].sort((a, b) => b.residualMm - a.residualMm)[0]
    expect(`${worst.from}-${worst.to}`).toMatch(/B-D|D-B/)
  })
})

describe('buildRoom — other shapes', () => {
  it('parallelogram differs from rectangle via diagonal', () => {
    const rect = buildRoom(rectangle400x300())
    const para = buildRoom(parallelogram400x300())
    expect(rect.ok && para.ok).toBe(true)
    if (!rect.ok || !para.ok) return
    expect(para.areaM2).not.toBe(rect.areaM2)
    expect(para.errorStatus).toBe('ok')
  })

  it('builds trapezoid', () => {
    const result = buildRoom(trapezoid())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.areaM2).toBeGreaterThan(0)
    expect(result.errorStatus).toBe('ok')
  })

  it('L-shape: 6 corners, 1 internal', () => {
    const result = buildRoom(lShape())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.vertices).toHaveLength(6)
    expect(result.internalCornerCount).toBe(1)
    expect(result.externalCornerCount).toBe(5)
    const c = result.vertices.find((v) => v.label === 'C')
    expect(c?.interiorAngleDeg).toBeGreaterThan(180)
    expect(result.areaM2).toBeCloseTo(9, 1) // 200*300 + 200*150 = 60000+30000 cm² = 9 m²
  })

  it('U-shape: 8 corners, 2 internal', () => {
    const result = buildRoom(uShape())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.vertices).toHaveLength(8)
    expect(result.internalCornerCount).toBe(2)
    expect(result.externalCornerCount).toBe(6)
    const reflex = result.vertices.filter((v) => v.interiorAngleDeg > 180)
    expect(reflex.length).toBe(2)
  })
})

describe('buildRoom — errors', () => {
  it('missing diagonals suggests specific ones', () => {
    const input = rectangle400x300()
    input.diagonals = []
    const result = buildRoom(input)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('missing_diagonals')
    expect(result.message).toMatch(/Додайте/)
    expect(result.suggestedDiagonals?.length).toBeGreaterThan(0)
  })

  it('triangle inequality violation', () => {
    const input = rectangle400x300()
    input.diagonals = [{ from: 'A', to: 'C', length: cmToMm(900), isControl: false }]
    const result = buildRoom(input)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('triangle_inequality')
    expect(result.message).toMatch(/нерівність трикутника/)
  })

})
