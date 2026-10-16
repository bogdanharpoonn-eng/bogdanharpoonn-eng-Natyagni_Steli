import { useEffect, useState } from 'react'
import { RoomThumbnail } from '@/components/drawing/RoomThumbnail'
import { summarizeRoom } from '@/features/room/roomSummary'
import type { RoomTemplateId } from '@/features/room/templates'
import { useNavStore } from '@/stores/navStore'
import { useOrdersStore } from '@/stores/ordersStore'
import { TemplatePicker } from './TemplatePicker'
import { uk } from '@/i18n/uk'

interface OrderDetailScreenProps {
  orderId: string
}

function errorBadge(status: ReturnType<typeof summarizeRoom>['errorStatus']): string {
  if (status === 'ok') return uk.roomStatusOk
  if (status === 'warn') return uk.roomStatusWarn
  if (status === 'fail') return uk.roomStatusFail
  if (status === 'error') return uk.roomSummaryError
  return uk.roomSummaryIncomplete
}

function badgeClass(status: ReturnType<typeof summarizeRoom>['errorStatus']): string {
  if (status === 'ok') return 'text-emerald-300'
  if (status === 'warn') return 'text-amber-300'
  if (status === 'fail' || status === 'error') return 'text-red-300'
  return 'text-slate-400'
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const current = useOrdersStore((s) => s.current)
  const loading = useOrdersStore((s) => s.loading)
  const error = useOrdersStore((s) => s.error)
  const loadOrder = useOrdersStore((s) => s.loadOrder)
  const updateClient = useOrdersStore((s) => s.updateClient)
  const updateNote = useOrdersStore((s) => s.updateNote)
  const updateStatus = useOrdersStore((s) => s.updateStatus)
  const addRoom = useOrdersStore((s) => s.addRoom)
  const removeRoom = useOrdersStore((s) => s.removeRoom)
  const deleteOrder = useOrdersStore((s) => s.deleteOrder)
  const flushSave = useOrdersStore((s) => s.flushSave)
  const goOrders = useNavStore((s) => s.goOrders)
  const goRoom = useNavStore((s) => s.goRoom)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    void loadOrder(orderId)
  }, [loadOrder, orderId])

  useEffect(() => {
    const onHide = () => {
      void flushSave()
    }
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      void flushSave()
    }
  }, [flushSave])

  if (loading && !current) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-300">
        {uk.ordersLoading}
      </div>
    )
  }

  if (error || !current) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-950 px-4 text-red-200">
        <p>{error ?? uk.orderNotFound}</p>
        <button type="button" className="min-h-touch px-4 text-sky-300" onClick={goOrders}>
          {uk.commonBack}
        </button>
      </div>
    )
  }

  const onAddRoom = (template: RoomTemplateId, customCorners?: number) => {
    const roomId = addRoom(template, customCorners)
    setShowTemplates(false)
    if (roomId) goRoom(current.id, roomId)
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void flushSave().then(goOrders)
            }}
            className="min-h-touch min-w-touch rounded-md px-2 text-sky-300 ring-1 ring-slate-700"
          >
            {uk.commonBack}
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{uk.orderTitle}</h1>
        </header>

        <section className="space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-3">
          <h2 className="text-sm font-semibold text-slate-300">{uk.orderClient}</h2>
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3"
            placeholder={uk.orderClientName}
            value={current.client.name}
            onChange={(e) => updateClient({ name: e.target.value })}
          />
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3"
            placeholder={uk.orderClientPhone}
            inputMode="tel"
            value={current.client.phone}
            onChange={(e) => updateClient({ phone: e.target.value })}
          />
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3"
            placeholder={uk.orderClientAddress}
            value={current.client.address}
            onChange={(e) => updateClient({ address: e.target.value })}
          />
          <textarea
            className="min-h-[96px] w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2"
            placeholder={uk.orderNote}
            value={current.note}
            onChange={(e) => updateNote(e.target.value)}
          />
          <label className="block text-sm text-slate-400">
            {uk.orderStatus}
            <select
              className="mt-1 min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-slate-100"
              value={current.status}
              onChange={(e) => updateStatus(e.target.value as 'draft' | 'done' | 'sent')}
            >
              <option value="draft">{uk.orderStatusDraft}</option>
              <option value="done">{uk.orderStatusDone}</option>
              <option value="sent">{uk.orderStatusSent}</option>
            </select>
          </label>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{uk.orderRooms}</h2>
            <button
              type="button"
              className="min-h-touch rounded-md bg-sky-600 px-3 text-sm font-medium"
              onClick={() => setShowTemplates((v) => !v)}
            >
              {uk.orderAddRoom}
            </button>
          </div>

          {showTemplates ? (
            <TemplatePicker onPick={onAddRoom} onCancel={() => setShowTemplates(false)} />
          ) : null}

          {current.rooms.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
              {uk.orderRoomsEmpty}
            </p>
          ) : (
            <ul className="space-y-2">
              {current.rooms.map((room) => {
                const summary = summarizeRoom(room)
                return (
                  <li key={room.id}>
                    <div className="flex items-stretch gap-2 rounded-lg border border-slate-700 bg-slate-900 p-2">
                      <button
                        type="button"
                        className="flex min-h-touch flex-1 items-center gap-3 text-left"
                        onClick={() => {
                          void flushSave().then(() => goRoom(current.id, room.id))
                        }}
                      >
                        <RoomThumbnail success={summary.success} />
                        <span>
                          <span className="block font-medium text-slate-50">{room.name}</span>
                          <span className="mt-1 block text-sm text-slate-400">
                            {summary.areaM2 !== null
                              ? `${summary.areaM2.toFixed(2)} ${uk.unitM2}`
                              : uk.roomSummaryNoArea}
                          </span>
                          <span className={`mt-1 block text-xs ${badgeClass(summary.errorStatus)}`}>
                            {errorBadge(summary.errorStatus)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="min-h-touch min-w-touch rounded-md px-2 text-xs text-red-300 ring-1 ring-slate-700"
                        onClick={() => removeRoom(room.id)}
                        aria-label={uk.orderRemoveRoom}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <button
          type="button"
          className="min-h-touch rounded-md text-sm text-red-300 ring-1 ring-red-900"
          onClick={() => {
            if (window.confirm(uk.orderDeleteConfirm)) {
              void deleteOrder(current.id).then(goOrders)
            }
          }}
        >
          {uk.orderDelete}
        </button>
      </div>
    </div>
  )
}
