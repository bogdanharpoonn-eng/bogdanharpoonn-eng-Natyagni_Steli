import { chordsProperIntersect, edgeKey } from './math'
import type { SuggestedDiagonal, VertexLabel } from './types'

export interface Triangle {
  a: number
  b: number
  c: number
  name: string
}

export function isBoundaryEdge(i: number, j: number, n: number): boolean {
  const d = Math.abs(i - j)
  return d === 1 || d === n - 1
}

export function isValidDiagonalIndices(i: number, j: number, n: number): boolean {
  return i !== j && !isBoundaryEdge(i, j, n)
}

export function diagonalsIntersect(diagonals: Array<[number, number]>): boolean {
  for (let i = 0; i < diagonals.length; i += 1) {
    for (let j = i + 1; j < diagonals.length; j += 1) {
      const [a, b] = diagonals[i]
      const [c, d] = diagonals[j]
      if (chordsProperIntersect(a, b, c, d)) return true
    }
  }
  return false
}

/** Fan triangulation from vertex 0: diagonals 0-2 … 0-(n-2). */
export function fanTriangulation(n: number, root = 0): Array<[number, number]> {
  const diagonals: Array<[number, number]> = []
  for (let step = 2; step <= n - 2; step += 1) {
    const j = (root + step) % n
    if (isValidDiagonalIndices(root, j, n)) diagonals.push([root, j])
  }
  return diagonals
}

/**
 * For a simple polygon, any set of n−3 mutually non-crossing diagonals is a triangulation.
 * Faces = all 3-cycles in the maximal outerplanar graph (exactly n−2).
 */
export function findTriangles(
  n: number,
  constructionDiagonals: Array<[number, number]>,
  labels: VertexLabel[],
): Triangle[] {
  const edges = new Set<string>()
  for (let i = 0; i < n; i += 1) edges.add(edgeKey(i, (i + 1) % n))
  for (const [i, j] of constructionDiagonals) edges.add(edgeKey(i, j))

  const triangles: Triangle[] = []
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      for (let k = j + 1; k < n; k += 1) {
        if (
          edges.has(edgeKey(i, j)) &&
          edges.has(edgeKey(j, k)) &&
          edges.has(edgeKey(i, k))
        ) {
          triangles.push({
            a: i,
            b: j,
            c: k,
            name: `${labels[i]}-${labels[j]}-${labels[k]}`,
          })
        }
      }
    }
  }
  return triangles
}

export function validateTriangulation(
  n: number,
  constructionDiagonals: Array<[number, number]>,
): { ok: true } | { ok: false; reason: 'count' | 'intersect' | 'incomplete' } {
  const needed = n - 3
  if (constructionDiagonals.length !== needed) return { ok: false, reason: 'count' }
  if (diagonalsIntersect(constructionDiagonals)) return { ok: false, reason: 'intersect' }

  for (const [i, j] of constructionDiagonals) {
    if (!isValidDiagonalIndices(i, j, n)) return { ok: false, reason: 'incomplete' }
  }

  return { ok: true }
}

export function suggestMissingDiagonals(
  n: number,
  labels: VertexLabel[],
  existingConstruction: Array<[number, number]>,
): SuggestedDiagonal[] {
  const existing = new Set(existingConstruction.map(([i, j]) => edgeKey(i, j)))
  const needed = n - 3
  const suggested: SuggestedDiagonal[] = []

  for (let root = 0; root < n && suggested.length + existingConstruction.length < needed; root += 1) {
    const candidate = fanTriangulation(n, root)
    if (diagonalsIntersect([...existingConstruction, ...candidate.filter(([i, j]) => !existing.has(edgeKey(i, j)))])) {
      continue
    }
    for (const [i, j] of candidate) {
      if (existing.has(edgeKey(i, j))) continue
      if (diagonalsIntersect([...existingConstruction, ...suggested.map((s) => labelPairToIndex(s, labels)), [i, j]])) {
        continue
      }
      suggested.push({ from: labels[i], to: labels[j] })
      if (suggested.length + existingConstruction.length >= needed) break
    }
  }

  if (suggested.length + existingConstruction.length < needed) {
    for (const [i, j] of fanTriangulation(n, 0)) {
      if (!existing.has(edgeKey(i, j)) && !suggested.some((s) => edgeKey(labels.indexOf(s.from), labels.indexOf(s.to)) === edgeKey(i, j))) {
        suggested.push({ from: labels[i], to: labels[j] })
      }
    }
  }

  return suggested.slice(0, Math.max(0, needed - existingConstruction.length))
}

function labelPairToIndex(s: SuggestedDiagonal, labels: VertexLabel[]): [number, number] {
  return [labels.indexOf(s.from), labels.indexOf(s.to)]
}

export function formatDiagonalList(diagonals: SuggestedDiagonal[]): string {
  return diagonals.map((d) => `${d.from}-${d.to}`).join(', ')
}
