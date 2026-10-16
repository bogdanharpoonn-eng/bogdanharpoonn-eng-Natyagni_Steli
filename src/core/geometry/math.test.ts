import { describe, expect, it } from 'vitest'
import { polygonSelfIntersects } from './math'

describe('polygonSelfIntersects', () => {
  it('detects a bowtie', () => {
    const bowtie = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ]
    expect(polygonSelfIntersects(bowtie)).toBe(true)
  })

  it('accepts a rectangle', () => {
    const rect = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: -3000 },
      { x: 0, y: -3000 },
    ]
    expect(polygonSelfIntersects(rect)).toBe(false)
  })
})
