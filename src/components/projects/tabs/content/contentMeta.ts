import type { ContentItem, ContentType, ContentStatus, ContentPlatform } from '@/types'

/* ── Labels ─────────────────────────────────────────────── */
export const TYPE_LABEL: Record<ContentType, string> = {
  post: 'منشور', design: 'تصميم', video: 'فيديو', story: 'ستوري',
  reel: 'ريلز', article: 'مقال', other: 'أخرى',
}
export const PLATFORM_LABEL: Record<ContentPlatform, string> = {
  twitter: 'تويتر', instagram: 'انستقرام', linkedin: 'لينكدإن',
  tiktok: 'تيك توك', youtube: 'يوتيوب', snapchat: 'سناب شات',
  facebook: 'فيسبوك', other: 'أخرى',
}

export const STATUS_LABEL: Record<ContentStatus, string> = {
  idea: 'فكرة', draft: 'مسودة', design: 'تصميم',
  review: 'مراجعة', approved: 'معتمد', delivered: 'مُسلَّم', published: 'منشور',
}
export const STATUS_ORDER: ContentStatus[] = ['idea', 'draft', 'design', 'review', 'approved', 'delivered', 'published']
export const STATUS_VAR: Record<ContentStatus, string> = {
  idea: 'var(--fg-3)',
  draft: 'var(--warning-500)',
  design: 'oklch(0.65 0.18 280)',
  review: 'oklch(0.62 0.17 215)',
  approved: 'var(--success-500)',
  delivered: 'oklch(0.58 0.18 255)',
  published: 'var(--iris-500)',
}

/** Statuses that count as "fulfilled" against a monthly contract quota. */
export const DONE_STATUSES: ContentStatus[] = ['delivered', 'published']

/** Common social/design content sizes (the value is shown on cards & export). */
export const CONTENT_SIZES: { value: string; label: string }[] = [
  { value: '1080×1080', label: 'مربع 1:1 — 1080×1080' },
  { value: '1080×1350', label: 'بورتريه 4:5 — 1080×1350' },
  { value: '1080×1920', label: 'ستوري / ريلز 9:16 — 1080×1920' },
  { value: '1920×1080', label: 'أفقي 16:9 — 1920×1080' },
  { value: '1600×900', label: 'تويتر 16:9 — 1600×900' },
  { value: '1200×630', label: 'لينكدإن / فيسبوك — 1200×630' },
]

export function nextStatus(s: ContentStatus): ContentStatus | null {
  const i = STATUS_ORDER.indexOf(s)
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null
}
export function prevStatus(s: ContentStatus): ContentStatus | null {
  const i = STATUS_ORDER.indexOf(s)
  return i > 0 ? STATUS_ORDER[i - 1] : null
}

/* ── Client colours ─────────────────────────────────────── */
export const CLIENT_COLORS = [
  'var(--iris-500)',
  'var(--warning-500)',
  'var(--success-500)',
  'oklch(0.66 0.17 200)',
  'oklch(0.66 0.18 330)',
  'oklch(0.66 0.16 150)',
  'oklch(0.64 0.18 30)',
]
export function buildClientColorMap(ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id, i) => [id, CLIENT_COLORS[i % CLIENT_COLORS.length]]))
}

/* ── Date helpers (UTC-aligned with stored yyyy-mm-dd ISO) ─ */
const AR_LATN = 'ar-u-ca-gregory-nu-latn'

function pad2(n: number) { return String(n).padStart(2, '0') }

/** Calendar day-key (yyyy-mm-dd) of a stored ISO date. */
export function dayKey(iso: string | undefined): string | null {
  if (!iso) return null
  return iso.slice(0, 10)
}

/** The schedule date of an item: publish date preferred, else due date. */
export function scheduledKey(item: ContentItem): string | null {
  return dayKey(item.publishDate) ?? dayKey(item.dueDate)
}

/** Convert a yyyy-mm-dd key to a storable ISO string. */
export function keyToISO(key: string): string {
  return new Date(key).toISOString()
}

/** yyyy-mm-dd of a Date using its UTC parts. */
export function dateToKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Local today's key (for the "today" highlight). */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Does a day-key fall inside the given year/month (0-indexed month)? */
export function keyInMonth(key: string | null, year: number, month: number): boolean {
  if (!key) return false
  return key.startsWith(`${year}-${pad2(month + 1)}`)
}

/** "يونيو 2026" — long month + numeric year, Western numerals. */
export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(AR_LATN, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month, 1)))
}

/** Short weekday headers, week starting Sunday. */
export const WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

/** A grid of weeks (each 7 Dates, UTC) covering the month, week starts Sunday. */
export function monthMatrix(year: number, month: number): Date[][] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay() // 0=Sun..6=Sat
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7)
  const start = new Date(Date.UTC(year, month, 1 - firstWeekday))
  const out: Date[][] = []
  const cur = new Date(start)
  for (let w = 0; w < weeks; w++) {
    const row: Date[] = []
    for (let d = 0; d < 7; d++) {
      row.push(new Date(cur))
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    out.push(row)
  }
  return out
}

export function fmtNum(n: number) { return n.toLocaleString('en-US') }
