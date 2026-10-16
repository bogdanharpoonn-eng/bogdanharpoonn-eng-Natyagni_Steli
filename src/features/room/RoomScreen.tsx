import { useEffect, useMemo, useState } from 'react'
import { RoomDrawing } from '@/components/drawing/RoomDrawing'
import { TemplatePicker } from '@/features/orders/TemplatePicker'
import { useNavStore } from '@/stores/navStore'
import { useRoomSessionStore } from '@/stores/roomSessionStore'
import { MeasureInputs } from './MeasureInputs'
import { ResultsPanel } from './ResultsPanel'
import { uk } from '@/i18n/uk'

interface RoomScreenProps {
  orderId: string
  roomId: string
}

export function RoomScreen({ orderId, roomId }: RoomScreenProps) {
  const openRoom = useRoomSessionStore((s) => s.openRoom)
  const loading = useRoomSessionStore((s) => s.loading)
  const loadError = useRoomSessionStore((s) => s.loadError)
  const order = useRoomSessionStore((s) => s.order)
  const activeRoomId = useRoomSessionStore((s) => s.roomId)
  const result = useRoomSessionStore((s) => s.result)
  const lastSuccess = useRoomSessionStore((s) => s.lastSuccess)
  const setRoomName = useRoomSessionStore((s) => s.setRoomName)
  const setCornerCount = useRoomSessionStore((s) => s.setCornerCount)
  const applyTemplate = useRoomSessionStore((s) => s.applyTemplate)
  const setSideCm = useRoomSessionStore((s) => s.setSideCm)
  const setDiagonalCm = useRoomSessionStore((s) => s.setDiagonalCm)
  const toggleDiagonalControl = useRoomSessionStore((s) => s.toggleDiagonalControl)
  const setCornerType = useRoomSessionStore((s) => s.setCornerType)
  const suggestedDiagonals = useRoomSessionStore((s) => s.suggestedDiagonals)
  const flushSave = useRoomSessionStore((s) => s.flushSave)
  const goOrder = useNavStore((s) => s.goOrder)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    void openRoom(orderId, roomId)
  }, [openRoom, orderId, roomId])

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
    if (!order || !activeRoomId) return null
    return order.rooms.find((r) => r.id === activeRoomId) ?? null
  }, [order, activeRoomId])

  const suggested = room ? suggestedDiagonals() : []
  const sidesReady = !!room && room.sides.every((s) => s.length > 0)
  const drawingSuccess = result && result.ok ? result : lastSuccess

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-300">
        {uk.roomBooting}
      </div>
    )
  }

  if (loadError || !room || !order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-950 px-4 text-center text-red-200">
        <p>{loadError ?? uk.roomBootError}</p>
        <button type="button" className="min-h-touch text-sky-300" onClick={() => goOrder(orderId)}>
          {uk.commonBack}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void flushSave().then(() => goOrder(order.id))
            }}
            className="min-h-touch min-w-touch rounded-md px-2 text-sky-300 ring-1 ring-slate-700"
          >
            {uk.commonBack}
          </button>
          <div>
            <p className="text-sm text-slate-400">{uk.appTitle}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{uk.roomTitle}</h1>
          </div>
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-touch rounded-md px-3 text-sm ring-1 ring-slate-600"
            onClick={() => setShowTemplates((v) => !v)}
          >
            {uk.templateTitle}
          </button>
          <label className="flex min-h-touch items-center gap-2 text-sm text-slate-300">
            <span>{uk.roomCorners}</span>
            <select
              className="min-h-touch rounded-md border border-slate-600 bg-slate-900 px-2"
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
        </div>

        {showTemplates ? (
          <TemplatePicker
            onPick={(template, corners) => {
              applyTemplate(template, corners)
              setShowTemplates(false)
            }}
            onCancel={() => setShowTemplates(false)}
          />
        ) : null}

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
