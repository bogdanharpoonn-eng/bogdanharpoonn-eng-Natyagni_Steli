import { useEffect, useMemo, useRef } from 'react'
import type { Room } from '@/data'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatLength, lengthUnitLabel } from './labels'
import { uk } from '@/i18n/uk'

interface MeasureInputsProps {
  room: Room
  suggested: Array<{ from: string; to: string }>
  onSideCm: (from: string, to: string, raw: string) => void
  onDiagonalCm: (from: string, to: string, raw: string, isControl?: boolean) => void
  onToggleControl: (from: string, to: string) => void
  onCornerType: (label: string, cornerType: 'internal' | 'external') => void
}

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('-')
}

export function MeasureInputs({
  room,
  suggested,
  onSideCm,
  onDiagonalCm,
  onToggleControl,
  onCornerType,
}: MeasureInputsProps) {
  const lengthUnit = useSettingsStore((s) => s.lengthUnit)
  const unitLabel = lengthUnitLabel(lengthUnit)
  const sideRefs = useRef<Array<HTMLInputElement | null>>([])
  const diagRefs = useRef<Array<HTMLInputElement | null>>([])

  const diagonalRows = useMemo(() => {
    const map = new Map<string, { from: string; to: string; length: number; isControl: boolean }>()
    for (const d of room.diagonals) {
      map.set(edgeKey(d.from, d.to), d)
    }
    for (const s of suggested) {
      const k = edgeKey(s.from, s.to)
      if (!map.has(k)) {
        map.set(k, { from: s.from, to: s.to, length: 0, isControl: false })
      }
    }
    return [...map.values()].sort((a, b) => {
      if (a.isControl !== b.isControl) return a.isControl ? 1 : -1
      return `${a.from}${a.to}`.localeCompare(`${b.from}${b.to}`)
    })
  }, [room.diagonals, suggested])

  useEffect(() => {
    sideRefs.current = sideRefs.current.slice(0, room.sides.length)
  }, [room.sides.length])

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-base font-semibold">{uk.roomSides}</h2>
        <div className="space-y-2">
          {room.sides.map((side, index) => (
            <label key={`${side.from}-${side.to}`} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-sm font-medium theme-muted">
                {side.from}-{side.to}
              </span>
              <input
                ref={(el) => {
                  sideRefs.current[index] = el
                }}
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                data-testid={`side-${side.from}-${side.to}`}
                className="theme-input min-h-touch w-full rounded-md px-3 text-lg"
                placeholder="0"
                defaultValue={side.length > 0 ? formatLength(side.length, lengthUnit) : ''}
                key={`side-val-${side.from}-${side.to}-${side.length}-${lengthUnit}`}
                onBlur={(e) => onSideCm(side.from, side.to, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onSideCm(side.from, side.to, (e.target as HTMLInputElement).value)
                    const next = sideRefs.current[index + 1]
                    if (next) next.focus()
                    else diagRefs.current[0]?.focus()
                  }
                }}
              />
              <span className="w-8 text-sm theme-muted">{unitLabel}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">{uk.roomDiagonals}</h2>
        {suggested.length > 0 ? (
          <p className="mb-2 text-sm text-amber-700 dark:text-amber-200">
            {uk.roomSuggested}: {suggested.map((s) => `${s.from}-${s.to}`).join(', ')}
          </p>
        ) : null}
        <div className="space-y-2">
          {diagonalRows.map((diag, index) => (
            <div key={`${diag.from}-${diag.to}`} className="flex flex-wrap items-center gap-2">
              <span className="w-14 shrink-0 text-sm font-medium theme-muted">
                {diag.from}-{diag.to}
              </span>
              <input
                ref={(el) => {
                  diagRefs.current[index] = el
                }}
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                data-testid={`diag-${diag.from}-${diag.to}`}
                className="theme-input min-h-touch min-w-0 flex-1 rounded-md px-3 text-lg"
                placeholder="0"
                defaultValue={diag.length > 0 ? formatLength(diag.length, lengthUnit) : ''}
                key={`diag-val-${diag.from}-${diag.to}-${diag.length}-${diag.isControl}-${lengthUnit}`}
                onBlur={(e) =>
                  onDiagonalCm(diag.from, diag.to, e.target.value, diag.isControl)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onDiagonalCm(
                      diag.from,
                      diag.to,
                      (e.target as HTMLInputElement).value,
                      diag.isControl,
                    )
                    diagRefs.current[index + 1]?.focus()
                  }
                }}
              />
              <span className="text-sm theme-muted">{unitLabel}</span>
              {diag.length > 0 ? (
                <button
                  type="button"
                  className="theme-btn-ghost min-h-touch rounded-md px-2 text-xs"
                  onClick={() => onToggleControl(diag.from, diag.to)}
                >
                  {diag.isControl ? uk.roomControl : uk.roomConstruction}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">{uk.roomCornersTypes}</h2>
        <div className="flex flex-wrap gap-2">
          {room.vertices.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`min-h-touch min-w-touch rounded-md px-3 text-sm ring-1 ${
                v.cornerType === 'internal'
                  ? 'bg-violet-100 text-violet-900 ring-violet-400 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-600'
                  : 'theme-btn-ghost'
              }`}
              onClick={() =>
                onCornerType(v.label, v.cornerType === 'internal' ? 'external' : 'internal')
              }
            >
              {v.label}:{' '}
              {v.cornerType === 'internal' ? uk.roomCornerInternal : uk.roomCornerExternal}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
