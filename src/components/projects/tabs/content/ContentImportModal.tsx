'use client'
import { useState, useRef, useCallback } from 'react'
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'
import type { ContentItem, ContentType, ContentStatus, ContentPlatform, ContentSource } from '@/types'
import { TYPE_LABEL, STATUS_LABEL, PLATFORM_LABEL, SOURCE_LABEL } from './contentMeta'

const TYPE_VALS: ContentType[] = ['post', 'design', 'video', 'story', 'reel', 'article', 'other']
const STATUS_VALS: ContentStatus[] = ['idea', 'draft', 'design', 'review', 'approved', 'delivered', 'published']
const PLATFORM_VALS: ContentPlatform[] = ['instagram', 'twitter', 'tiktok', 'snapchat', 'linkedin', 'youtube', 'facebook', 'other']
const SOURCE_VALS: ContentSource[] = ['internal', 'client-request']

/* ── Column mapping ──────────────────────────────────── */
const HEADERS = [
  { key: 'title',       ar: 'العنوان',          required: true },
  { key: 'type',        ar: 'النوع',             required: true },
  { key: 'status',      ar: 'الحالة',            required: false },
  { key: 'platform',    ar: 'المنصة',            required: false },
  { key: 'source',      ar: 'المصدر',            required: false },
  { key: 'publishDate', ar: 'تاريخ النشر',       required: false },
  { key: 'dueDate',     ar: 'تاريخ الاستحقاق',   required: false },
  { key: 'body',        ar: 'النص / الملاحظات',  required: false },
  { key: 'dimensions',  ar: 'المقاس',            required: false },
] as const

type RowKey = typeof HEADERS[number]['key']

type ParsedRow = {
  _rowNum: number
  title: string
  type: ContentType
  status: ContentStatus
  platform?: ContentPlatform
  source?: ContentSource
  publishDate?: string
  dueDate?: string
  body?: string
  dimensions?: string
  _errors: string[]
}

/* ── Excel value helpers ─────────────────────────────── */
function matchEnum<T extends string>(val: unknown, allowed: T[], labels: Record<T, string>): T | undefined {
  if (!val) return undefined
  const s = String(val).trim().toLowerCase()
  const direct = allowed.find((a) => a === s)
  if (direct) return direct
  const byLabel = allowed.find((a) => labels[a].toLowerCase() === s)
  return byLabel
}

function parseDate(val: unknown): string | undefined {
  if (!val) return undefined
  const s = String(val).trim()
  // Accept yyyy-mm-dd or dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  // Excel serial date number
  const n = Number(val)
  if (!isNaN(n) && n > 40000 && n < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000)
    return d.toISOString().slice(0, 10)
  }
  return undefined
}

/* ── Template download (pure JS, no DOM) ─────────────── */
async function downloadTemplate() {
  const XLSX = await import('xlsx')

  /* Lists sheet */
  const listsData: string[][] = [
    ['النوع (Type)', 'الحالة (Status)', 'المنصة (Platform)', 'المصدر (Source)'],
    ...Array.from({ length: Math.max(TYPE_VALS.length, STATUS_VALS.length, PLATFORM_VALS.length, SOURCE_VALS.length) }, (_, i) => [
      TYPE_VALS[i] ? `${TYPE_VALS[i]} — ${TYPE_LABEL[TYPE_VALS[i]]}` : '',
      STATUS_VALS[i] ? `${STATUS_VALS[i]} — ${STATUS_LABEL[STATUS_VALS[i]]}` : '',
      PLATFORM_VALS[i] ? `${PLATFORM_VALS[i]} — ${PLATFORM_LABEL[PLATFORM_VALS[i]]}` : '',
      SOURCE_VALS[i] ? `${SOURCE_VALS[i]} — ${SOURCE_LABEL[SOURCE_VALS[i]]}` : '',
    ]),
  ]
  const listsSheet = XLSX.utils.aoa_to_sheet(listsData)
  listsSheet['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 26 }, { wch: 24 }]

  /* Main sheet sample rows */
  const sampleRows = [
    HEADERS.map((h) => h.ar),
    ['منشور تعريفي بالشركة', 'post', 'idea', 'instagram', 'internal', '2026-06-05', '', 'محتوى ترحيبي ببداية الشهر', '1080×1080'],
    ['تصميم عرض المنتج الجديد', 'design', 'draft', 'instagram', 'client-request', '2026-06-12', '2026-06-10', '', '1080×1350'],
    ['ريلز خلف الكواليس', 'reel', 'idea', 'tiktok', 'internal', '2026-06-20', '', '', '1080×1920'],
  ]
  const mainSheet = XLSX.utils.aoa_to_sheet(sampleRows)

  /* Column widths */
  mainSheet['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 35 }, { wch: 16 },
  ]

  /* Data validation — lists of allowed values for type/status/platform/source */
  const sqref = (col: string, start: number, end: number) => `${col}${start}:${col}${end}`
  const listDV = (values: string[]) => ({
    type: 'list' as const,
    formula1: `"${values.join(',')}"`,
    showDropDown: false,
    sqref: '',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: 'قيمة غير صالحة',
    error: `القيم المسموح بها: ${values.join(', ')}`,
  })

  mainSheet['!dataValidation'] = [
    { ...listDV(TYPE_VALS),     sqref: sqref('B', 2, 1000) },
    { ...listDV(STATUS_VALS),   sqref: sqref('C', 2, 1000) },
    { ...listDV(PLATFORM_VALS), sqref: sqref('D', 2, 1000) },
    { ...listDV(SOURCE_VALS),   sqref: sqref('E', 2, 1000) },
  ]

  /* Header row style — bold */
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: '4F46E5' }, patternType: 'solid' as const }, fontColor: { rgb: 'FFFFFF' } }
  HEADERS.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci })
    if (mainSheet[addr]) mainSheet[addr].s = headerStyle
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, mainSheet, 'محتوى الشهر')
  XLSX.utils.book_append_sheet(wb, listsSheet, 'القوائم')

  XLSX.writeFile(wb, 'قالب-استيراد-المحتوى.xlsx')
}

/* ── Row parser ──────────────────────────────────────── */
function parseRow(raw: Record<string, unknown>, rowNum: number): ParsedRow {
  const get = (key: RowKey): unknown => {
    const header = HEADERS.find((h) => h.key === key)!
    return raw[header.ar] ?? raw[key] ?? undefined
  }

  const errors: string[] = []

  const title = String(get('title') ?? '').trim()
  if (!title) errors.push('العنوان مطلوب')

  const typeRaw = get('type')
  const type = matchEnum(typeRaw, TYPE_VALS, TYPE_LABEL) ?? 'post'

  const statusRaw = get('status')
  const status = matchEnum(statusRaw, STATUS_VALS, STATUS_LABEL) ?? 'idea'

  const platform = matchEnum(get('platform'), PLATFORM_VALS, PLATFORM_LABEL)
  const source = matchEnum(get('source'), SOURCE_VALS, SOURCE_LABEL)
  const publishDate = parseDate(get('publishDate'))
  const dueDate = parseDate(get('dueDate'))
  const body = String(get('body') ?? '').trim() || undefined
  const dimensions = String(get('dimensions') ?? '').trim() || undefined

  return { _rowNum: rowNum, title, type, status, platform, source, publishDate, dueDate, body, dimensions, _errors: errors }
}

/* ── Component ───────────────────────────────────────── */
interface Props {
  projectId: string
  clientId: string
  onCreate: (item: Omit<ContentItem, 'id' | 'order' | 'createdAt'>) => void
  onClose: () => void
}

export default function ContentImportModal({ projectId, clientId, onCreate, onClose }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseFile = useCallback(async (file: File) => {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' }) as Record<string, unknown>[]
    const parsed = json.map((row, i) => parseRow(row, i + 2))
    setRows(parsed)
    setFileName(file.name)
    setDone(false)
  }, [])

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return
    parseFile(file)
  }, [parseFile])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = () => {
    const valid = rows.filter((r) => r._errors.length === 0)
    if (valid.length === 0) return
    setImporting(true)
    valid.forEach((r) => {
      onCreate({
        projectId,
        clientId,
        title: r.title,
        type: r.type,
        status: r.status,
        platform: r.platform,
        source: r.source,
        publishDate: r.publishDate ? new Date(r.publishDate + 'T12:00:00Z').toISOString() : undefined,
        dueDate: r.dueDate ? new Date(r.dueDate + 'T12:00:00Z').toISOString() : undefined,
        body: r.body,
        dimensions: r.dimensions,
      })
    })
    setDone(true)
    setImporting(false)
  }

  const removeRow = (rowNum: number) => setRows((prev) => prev.filter((r) => r._rowNum !== rowNum))

  const validCount = rows.filter((r) => r._errors.length === 0).length
  const errorCount = rows.filter((r) => r._errors.length > 0).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl flex flex-col animate-fade-up"
        style={{
          background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={18} style={{ color: 'var(--iris-500)' }} />
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>استيراد محتوى الشهر</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ارفع ملف Excel لإنشاء قطع المحتوى دفعة واحدة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              <Download size={13} /> تنزيل القالب
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drop zone */}
        {rows.length === 0 && (
          <div className="p-5 flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-full rounded-xl flex flex-col items-center justify-center gap-3 py-12 px-6 cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${dragOver ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                background: dragOver ? 'color-mix(in oklch, var(--iris-500) 6%, transparent)' : 'var(--color-surface-muted)',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={28} style={{ color: dragOver ? 'var(--iris-500)' : 'var(--color-text-muted)' }} />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>اسحب ملف Excel هنا أو اضغط للاختيار</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>صيغ مدعومة: .xlsx, .xls, .csv</p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              نزّل القالب أعلاه — يحتوي على الترويسات والقوائم المنسدلة وصفوف نموذجية
            </p>
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && !done && (
          <>
            <div className="px-5 py-2.5 shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{fileName}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{rows.length} صف</span>
              {validCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--success-500)' }}>
                  <CheckCircle2 size={12} /> {validCount} صالح
                </span>
              )}
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--danger-500)' }}>
                  <AlertCircle size={12} /> {errorCount} بخطأ
                </span>
              )}
              <button
                onClick={() => { setRows([]); setFileName('') }}
                className="ms-auto text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                تغيير الملف
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['#', 'العنوان', 'النوع', 'الحالة', 'المنصة', 'المصدر', 'تاريخ النشر', ''].map((h) => (
                      <th key={h} style={{
                        textAlign: 'right', padding: '6px 8px', fontSize: 11, fontWeight: 600,
                        color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-surface-border)',
                        background: 'var(--color-surface-overlay)', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const hasError = r._errors.length > 0
                    return (
                      <tr
                        key={r._rowNum}
                        style={{
                          borderBottom: '1px solid var(--color-surface-border)',
                          background: hasError ? 'color-mix(in oklch, var(--danger-500) 6%, transparent)' : undefined,
                          opacity: hasError ? 0.8 : 1,
                        }}
                      >
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', fontSize: 11 }}>{r._rowNum}</td>
                        <td style={{ padding: '5px 8px', color: hasError ? 'var(--danger-500)' : 'var(--color-text-primary)', fontWeight: 500, maxWidth: 180 }}>
                          {r.title || <em style={{ color: 'var(--danger-500)' }}>مطلوب</em>}
                        </td>
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{TYPE_LABEL[r.type]}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{STATUS_LABEL[r.status]}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{r.platform ? PLATFORM_LABEL[r.platform] : '—'}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{r.source ? SOURCE_LABEL[r.source] : '—'}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{r.publishDate ?? '—'}</td>
                        <td style={{ padding: '5px 8px' }}>
                          {hasError ? (
                            <span className="text-xs" style={{ color: 'var(--danger-500)' }}>{r._errors.join('، ')}</span>
                          ) : (
                            <button
                              onClick={() => removeRow(r._rowNum)}
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5"
                              style={{ color: 'var(--color-text-muted)' }}
                              title="إزالة هذا الصف"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Done state */}
        {done && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
            <CheckCircle2 size={40} style={{ color: 'var(--success-500)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>تم استيراد {validCount} قطعة بنجاح</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>يمكنك الآن متابعة تحريرها من تبويب المحتوى</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          {done ? (
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-md text-sm font-semibold text-white"
              style={{ background: 'var(--iris-500)' }}
            >
              إغلاق
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-3 h-9 rounded-md text-xs font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
                إلغاء
              </button>
              {rows.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md text-xs font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--iris-500)' }}
                >
                  <Upload size={13} /> استيراد {validCount} قطعة
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
