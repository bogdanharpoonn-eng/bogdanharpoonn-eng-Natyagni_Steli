import { useEffect, useMemo } from 'react'
import { RoomDrawing } from '@/components/drawing/RoomDrawing'
import { useRoomSessionStore } from '@/stores/roomSessionStore'
import { MeasureInputs } from './MeasureInputs'
import { ResultsPanel } from './ResultsPanel'
import { uk } from '@/i18n/uk'

export function RoomScreen() {
  const boot = useRoomSessionStore((s) => s.boot)
  const booting = useRoomSessionStore((s) => s.booting)
  const bootError = useRoomSessionStore((s) => s.bootError)
  const order = useRoomSessionStore((s) => s.order)
  const roomId = useRoomSessionStore((s) => s.roomId)
  const result = useRoomSessionStore((s) => s.result)
  const lastSuccess = useRoomSessionStore((s) => s.lastSuccess)
  const setRoomName = useRoomSessionStore((s) => s.setRoomName)
  const setCornerCount = useRoomSessionStore((s) => s.setCornerCount)
  const setSideCm = useRoomSessionStore((s) => s.setSideCm)
  const setDiagonalCm = useRoomSessionStore((s) => s.setDiagonalCm)
  const toggleDiagonalControl = useRoomSessionStore((s) => s.toggleDiagonalControl)
  const setCornerType = useRoomSessionStore((s) => s.setCornerType)
  const suggestedDiagonals = useRoomSessionStore((s) => s.suggestedDiagonals)
  const flushSave = useRoomSessionStore((s) => s.flushSave)

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(() => {
    const onHide = () => {
      void flushSave()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      void flushSave()
    }
  }, [flushSave])

  const room = useMemo(() => {
    if (!order || !roomId) return null
    return order.rooms.find((r) => r.id === roomId) ?? null
  }, [order, roomId])

  const suggested = room ? suggestedDiagonals() : []
  const sidesReady = !!room && room.sides.every((s) => s.length > 0)
  const drawingSuccess = result && result.ok ? result : lastSuccess

  if (booting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-300">
        {uk.roomBooting}
      </div>
    )
  }

  if (bootError || !room) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-center text-red-200">
        {bootError ?? uk.roomBootError}
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header>
          <p className="text-sm text-slate-400">{uk.appTitle}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{uk.roomTitle}</h1>
        </header>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-400">{uk.roomName}</span>
          <input
            type="text"
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-base outline-none ring-sky-500 focus:ring-2"
            value={room.name}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-400">{uk.roomCorners}</span>
          <select
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-base outline-none ring-sky-500 focus:ring-2"
            value={room.vertices.length}
            onChange={(e) => setCornerCount(Number(e.target.value))}
          >
            {Array.from({ length: 18 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <RoomDrawing
          success={drawingSuccess}
          residuals={result && result.ok ? result.residuals : drawingSuccess?.residuals}
        />

        <ResultsPanel result={result} sidesReady={sidesReady} />

        <MeasureInputs
          room={room}
          suggested={suggested}
          onSideCm={setSideCm}
          onDiagonalCm={setDiagonalCm}
          onToggleControl={toggleDiagonalControl}
          onCornerType={setCornerType}
        />
      </div>
    </div>
  )
}
