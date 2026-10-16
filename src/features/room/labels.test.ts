import { describe, expect, it } from 'vitest'
import { formatCm, parseCmInput, vertexLabels } from './labels'

describe('room labels/units helpers', () => {
  it('builds A.. labels', () => {
    expect(vertexLabels(4)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('parses cm with comma', () => {
    expect(parseCmInput('400,5')).toBe(400.5)
    expect(parseCmInput('')).toBeNull()
  })

  it('formats mm to one decimal cm', () => {
    expect(formatCm(4000)).toBe('400.0')
    expect(formatCm(4005)).toBe('400.5')
  })
})
