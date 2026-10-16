import type { Order } from '@/data'
import { summarizeRoom } from '@/features/room/roomSummary'
import { buildOrderPdf } from './pdfExport'
import { downloadBlob, roomToPngBlob } from './pngExport'
import { downloadTextFile, orderToJson, safeFilename } from './jsonExport'
import { loadCompanyProfile } from './companyProfile'
import { uk } from '@/i18n/uk'

export interface ShareProgress {
  status: 'working' | 'done' | 'error'
  message: string
}

function orderBaseName(order: Order): string {
  return safeFilename(order.client.name || order.id.slice(0, 8))
}

export async function exportOrderJson(order: Order): Promise<void> {
  downloadTextFile(
    `zamir-${orderBaseName(order)}.json`,
    orderToJson(order),
    'application/json;charset=utf-8',
  )
}

export async function exportOrderPdf(order: Order): Promise<Blob> {
  return buildOrderPdf(order, loadCompanyProfile())
}

export async function exportRoomPngs(order: Order): Promise<File[]> {
  const files: File[] = []
  for (const room of order.rooms) {
    const summary = summarizeRoom(room)
    if (!summary.success) continue
    const blob = await roomToPngBlob(summary.success)
    files.push(
      new File([blob], `zamir-${orderBaseName(order)}-${safeFilename(room.name)}.png`, {
        type: 'image/png',
      }),
    )
  }
  return files
}

/** One-tap send: PDF + JSON (+ PNG if few rooms), via Web Share or download fallback. */
export async function shareOrder(order: Order): Promise<ShareProgress> {
  try {
    const pdfBlob = await exportOrderPdf(order)
    const pdfFile = new File([pdfBlob], `zamir-${orderBaseName(order)}.pdf`, {
      type: 'application/pdf',
    })
    const jsonFile = new File([orderToJson(order)], `zamir-${orderBaseName(order)}.json`, {
      type: 'application/json',
    })
    const pngFiles = order.rooms.length <= 3 ? await exportRoomPngs(order) : []
    const files = [pdfFile, jsonFile, ...pngFiles]
    const title = `${uk.appTitle}: ${order.client.name || uk.orderUntitled}`
    const text = [
      order.client.name,
      order.client.phone,
      order.client.address,
      `${order.rooms.length} ${uk.ordersRoomsCount}`,
    ]
      .filter(Boolean)
      .join('\n')

    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare({ files }))

    if (canShareFiles) {
      await navigator.share({ title, text, files })
      return { status: 'done', message: uk.shareDone }
    }

    // Fallback: download artifacts
    downloadBlob(pdfFile.name, pdfBlob)
    downloadTextFile(jsonFile.name, orderToJson(order), 'application/json;charset=utf-8')
    for (const png of pngFiles) {
      downloadBlob(png.name, png)
    }
    return { status: 'done', message: uk.shareFallbackDownload }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { status: 'done', message: uk.shareCancelled }
    }
    return {
      status: 'error',
      message: error instanceof Error ? error.message : uk.shareError,
    }
  }
}

export async function downloadOrderPdf(order: Order): Promise<void> {
  const blob = await exportOrderPdf(order)
  downloadBlob(`zamir-${orderBaseName(order)}.pdf`, blob)
}

export async function downloadRoomPngs(order: Order): Promise<number> {
  const files = await exportRoomPngs(order)
  for (const file of files) {
    downloadBlob(file.name, file)
  }
  return files.length
}
