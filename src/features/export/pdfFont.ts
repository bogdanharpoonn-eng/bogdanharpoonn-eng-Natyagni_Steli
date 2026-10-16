import type { jsPDF } from 'jspdf'

let cachedBase64: string | null = null
let loading: Promise<string> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function loadFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64
  if (!loading) {
    loading = (async () => {
      const res = await fetch('/fonts/NotoSans-Regular.ttf')
      if (!res.ok) throw new Error('Не вдалося завантажити шрифт для PDF')
      cachedBase64 = arrayBufferToBase64(await res.arrayBuffer())
      return cachedBase64
    })()
  }
  return loading
}

/** Load Cyrillic-capable Noto Sans into jsPDF VFS (cached). */
export async function ensurePdfFont(doc: jsPDF): Promise<void> {
  const base64 = await loadFontBase64()
  doc.addFileToVFS('NotoSans-Regular.ttf', base64)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold')
  doc.setFont('NotoSans', 'normal')
}
