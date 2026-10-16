import type { BuildRoomSuccess } from '@/core/geometry'
import { formatCm } from '@/features/room/labels'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Standalone SVG markup for a built room (for PNG/PDF). */
export function buildRoomSvgMarkup(success: BuildRoomSuccess, width = 640, height = 480): string {
  const xs = success.vertices.map((v) => v.x)
  const ys = success.vertices.map((v) => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const pad = Math.max(maxX - minX, maxY - minY, 1000) * 0.12
  const vbX = minX - pad
  const vbY = minY - pad
  const vbW = maxX - minX + 2 * pad
  const vbH = maxY - minY + 2 * pad
  const stroke = Math.max(vbW, vbH) * 0.004
  const fontSize = Math.max(vbW, vbH) * 0.035
  const polygon = success.vertices.map((v) => `${v.x},${v.y}`).join(' ')

  const sides = success.vertices
    .map((v, i) => {
      const next = success.vertices[(i + 1) % success.vertices.length]
      const midX = (v.x + next.x) / 2
      const midY = (v.y + next.y) / 2
      const len = formatCm(Math.hypot(next.x - v.x, next.y - v.y))
      return `
      <line x1="${v.x}" y1="${v.y}" x2="${next.x}" y2="${next.y}" stroke="#334155" stroke-width="${stroke}" />
      <text x="${midX}" y="${midY}" fill="#0f172a" font-size="${fontSize * 0.85}" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial, sans-serif">${escapeXml(len)}</text>`
    })
    .join('')

  const diags = success.residuals
    .filter((r) => r.kind === 'diagonal')
    .map((r) => {
      const a = success.vertices.find((v) => v.label === r.from)
      const b = success.vertices.find((v) => v.label === r.to)
      if (!a || !b) return ''
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#64748b" stroke-width="${stroke * 0.7}" stroke-dasharray="${fontSize} ${fontSize * 0.5}" />`
    })
    .join('')

  const verts = success.vertices
    .map(
      (v) => `
      <circle cx="${v.x}" cy="${v.y}" r="${fontSize * 0.35}" fill="#fff" stroke="#0f172a" stroke-width="${fontSize * 0.08}" />
      <text x="${v.x}" y="${v.y}" fill="#0f172a" font-size="${fontSize * 0.9}" text-anchor="middle" dominant-baseline="central" font-weight="600" font-family="Segoe UI, Arial, sans-serif">${escapeXml(v.label)}</text>`,
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#ffffff"/>
  <polygon points="${polygon}" fill="rgba(14,165,233,0.08)" stroke="#0284c7" stroke-width="${stroke}"/>
  ${diags}
  ${sides}
  ${verts}
</svg>`
}

export function svgMarkupToElement(markup: string): SVGSVGElement {
  const parser = new DOMParser()
  const doc = parser.parseFromString(markup, 'image/svg+xml')
  const svg = doc.documentElement
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('Не вдалося створити SVG')
  }
  return svg
}
