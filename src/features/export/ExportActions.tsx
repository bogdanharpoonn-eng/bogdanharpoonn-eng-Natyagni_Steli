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
import { loadCompanyProfile, saveCompanyProfile } from './companyProfile'
import { uk } from '@/i18n/uk'

interface ExportActionsProps {
  order: Order
}

export function ExportActions({ order }: ExportActionsProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState(loadCompanyProfile)
  const fileRef = useRef<HTMLInputElement>(null)
  const refreshList = useOrdersStore((s) => s.refreshList)
  const updateStatus = useOrdersStore((s) => s.updateStatus)
  const goOrder = useNavStore((s) => s.goOrder)

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
    <section className="space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-3">
      <h2 className="text-sm font-semibold text-slate-300">{uk.exportTitle}</h2>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onShare()}
        className="min-h-touch w-full rounded-md bg-sky-600 text-sm font-medium text-white disabled:opacity-50"
      >
        {uk.exportShare}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => downloadOrderPdf(order), uk.exportPdfDone)}
          className="min-h-touch rounded-md text-sm ring-1 ring-slate-600 disabled:opacity-50"
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
          className="min-h-touch rounded-md text-sm ring-1 ring-slate-600 disabled:opacity-50"
        >
          {uk.exportPng}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => exportOrderJson(order), uk.exportJsonDone)}
          className="min-h-touch rounded-md text-sm ring-1 ring-slate-600 disabled:opacity-50"
        >
          {uk.exportJson}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="min-h-touch rounded-md text-sm ring-1 ring-slate-600 disabled:opacity-50"
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
        className="min-h-touch w-full rounded-md text-sm text-slate-300 ring-1 ring-slate-700"
        onClick={() => {
          setProfile(loadCompanyProfile())
          setShowProfile((v) => !v)
        }}
      >
        {uk.exportPdfProfile}
      </button>

      {showProfile ? (
        <div className="space-y-2 rounded-md border border-slate-700 p-2">
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm"
            placeholder={uk.pdfCompany}
            value={profile.companyName}
            onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
          />
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm"
            placeholder={uk.pdfSurveyor}
            value={profile.surveyorName}
            onChange={(e) => setProfile((p) => ({ ...p, surveyorName: e.target.value }))}
          />
          <input
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm"
            placeholder={uk.pdfPhone}
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
          <button
            type="button"
            className="min-h-touch w-full rounded-md bg-slate-700 text-sm"
            onClick={() => {
              saveCompanyProfile(profile)
              setShowProfile(false)
              setMessage(uk.exportProfileSaved)
            }}
          >
            {uk.commonSave}
          </button>
        </div>
      ) : null}

      {busy ? <p className="text-sm text-slate-400">{uk.exportWorking}</p> : null}
      {message ? <p className="text-sm text-sky-200">{message}</p> : null}
    </section>
  )
}
