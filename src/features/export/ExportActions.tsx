import { useRef, useState } from 'react'
import type { Order } from '@/data'
import { getOrderRepository } from '@/data'
import { useOrdersStore } from '@/stores/ordersStore'
import { useNavStore } from '@/stores/navStore'
import {
  downloadOrderPdf,
  downloadRoomPngs,
  exportOrderJson,
  shareOrder,
} from './shareOrder'
import { orderFromJson } from './jsonExport'
import { uk } from '@/i18n/uk'

interface ExportActionsProps {
  order: Order
}

export function ExportActions({ order }: ExportActionsProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const refreshList = useOrdersStore((s) => s.refreshList)
  const updateStatus = useOrdersStore((s) => s.updateStatus)
  const goOrder = useNavStore((s) => s.goOrder)
  const goSettings = useNavStore((s) => s.goSettings)

  const run = async (fn: () => Promise<void>, okMessage: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      setMessage(okMessage)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : uk.shareError)
    } finally {
      setBusy(false)
    }
  }

  const onShare = async () => {
    setBusy(true)
    setMessage(null)
    const result = await shareOrder(order)
    if (result.status === 'done' && result.message !== uk.shareCancelled) {
      updateStatus('sent')
    }
    setMessage(result.message)
    setBusy(false)
  }

  const onImportJson = async (file: File) => {
    setBusy(true)
    setMessage(null)
    try {
      const text = await file.text()
      const imported = orderFromJson(text)
      await getOrderRepository().saveOrder(imported)
      await refreshList()
      goOrder(imported.id)
      setMessage(uk.exportImportDone)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : uk.exportImportError)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="theme-card space-y-2 rounded-lg p-3">
      <h2 className="text-sm font-semibold">{uk.exportTitle}</h2>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onShare()}
        className="theme-btn-primary min-h-touch w-full rounded-md text-sm font-medium disabled:opacity-50"
        data-testid="share-order"
      >
        {uk.exportShare}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => downloadOrderPdf(order), uk.exportPdfDone)}
          className="theme-btn-ghost min-h-touch rounded-md text-sm disabled:opacity-50"
        >
          {uk.exportPdf}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const n = await downloadRoomPngs(order)
              if (n === 0) throw new Error(uk.exportPngEmpty)
            }, uk.exportPngDone)
          }
          className="theme-btn-ghost min-h-touch rounded-md text-sm disabled:opacity-50"
        >
          {uk.exportPng}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => exportOrderJson(order), uk.exportJsonDone)}
          className="theme-btn-ghost min-h-touch rounded-md text-sm disabled:opacity-50"
        >
          {uk.exportJson}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="theme-btn-ghost min-h-touch rounded-md text-sm disabled:opacity-50"
        >
          {uk.exportImportJson}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImportJson(file)
        }}
      />

      <button
        type="button"
        className="theme-btn-ghost min-h-touch w-full rounded-md text-sm"
        onClick={goSettings}
      >
        {uk.exportPdfProfile} → {uk.settingsTitle}
      </button>

      {busy ? <p className="text-sm theme-muted">{uk.exportWorking}</p> : null}
      {message ? <p className="text-sm text-sky-700 dark:text-sky-200">{message}</p> : null}
    </section>
  )
}
