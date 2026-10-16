import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import type { Order, Room } from '@/data'
import { summarizeRoom } from '@/features/room/roomSummary'
import { formatCm } from '@/features/room/labels'
import { buildRoomSvgMarkup, svgMarkupToElement } from './buildRoomSvg'
import { loadCompanyProfile, type CompanyProfile } from './companyProfile'
import { ensurePdfFont } from './pdfFont'
import { uk } from '@/i18n/uk'

function statusText(room: Room): string {
  const summary = summarizeRoom(room)
  if (summary.errorStatus === 'ok') return uk.roomStatusOk
  if (summary.errorStatus === 'warn') return uk.roomStatusWarn
  if (summary.errorStatus === 'fail') return uk.roomStatusFail
  if (summary.errorStatus === 'error') return uk.roomSummaryError
  return uk.roomSummaryIncomplete
}

export async function buildOrderPdf(
  order: Order,
  profile: CompanyProfile = loadCompanyProfile(),
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await ensurePdfFont(doc)

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = margin

  const ensureSpace = (need: number) => {
    if (y + need > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
      doc.setFont('NotoSans', 'normal')
    }
  }

  const text = (value: string, x: number, yy: number, options?: { align?: 'left' | 'center' | 'right' }) => {
    doc.text(value, x, yy, options)
  }

  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(16)
  text(profile.companyName || uk.appTitle, margin, y)
  y += 7

  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
  if (profile.surveyorName) {
    text(`${uk.pdfSurveyor}: ${profile.surveyorName}`, margin, y)
    y += 5
  }
  if (profile.phone) {
    text(`${uk.pdfPhone}: ${profile.phone}`, margin, y)
    y += 5
  }
  text(`${uk.pdfDate}: ${new Date(order.updatedAt).toLocaleString('uk-UA')}`, margin, y)
  y += 8

  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(12)
  text(uk.pdfClient, margin, y)
  y += 6
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
  text(`${uk.orderClientName}: ${order.client.name || '—'}`, margin, y)
  y += 5
  text(`${uk.orderClientPhone}: ${order.client.phone || '—'}`, margin, y)
  y += 5
  text(`${uk.orderClientAddress}: ${order.client.address || '—'}`, margin, y)
  y += 5
  if (order.note) {
    const noteLines = doc.splitTextToSize(`${uk.orderNote}: ${order.note}`, pageW - margin * 2)
    text(noteLines, margin, y)
    y += noteLines.length * 5 + 2
  }
  y += 4

  let totalArea = 0
  let roomsOk = 0

  for (const room of order.rooms) {
    ensureSpace(40)
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(12)
    text(room.name, margin, y)
    y += 6

    const summary = summarizeRoom(room)
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(10)
    text(`${uk.roomErrorStatus}: ${statusText(room)}`, margin, y)
    y += 5

    if (summary.success) {
      totalArea += summary.success.areaM2
      if (summary.errorStatus === 'ok') roomsOk += 1

      ensureSpace(70)
      const svgMarkup = buildRoomSvgMarkup(summary.success, 640, 400)
      const svgEl = svgMarkupToElement(svgMarkup)
      svgEl.style.position = 'fixed'
      svgEl.style.left = '-10000px'
      document.body.appendChild(svgEl)
      try {
        await svg2pdf(svgEl, doc, {
          x: margin,
          y,
          width: pageW - margin * 2,
          height: 55,
        })
      } finally {
        svgEl.remove()
      }
      y += 58
      doc.setFont('NotoSans', 'normal')

      text(
        `${uk.roomArea}: ${summary.success.areaM2.toFixed(2)} ${uk.unitM2}  |  ${uk.roomPerimeter}: ${summary.success.perimeterM.toFixed(2)} ${uk.unitM}`,
        margin,
        y,
      )
      y += 6

      const angleLine = summary.success.vertices
        .map((v) => `${v.label}: ${v.interiorAngleDeg.toFixed(1)}${uk.unitDeg}`)
        .join('  ')
      const angleLines = doc.splitTextToSize(`${uk.roomAngles}: ${angleLine}`, pageW - margin * 2)
      ensureSpace(angleLines.length * 5 + 8)
      text(angleLines, margin, y)
      y += angleLines.length * 5 + 2

      if (summary.success.message) {
        const msg = doc.splitTextToSize(summary.success.message, pageW - margin * 2)
        text(msg, margin, y)
        y += msg.length * 5
      }
    } else if (summary.result && !summary.result.ok) {
      const msg = doc.splitTextToSize(summary.result.message, pageW - margin * 2)
      ensureSpace(msg.length * 5 + 6)
      text(msg, margin, y)
      y += msg.length * 5
    } else {
      text(uk.roomSummaryIncomplete, margin, y)
      y += 5
    }

    ensureSpace(10 + room.sides.length * 5)
    doc.setFont('NotoSans', 'bold')
    text(uk.pdfMeasurements, margin, y)
    y += 5
    doc.setFont('NotoSans', 'normal')
    for (const side of room.sides) {
      ensureSpace(5)
      text(
        `${side.from}-${side.to}: ${side.length > 0 ? formatCm(side.length) : '—'} ${uk.roomLengthCm}`,
        margin,
        y,
      )
      y += 4.5
    }
    for (const d of room.diagonals) {
      ensureSpace(5)
      const kind = d.isControl ? uk.roomControl : uk.roomConstruction
      text(`${d.from}-${d.to}: ${formatCm(d.length)} ${uk.roomLengthCm} (${kind})`, margin, y)
      y += 4.5
    }
    y += 6
  }

  ensureSpace(20)
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(12)
  text(uk.pdfSummary, margin, y)
  y += 6
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
  text(`${uk.pdfRoomsCount}: ${order.rooms.length}`, margin, y)
  y += 5
  text(`${uk.pdfTotalArea}: ${totalArea.toFixed(2)} ${uk.unitM2}`, margin, y)
  y += 5
  text(`${uk.pdfRoomsOk}: ${roomsOk}/${order.rooms.length}`, margin, y)

  return doc.output('blob')
}
