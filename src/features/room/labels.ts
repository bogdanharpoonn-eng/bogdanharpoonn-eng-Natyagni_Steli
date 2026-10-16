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

export function formatCm(mm: number): string {
  const cm = mm / 10
  return (Math.round(cm * 10) / 10).toFixed(1)
}
