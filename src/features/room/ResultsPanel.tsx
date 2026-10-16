import type { BuildRoomResult } from '@/core/geometry'
import { uk } from '@/i18n/uk'

interface ResultsPanelProps {
  result: BuildRoomResult | null
  sidesReady: boolean
}

function statusLabel(status: 'ok' | 'warn' | 'fail'): string {
  if (status === 'ok') return uk.roomStatusOk
  if (status === 'warn') return uk.roomStatusWarn
  return uk.roomStatusFail
}

function statusClass(status: 'ok' | 'warn' | 'fail'): string {
  if (status === 'ok') return 'border-emerald-700 bg-emerald-950 text-emerald-200'
  if (status === 'warn') return 'border-amber-700 bg-amber-950 text-amber-100'
  return 'border-red-700 bg-red-950 text-red-100'
}

export function ResultsPanel({ result, sidesReady }: ResultsPanelProps) {
  if (!sidesReady) {
    return (
      <section className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400">
        {uk.roomWaitingSides}
      </section>
    )
  }

  if (!result) return null

  if (!result.ok) {
    return (
      <section className="rounded-lg border border-red-800 bg-red-950/60 px-4 py-3">
        <h2 className="text-base font-semibold text-red-100">{uk.roomResults}</h2>
        <p className="mt-2 text-sm text-red-100">{result.message}</p>
      </section>
    )
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
      <h2 className="text-base font-semibold text-slate-100">{uk.roomResults}</h2>

      <div className={`rounded-md border px-3 py-2 text-sm ${statusClass(result.errorStatus)}`}>
        <div className="font-medium">
          {uk.roomErrorStatus}: {statusLabel(result.errorStatus)}
        </div>
        {result.message ? <p className="mt-1 opacity-90">{result.message}</p> : null}
        <p className="mt-1 opacity-80">
          {uk.roomMaxResidual}: {result.maxResidualMm.toFixed(1)} {uk.unitMm}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-400">{uk.roomArea}</dt>
          <dd className="text-lg font-semibold text-slate-50">
            {result.areaM2.toFixed(2)} {uk.unitM2}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{uk.roomPerimeter}</dt>
          <dd className="text-lg font-semibold text-slate-50">
            {result.perimeterM.toFixed(2)} {uk.unitM}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm text-slate-400">{uk.roomAngles}</h3>
        <ul className="mt-1 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
          {result.vertices.map((v) => (
            <li key={v.label} className="text-slate-200">
              {v.label}: {v.interiorAngleDeg.toFixed(1)}
              {uk.unitDeg}
              {v.cornerType === 'internal' ? ` (${uk.roomCornerInternal})` : ''}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
