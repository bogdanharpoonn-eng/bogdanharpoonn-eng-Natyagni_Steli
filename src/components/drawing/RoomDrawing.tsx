import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import type { BuildRoomSuccess, MeasurementResidual } from '@/core/geometry'
import { formatCm } from '@/features/room/labels'
import { useSettingsStore } from '@/stores/settingsStore'
import { uk } from '@/i18n/uk'

interface RoomDrawingProps {
  success: BuildRoomSuccess | null
  residuals?: MeasurementResidual[]
  className?: string
}

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

function residualMap(residuals: MeasurementResidual[] | undefined): Map<string, number> {
  const map = new Map<string, number>()
  if (!residuals) return map
  for (const r of residuals) {
    const key = [r.from, r.to].sort().join('-')
    map.set(key, r.residualMm)
  }
  return map
}

function edgeColor(residualMm: number | undefined, toleranceMm: number): string {
  if (residualMm === undefined) return '#94a3b8'
  if (residualMm > 2 * toleranceMm) return '#f87171'
  if (residualMm > toleranceMm) return '#fbbf24'
  return '#94a3b8'
}

export function RoomDrawing({ success, residuals, className }: RoomDrawingProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: 1000, h: 1000 })
  const drag = useRef<{ x: number; y: number; view: ViewBox } | null>(null)
  const toleranceMm = useSettingsStore((s) => s.toleranceMm)

  const bounds = useMemo(() => {
    if (!success || success.vertices.length === 0) return null
    const xs = success.vertices.map((v) => v.x)
    const ys = success.vertices.map((v) => v.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = Math.max(maxX - minX, maxY - minY, 1000) * 0.12
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + 2 * pad,
      h: maxY - minY + 2 * pad,
    }
  }, [success])

  const fit = useCallback(() => {
    if (bounds) setView(bounds)
  }, [bounds])

  useEffect(() => {
    fit()
  }, [fit])

  const resMap = residualMap(residuals ?? success?.residuals)

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    svgRef.current.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, view: { ...view } }
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.x) / rect.width) * drag.current.view.w
    const dy = ((e.clientY - drag.current.y) / rect.height) * drag.current.view.h
    setView({
      ...drag.current.view,
      x: drag.current.view.x - dx,
      y: drag.current.view.y - dy,
    })
  }

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = null
    svgRef.current?.releasePointerCapture(e.pointerId)
  }

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1.1 : 0.9
    setView((v) => {
      const w = v.w * factor
      const h = v.h * factor
      return {
        x: v.x + (v.w - w) / 2,
        y: v.y + (v.h - h) / 2,
        w,
        h,
      }
    })
  }

  if (!success) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-400 ${className ?? ''}`}
      >
        {uk.drawingEmpty}
      </div>
    )
  }

  const pts = success.vertices
  const polygon = pts.map((v) => `${v.x},${v.y}`).join(' ')
  const fontSize = Math.max(view.w, view.h) * 0.035

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900 ${className ?? ''}`}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-[240px] w-full touch-none sm:h-[280px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        role="img"
        aria-label={uk.drawingTitle}
      >
        <polygon
          points={polygon}
          fill="rgba(56,189,248,0.08)"
          stroke="#38bdf8"
          strokeWidth={Math.max(view.w, view.h) * 0.004}
        />

        {pts.map((v, i) => {
          const next = pts[(i + 1) % pts.length]
          const key = [v.label, next.label].sort().join('-')
          const midX = (v.x + next.x) / 2
          const midY = (v.y + next.y) / 2
          const color = edgeColor(resMap.get(key), toleranceMm)
          return (
            <g key={`side-${v.label}`}>
              <line
                x1={v.x}
                y1={v.y}
                x2={next.x}
                y2={next.y}
                stroke={color}
                strokeWidth={Math.max(view.w, view.h) * 0.005}
              />
              <text
                x={midX}
                y={midY}
                fill={color}
                fontSize={fontSize * 0.85}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {formatCm(Math.hypot(next.x - v.x, next.y - v.y))}
              </text>
            </g>
          )
        })}

        {success.residuals
          .filter((r) => r.kind === 'diagonal')
          .map((r) => {
            const a = pts.find((v) => v.label === r.from)
            const b = pts.find((v) => v.label === r.to)
            if (!a || !b) return null
            const key = [r.from, r.to].sort().join('-')
            const color = edgeColor(resMap.get(key), toleranceMm)
            return (
              <line
                key={`diag-${key}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={Math.max(view.w, view.h) * 0.003}
                strokeDasharray={`${fontSize} ${fontSize * 0.6}`}
              />
            )
          })}

        {pts.map((v) => (
          <g key={`v-${v.label}`}>
            <circle cx={v.x} cy={v.y} r={fontSize * 0.35} fill="#0f172a" stroke="#e2e8f0" strokeWidth={fontSize * 0.08} />
            <text
              x={v.x}
              y={v.y}
              fill="#f8fafc"
              fontSize={fontSize * 0.9}
              textAnchor="middle"
              dominantBaseline="central"
              fontWeight={600}
            >
              {v.label}
            </text>
          </g>
        ))}
      </svg>

      <button
        type="button"
        onClick={fit}
        className="absolute bottom-2 right-2 min-h-touch min-w-touch rounded-md bg-slate-800 px-3 text-sm text-slate-100 ring-1 ring-slate-600"
      >
        {uk.drawingFit}
      </button>
    </div>
  )
}
