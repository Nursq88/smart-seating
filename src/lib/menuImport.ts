import { useSyncExternalStore } from 'react'
import { addItems, type MenuItem } from './orders'

/**
 * Reads the dishes and prices out of the menu the restaurant uploaded, entirely in the browser:
 * a PDF gives up its text directly, photos (and scanned PDFs) go through OCR.
 * The file itself is only read, never stored or shown to guests: what remains is the text and prices.
 * Recognition is never perfect, so the result lands in an editable list for the owner to check.
 */

/** A menu file handed over for reading. */
export interface MenuSource {
  kind: 'image' | 'pdf'
  blob: Blob
}

export interface FoundItem {
  name: string
  price: number
  category: string
}

// --- Parsing ------------------------------------------------------------------

/** A price: 3–6 digits, optionally grouped ("4 200"), optionally with a currency, and not a weight or volume. */
const PRICE =
  /(?<![\d.,])(\d{1,3}(?:[   ]\d{3})+|\d{3,6})(?:[.,](?:00|-))?\s*(?:₸|тг\.?|тенге|тнг|kzt|[тТT](?![\p{L}]))?(?!\s*(?:гр?|мл|л|шт|кг|см|g|ml|kg|l|cm|ккал|kcal)(?![\p{L}]))(?![\d\p{L}])/giu

const letters = (text: string) => (text.match(/\p{L}/gu) ?? []).length

/** Strips bullets, numbering and the dotted leaders that run to the price. */
function tidy(text: string) {
  return text
    .replace(/^[\s•*·\-–—|]+|^\d{1,2}[.)]\s+/gu, '')
    .replace(/[\s.…_·\-–—|:]+$/gu, '')
    .replace(/\s*[.…_·]{3,}\s*/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Letter-spaced headings come through as "С А Л А Т Ы": close them up, keeping wider gaps as word breaks. */
export function despace(text: string) {
  return text
    .split(/\s{2,}/)
    .map((chunk) => (/^(?:[\p{L}«»"] ){2,}[\p{L}«»"]$/u.test(chunk.trim()) ? chunk.replace(/ /g, '') : chunk))
    .join(' ')
}

/** "САЛАТЫ" reads better as "Салаты". */
function heading(text: string) {
  const clean = tidy(text)
  return clean === clean.toUpperCase() ? clean.charAt(0) + clean.slice(1).toLowerCase() : clean
}

/**
 * Turns menu text into items.
 * - Every price on a line closes an item whose name is the text before it, so two-column menus work.
 * - A price alone on a line belongs to the name on the line above.
 * - A short line without a price, followed by priced lines, is taken as the section heading.
 */
export function parseMenu(text: string, fallbackCategory = ''): FoundItem[] {
  const out: FoundItem[] = []
  let category = fallbackCategory
  let pending = '' // last line that had no price: a heading, or a name waiting for its price
  let earlier = '' // the line without a price before that one

  for (const raw of text.split(/\r?\n/)) {
    const line = despace(raw.trim())
    if (!line) continue

    let last = 0
    let found = false
    for (const match of line.matchAll(PRICE)) {
      let price = Number(match[1].replace(/\D/g, ''))
      // OCR tends to read the tenge sign as a 7 stuck to the amount: 3 200 ₸ becomes 32007.
      // Prices are round numbers, so a trailing 7 after a zero is the sign, not a digit.
      if (price % 100 === 7 && price > 1000) price = Math.floor(price / 10)
      const before = tidy(line.slice(last, match.index))
      last = match.index + match[0].length
      if (price < 100 || price > 500000) continue
      let name = before
      if (letters(name) < 2) {
        // Price on its own: the name was on the previous line.
        if (found || letters(pending) < 2) continue
        name = tidy(pending)
        if (looksLikeHeading(earlier)) category = heading(earlier)
      } else if (!found && pending && looksLikeHeading(pending)) {
        category = heading(pending)
      }
      found = true
      pending = earlier = ''
      if (name.length <= 90) out.push({ name, price, category })
    }
    if (!found) {
      earlier = pending
      pending = line
    }
  }
  return out
}

function looksLikeHeading(text: string) {
  const clean = tidy(text)
  return letters(clean) >= 3 && clean.length <= 36 && !/[,;\d]/.test(clean) && clean.split(' ').length <= 4
}

// --- Reading files ------------------------------------------------------------

type Progress = (fraction: number) => void

/**
 * Gets a menu photo ready for OCR: enlarges small images and erases dotted leaders.
 * The rows of dots between a dish and its price are what the recogniser gets wrong most:
 * left in, they come out as stray digits glued to the price.
 */
async function prepare(source: Blob | HTMLCanvasElement) {
  const image = source instanceof Blob ? await createImageBitmap(source) : source
  const scale = Math.max(1, Math.min(2.5, 2400 / image.width))
  const canvas = document.createElement('canvas')
  const w = (canvas.width = Math.round(image.width * scale))
  const h = (canvas.height = Math.round(image.height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, w, h)
  const pixels = ctx.getImageData(0, 0, w, h)
  const data = pixels.data

  // Ink is whatever is clearly darker (or, on dark menus, lighter) than the page.
  const grey = new Uint8Array(w * h)
  let sum = 0
  for (let i = 0; i < grey.length; i++) sum += grey[i] = (data[i * 4] * 3 + data[i * 4 + 1] * 6 + data[i * 4 + 2]) / 10
  const mean = sum / grey.length
  const darkInk = mean > 110
  const ink = (i: number) => (darkInk ? grey[i] < mean - 45 : grey[i] > mean + 45)

  // Connected blobs of ink, with their bounding boxes.
  const seen = new Uint8Array(w * h)
  const blobs: { x0: number; y0: number; x1: number; y1: number }[] = []
  const stack: number[] = []
  for (let start = 0; start < grey.length; start++) {
    if (seen[start] || !ink(start)) continue
    const box = { x0: w, y0: h, x1: 0, y1: 0 }
    seen[start] = 1
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      const x = i % w
      const y = (i - x) / w
      if (x < box.x0) box.x0 = x
      if (x > box.x1) box.x1 = x
      if (y < box.y0) box.y0 = y
      if (y > box.y1) box.y1 = y
      for (const n of [i - 1, i + 1, i - w, i + w]) {
        if (n < 0 || n >= grey.length || seen[n] || !ink(n)) continue
        if ((n === i - 1 && x === 0) || (n === i + 1 && x === w - 1)) continue
        seen[n] = 1
        stack.push(n)
      }
    }
    blobs.push(box)
  }

  // Letter height: the typical height of blobs that are big enough to be letters.
  const heights = blobs.map((b) => b.y1 - b.y0 + 1).filter((x) => x > 8).sort((a, b) => a - b)
  const letter = heights[Math.floor(heights.length / 2)] ?? 20
  const dots = blobs
    .filter((b) => b.x1 - b.x0 < letter * 0.34 && b.y1 - b.y0 < letter * 0.34)
    .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)

  // A leader is four or more dots in a row on one line. Single dots (й, ё, full stops) are left alone.
  const page = darkInk ? 255 : 0
  const used = new Set<number>()
  for (let i = 0; i < dots.length; i++) {
    if (used.has(i)) continue
    const row = [i]
    for (let j = 0; j < dots.length; j++) {
      if (j !== i && !used.has(j) && Math.abs(dots[j].y0 - dots[i].y0) < letter * 0.3) row.push(j)
    }
    row.sort((a, b) => dots[a].x0 - dots[b].x0)
    let run = [row[0]]
    const flush = () => {
      if (run.length >= 4) {
        for (const k of run) {
          used.add(k)
          const d = dots[k]
          for (let y = d.y0 - 1; y <= d.y1 + 1; y++)
            for (let x = d.x0 - 1; x <= d.x1 + 1; x++) {
              if (x < 0 || y < 0 || x >= w || y >= h) continue
              const o = (y * w + x) * 4
              data[o] = data[o + 1] = data[o + 2] = page
            }
        }
      }
    }
    for (let k = 1; k < row.length; k++) {
      if (dots[row[k]].x0 - dots[row[k - 1]].x1 < letter * 1.5) run.push(row[k])
      else {
        flush()
        run = [row[k]]
      }
    }
    flush()
    row.forEach((k) => used.add(k))
  }

  // Plain black on white is what the recogniser is best at.
  for (let i = 0; i < grey.length; i++) {
    const o = i * 4
    const erased = data[o] === page && data[o + 1] === page && data[o + 2] === page
    const v = !erased && ink(i) ? 0 : 255
    data[o] = data[o + 1] = data[o + 2] = v
    data[o + 3] = 255
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas
}
type Recognise = (image: Blob | HTMLCanvasElement, onProgress: Progress) => Promise<string>

/** One OCR engine per import run. Its language data (Russian, Kazakh, English) is downloaded on first use. */
async function startOcr(): Promise<{ recognise: Recognise; stop: () => Promise<unknown> }> {
  const { createWorker } = await import('tesseract.js')
  let report: Progress = () => {}
  const worker = await createWorker(['rus', 'kaz', 'eng'], 1, {
    logger: (m) => m.status === 'recognizing text' && report(m.progress),
  })
  // Treat the page as one block of lines, which keeps each dish and its price together.
  await worker.setParameters({ tessedit_pageseg_mode: '6' as never, preserve_interword_spaces: '1' })
  return {
    recognise: async (image, onProgress) => {
      report = onProgress
      const { data } = await worker.recognize(await prepare(image))
      return data.text
    },
    stop: () => worker.terminate(),
  }
}

async function readPdf(blob: Blob, ocr: () => Promise<Recognise>, onProgress: Progress) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise
  let text = ''
  for (let n = 1; n <= doc.numPages; n++) {
    const done = (part: number) => onProgress((n - 1 + part) / doc.numPages)
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    // Rebuild lines: pieces that share a baseline, left to right.
    const rows = new Map<number, { x: number; end: number; size: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const y = Math.round(item.transform[5] / 3)
      const x = item.transform[4]
      rows.set(y, [...(rows.get(y) ?? []), { x, end: x + item.width, size: item.height || 10, str: item.str }])
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => {
        parts.sort((a, b) => a.x - b.x)
        // Letter-spaced headings arrive one letter at a time: only a real gap is a space.
        let line = ''
        parts.forEach((part, i) => {
          if (i > 0 && part.x - parts[i - 1].end > part.size * 0.3) line += ' '
          line += despace(part.str)
        })
        return line.replace(/\s+/g, ' ').trim()
      })
      .filter(Boolean)
    if (letters(lines.join('')) > 20) {
      text += lines.join('\n') + '\n'
    } else {
      // A scan: no text inside, so read the rendered page instead.
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvas, viewport }).promise
      text += (await (await ocr())(canvas, done)) + '\n'
    }
    done(1)
  }
  return text
}

// --- Import run, observable by the UI -------------------------------------------

export interface ImportState {
  running: boolean
  /** 0–1 across all files */
  progress: number
  /** Result of the last run; null before the first one */
  found: number | null
  failed: boolean
}

let state: ImportState = { running: false, progress: 0, found: null, failed: false }
const listeners = new Set<() => void>()
const update = (patch: Partial<ImportState>) => {
  state = { ...state, ...patch }
  listeners.forEach((fn) => fn())
}

export function useImportState() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    () => state,
  )
}

/**
 * Reads the given menu files and adds what it finds to the list of items for ordering,
 * skipping names that are already there.
 */
export async function importFromMenu(pages: MenuSource[]) {
  if (state.running || pages.length === 0) return
  update({ running: true, progress: 0, found: null, failed: false })
  let engine: Awaited<ReturnType<typeof startOcr>> | undefined
  const ocr = async () => (engine ??= await startOcr()).recognise

  try {
    const found: FoundItem[] = []
    for (const [i, page] of pages.entries()) {
      const onProgress: Progress = (part) => update({ progress: (i + part) / pages.length })
      const text = page.kind === 'pdf' ? await readPdf(page.blob, ocr, onProgress) : await (await ocr())(page.blob, onProgress)
      // Sections carry over from one page to the next.
      found.push(...parseMenu(text, found[found.length - 1]?.category))
      onProgress(1)
    }
    const items = found.map(
      (item, i): MenuItem => ({ id: `item-${Date.now().toString(36)}-${i}`, name: item.name, price: item.price, category: item.category }),
    )
    const added = addItems(items)
    update({ running: false, progress: 1, found: added })
  } catch {
    update({ running: false, failed: true })
  } finally {
    await engine?.stop()
  }
}

// Menu files kept by an earlier version are no longer used or shown.
try {
  indexedDB.deleteDatabase('sse')
} catch {
  // storage unavailable
}
