import type { LengthUnit } from '@/stores/settingsStore'
import { cmToMm } from '@/core/geometry'

/** Vertex labels A, B, … Z, then AA… (MVP typically ≤ 20). */
export function vertexLabels(count: number): string[] {
  const labels: string[] = []
  for (let i = 0; i < count; i += 1) {
    labels.push(indexToLabel(i))
  }
  return labels
}

function indexToLabel(index: number): string {
  let n = index
  let s = ''
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

export function parseCmInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

/** Parse user length in current display unit → millimetres. */
export function parseLengthInput(raw: string, unit: LengthUnit): number | null {
  const value = parseCmInput(raw)
  if (value === null) return null
  if (unit === 'mm') return Math.round(value)
  return cmToMm(value)
}

export function formatCm(mm: number): string {
  const cm = mm / 10
  return (Math.round(cm * 10) / 10).toFixed(1)
}

export function formatLength(mm: number, unit: LengthUnit): string {
  if (unit === 'mm') return String(Math.round(mm))
  return formatCm(mm)
}

export function lengthUnitLabel(unit: LengthUnit): string {
  return unit === 'mm' ? 'мм' : 'см'
}
