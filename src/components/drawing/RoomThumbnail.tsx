import { useMemo } from 'react'
import type { BuildRoomSuccess } from '@/core/geometry'

interface RoomThumbnailProps {
  success: BuildRoomSuccess | null
  className?: string
}

export function RoomThumbnail({ success, className }: RoomThumbnailProps) {
  const view = useMemo(() => {
    if (!success || success.vertices.length === 0) return null
    const xs = success.vertices.map((v) => v.x)
    const ys = success.vertices.map((v) => v.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = Math.max(maxX - minX, maxY - minY, 500) * 0.15
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + 2 * pad,
      h: maxY - minY + 2 * pad,
    }
  }, [success])

  if (!success || !view) {
    return (
      <div
        className={`flex h-16 w-20 items-center justify-center rounded bg-slate-800 text-[10px] text-slate-500 ${className ?? ''}`}
      >
        —
      </div>
    )
  }

  const polygon = success.vertices.map((v) => `${v.x},${v.y}`).join(' ')

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      className={`h-16 w-20 rounded bg-slate-800 ${className ?? ''}`}
      aria-hidden
    >
      <polygon
        points={polygon}
        fill="rgba(56,189,248,0.15)"
        stroke="#38bdf8"
        strokeWidth={Math.max(view.w, view.h) * 0.02}
      />
    </svg>
  )
}
