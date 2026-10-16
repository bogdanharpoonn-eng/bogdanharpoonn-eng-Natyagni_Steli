import { describe, expect, it } from 'vitest'
import { formatCm, formatLength, parseCmInput, parseLengthInput, vertexLabels } from './labels'

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

  it('parses and formats by unit', () => {
    expect(parseLengthInput('400', 'cm')).toBe(4000)
    expect(parseLengthInput('4000', 'mm')).toBe(4000)
    expect(formatLength(4000, 'cm')).toBe('400.0')
    expect(formatLength(4000, 'mm')).toBe('4000')
  })
})
