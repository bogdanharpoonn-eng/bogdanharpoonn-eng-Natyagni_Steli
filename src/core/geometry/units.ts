import type { Mm } from './types'

/** Display centimetres (1 decimal) → storage millimetres (integer). */
export function cmToMm(cm: number): Mm {
  return Math.round(cm * 10)
}

/** Storage millimetres → display centimetres. */
export function mmToCm(mm: Mm): number {
  return mm / 10
}

export function mmToMeters(mm: Mm): number {
  return mm / 1000
}

export function mm2ToM2(mm2: number): number {
  return mm2 / 1_000_000
}
