'use client'
import { useState, useMemo, Fragment } from 'react'
import { X, Printer, ChevronDown } from 'lucide-react'
import type { Client, ContentItem } from '@/types'
import { TYPE_LABEL, PLATFORM_LABEL, STATUS_LABEL, STATUS_VAR, scheduledKey, keyInMonth, monthLabel, fmtDayMonth } from './contentMeta'
import { PlatformIcon, platformCellHtml } from './PlatformIcon'

interface Props {
  items: ContentItem[]
  clients: Client[]
  clientColorMap: Record<string, string>
  year: number
  month: number
  onClose: () => void
}

const PRINT_STATUS_COLOR: Record<string, string> = {
  idea: '#9ca3af', draft: '#f59e0b', design: '#a78bfa', review: '#60a5fa',
  approved: '#34d399', delivered: '#818cf8', published: '#6366f1',
}
const PRINT_STATUS_BG: Record<string, string> = {
  idea: '#f3f4f6', draft: '#fffbeb', design: '#ede9fe', review: '#eff6ff',
  approved: '#ecfdf5', delivered: '#eef2ff', published: '#eef2ff',
}

const WEEK_LABELS = ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث', 'الأسبوع الرابع', 'الأسبوع الخامس']

function weekOfMonth(key: string | null): number {
  if (!key) return 0
  return Math.ceil(Number(key.slice(8, 10)) / 7)
}
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

// ── Column definitions ────────────────────────────────────
type ColKey = 'type' | 'platform' | 'dimensions' | 'date' | 'status'
interface ColDef { key: ColKey; label: string; printWidth: string; center?: boolean }
const COL_DEFS: ColDef[] = [
  { key: 'type',       label: 'النوع',   printWidth: '38pt' },
  { key: 'platform',   label: 'المنصة',  printWidth: '62pt' },
  { key: 'dimensions', label: 'المقاس',  printWidth: '50pt', center: true },
  { key: 'date',       label: 'التاريخ', printWidth: '46pt' },
  { key: 'status',     label: 'الحالة',  printWidth: '58pt' },
]

export default function ContentExportModal({ items, clients, clientColorMap, year, month, onClose }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? '__all')
  const [includeBody, setIncludeBody] = useState(false)
  const [groupByWeek, setGroupByWeek] = useState(true)
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(() => new Set(COL_DEFS.map((c) => c.key)))

  const toggleCol = (key: ColKey) =>
    setVisibleCols((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const monthItems = useMemo(() => items
    .filter((i) => {
      if (selectedClientId !== '__all' && i.clientId !== selectedClientId) return false
      return keyInMonth(scheduledKey(i), year, month)
    })
    .sort((a, b) => {
      const ka = scheduledKey(a) ?? '', kb = scheduledKey(b) ?? ''
      return ka < kb ? -1 : ka > kb ? 1 : 0
    }), [items, selectedClientId, year, month])

  const unscheduled = useMemo(() => items.filter((i) => {
    if (selectedClientId !== '__all' && i.clientId !== selectedClientId) return false
    return !scheduledKey(i)
  }), [items, selectedClientId])

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=940,height=760')
    if (!win) return
    const clientName = selectedClient?.name ?? 'كل العملاء'
    const printedAt = new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })
    const quota = selectedClient?.deliverableCount ?? 0
    const done = monthItems.filter((i) => i.status === 'delivered' || i.status === 'published').length
    const pct = quota > 0 ? Math.round((done / quota) * 100) : null
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const monthNameOnly = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month, 1)))

    const activeCols = COL_DEFS.filter((c) => visibleCols.has(c.key))
    const NCOLS = 2 + activeCols.length

    const weekRange = (wk: number) => {
      const s = (wk - 1) * 7 + 1
      const e = Math.min(wk * 7, daysInMonth)
      return `${s} – ${e} ${monthNameOnly}`
    }

    const itemRow = (it: ContentItem, idx: number) => {
      const sKey = scheduledKey(it)
      const sc = PRINT_STATUS_COLOR[it.status] ?? '#6b7280'
      const sb = PRINT_STATUS_BG[it.status] ?? '#f3f4f6'
      const cells = activeCols.map((c) => {
        if (c.key === 'type')       return `<td>${TYPE_LABEL[it.type]}</td>`
        if (c.key === 'platform')   return `<td>${platformCellHtml(it.platform, 12, '#4b5563')}</td>`
        if (c.key === 'dimensions') return `<td class="center num">${it.dimensions ? esc(it.dimensions) : '—'}</td>`
        if (c.key === 'date')       return `<td class="date-cell">${fmtDayMonth(sKey)}</td>`
        if (c.key === 'status')     return `<td><span class="badge" style="color:${sc};background:${sb}"><span class="dot" style="background:${sc}"></span>${STATUS_LABEL[it.status]}</span></td>`
        return ''
      }).join('')
      const main = `<tr><td class="idx">${idx + 1}</td><td class="title">${esc(it.title)}</td>${cells}</tr>`
      const bodyRow = includeBody && it.body
        ? `<tr class="body-row"><td></td><td colspan="${NCOLS - 1}" class="body-text">${esc(it.body).replace(/\n/g, '<br/>')}</td></tr>`
        : ''
      return main + bodyRow
    }

    let rowsHtml = ''
    if (groupByWeek) {
      let lastWk = -1
      monthItems.forEach((it, idx) => {
        const wk = weekOfMonth(scheduledKey(it))
        if (wk !== lastWk) {
          lastWk = wk
          rowsHtml += `<tr class="week-row"><td colspan="${NCOLS}">
            <span class="wk-name">${WEEK_LABELS[wk - 1] ?? 'محتوى الشهر'}</span>
            <span class="wk-range">${weekRange(wk)}</span>
          </td></tr>`
        }
        rowsHtml += itemRow(it, idx)
      })
    } else {
      rowsHtml = monthItems.map((it, idx) => itemRow(it, idx)).join('')
    }

    const theadCells = [
      `<th class="center" style="width:18pt">#</th>`,
      `<th>العنوان</th>`,
      ...activeCols.map((c) => `<th${c.center ? ' class="center"' : ''} style="width:${c.printWidth}">${c.label}</th>`),
    ].join('')

    const unschHtml = unscheduled.length > 0 ? `
      <h3 class="section-title">بدون موعد نشر <span class="count">(${unscheduled.length})</span></h3>
      <table><tbody>${unscheduled.map((it) => {
        const sc = PRINT_STATUS_COLOR[it.status] ?? '#6b7280'
        const sb = PRINT_STATUS_BG[it.status] ?? '#f3f4f6'
        return `<tr>
          <td class="title">${esc(it.title)}</td>
          ${visibleCols.has('type') ? `<td>${TYPE_LABEL[it.type]}</td>` : ''}
          ${visibleCols.has('platform') ? `<td>${platformCellHtml(it.platform, 12, '#4b5563')}</td>` : ''}
          <td><span class="badge" style="color:${sc};background:${sb}"><span class="dot" style="background:${sc}"></span>${STATUS_LABEL[it.status]}</span></td>
        </tr>`
      }).join('')}</tbody></table>` : ''

    const pctBarHtml = pct !== null
      ? `<div style="height:3pt;background:#c7d2fe;border-radius:99pt;margin-top:5pt;overflow:hidden">
           <div style="height:100%;width:${pct}%;background:#6366f1;border-radius:99pt"></div>
         </div>` : ''

    const summaryHtml = `<div class="summary-row">
      <div class="si"><span class="sn">${monthItems.length}</span><span class="sl">قطعة مجدولة</span></div>
      ${quota > 0 ? `<div class="si"><span class="sn">${done}<span style="font-size:9pt;font-weight:400;color:#9ca3af"> / ${quota}</span></span><span class="sl">منجزة</span>${pctBarHtml}</div>` : ''}
      ${pct !== null ? `<div class="si"><span class="sn" style="color:${pct >= 100 ? '#34d399' : '#6366f1'}">${pct}%</span><span class="sl">من الهدف</span></div>` : ''}
      ${unscheduled.length > 0 ? `<div class="si"><span class="sn" style="color:#9ca3af">${unscheduled.length}</span><span class="sl">بدون موعد</span></div>` : ''}
    </div>`

    const initialsHtml = selectedClient?.logo
      ? `<img style="height:44pt;object-fit:contain;max-width:110pt" src="${selectedClient.logo}" alt="${esc(clientName)}" />`
      : `<div style="width:44pt;height:44pt;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:8pt;color:white;font-size:17pt;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${esc(clientName.charAt(0))}</div>`

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>جدول المحتوى — ${esc(clientName)} — ${monthLabel(year, month)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size:A4 portrait; margin:14mm 13mm 20mm 13mm; }
    @page :first { margin-top:11mm; }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;background:#fff;color:#1e1b4b;font-size:10pt;line-height:1.55}

    /* ─ Header ─ */
    .ph{display:flex;align-items:center;justify-content:space-between;padding-bottom:10pt;border-bottom:3pt solid #6366f1;margin-bottom:13pt}
    .ph-l{display:flex;align-items:center;gap:10pt}
    .ph-info .title{font-size:14pt;font-weight:700;color:#1e1b4b;line-height:1.2}
    .ph-info .sub{font-size:8pt;color:#6b7280;margin-top:2pt}
    .ph-r{text-align:left;font-size:8pt;color:#6b7280;line-height:1.85}
    .ph-month{font-size:13pt;font-weight:700;color:#6366f1}

    /* ─ Summary ─ */
    .summary-row{display:flex;gap:0;border-radius:8pt;margin-bottom:13pt;border:0.5pt solid #e0e7ff;overflow:hidden}
    .si{display:flex;flex-direction:column;align-items:center;flex:1;padding:8pt 6pt;background:linear-gradient(180deg,#f5f3ff,#eef2ff);border-left:0.5pt solid #e0e7ff}
    .si:last-child{border-left:none}
    .sn{font-size:16pt;font-weight:700;color:#6366f1;font-variant-numeric:tabular-nums;line-height:1}
    .sl{font-size:6.5pt;color:#6b7280;margin-top:2pt;text-align:center}

    /* ─ Table ─ */
    table{width:100%;border-collapse:collapse;margin-bottom:14pt}
    thead tr{background:linear-gradient(135deg,#4f46e5,#818cf8)}
    thead th{color:white;font-weight:600;font-size:8.5pt;padding:7pt 8pt;text-align:right;letter-spacing:.01em}
    thead th.center{text-align:center}
    tbody tr{border-bottom:.4pt solid #ede9fe}
    tbody tr:nth-child(odd):not(.week-row):not(.body-row){background:#fafbff}
    tbody tr:last-child{border-bottom:none}
    td{padding:5.5pt 8pt;font-size:9.5pt;vertical-align:middle}
    td.idx{font-size:7.5pt;color:#c4c9e0;text-align:center;font-variant-numeric:tabular-nums;width:18pt}
    td.num{font-variant-numeric:tabular-nums;direction:ltr;text-align:center}
    td.center{text-align:center}
    td.title{font-weight:500;max-width:180pt;word-break:break-word}
    td.date-cell{white-space:nowrap;font-size:8.5pt;color:#4b5563}

    /* ─ Week group ─ */
    tbody tr.week-row td{background:#eef0fb;padding:5pt 8pt;border-top:1pt solid #c7d2fe;border-bottom:.5pt solid #c7d2fe}
    .wk-name{font-weight:700;font-size:8.5pt;color:#4338ca}
    .wk-range{font-size:7.5pt;color:#818cf8;margin-right:8pt}

    /* ─ Body sub-row ─ */
    tbody tr.body-row td.body-text{color:#374151;font-size:8pt;line-height:1.65;padding:3pt 8pt 9pt;white-space:pre-wrap;background:#fdfcff;border-right:3pt solid #c7d2fe}
    tbody tr.body-row{border-bottom:.5pt solid #ede9fe}

    /* ─ Badge ─ */
    .badge{display:inline-flex;align-items:center;gap:4pt;padding:2pt 7pt;border-radius:99pt;font-size:8pt;font-weight:600;white-space:nowrap}
    .dot{display:inline-block;width:5pt;height:5pt;border-radius:50%;flex-shrink:0}

    /* ─ Unscheduled section ─ */
    .section-title{font-size:9.5pt;font-weight:700;color:#374151;margin:14pt 0 6pt;padding-bottom:4pt;border-bottom:1pt dashed #d1d5db}
    .section-title .count{font-weight:400;color:#9ca3af}

    /* ─ Approval block ─ */
    .approval{margin-top:22pt;padding:11pt 14pt;border:.5pt solid #d1d5db;border-radius:7pt}
    .approval-title{font-size:8.5pt;font-weight:700;color:#374151;margin-bottom:14pt}
    .approval-row{display:flex;gap:20pt}
    .approval-field{flex:1}
    .approval-line{height:.5pt;background:#9ca3af;margin-top:18pt;margin-bottom:3pt}
    .approval-label{font-size:7pt;color:#9ca3af}

    /* ─ Footer ─ */
    .page-footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;font-size:7pt;color:#9ca3af;padding:5pt 0;border-top:.4pt solid #e5e7eb;background:white}

    /* ─ Print btn ─ */
    .pbw{text-align:center;margin-top:24pt;padding-bottom:12pt}
    .pbtn{padding:9pt 32pt;font-size:11pt;cursor:pointer;border-radius:7pt;background:#6366f1;color:white;border:none;font-family:inherit;font-weight:600;letter-spacing:.02em}

    @media print{.pbw{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>

<div class="ph">
  <div class="ph-l">
    ${initialsHtml}
    <div class="ph-info">
      <div class="title">جدول المحتوى الشهري</div>
      <div class="sub">${esc(clientName)}</div>
    </div>
  </div>
  <div class="ph-r">
    <div class="ph-month">${monthLabel(year, month)}</div>
    ${quota > 0 ? `<div>المستهدف: <strong>${quota}</strong> قطعة / شهر</div>` : ''}
    <div>صدر بتاريخ: ${printedAt}</div>
  </div>
</div>

${summaryHtml}

${monthItems.length > 0 ? `
<table>
  <thead><tr>${theadCells}</tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>`
: `<p style="color:#9ca3af;text-align:center;padding:20pt;font-size:10pt">لا يوجد محتوى مجدول لهذا الشهر</p>`}

${unschHtml}

<div class="approval">
  <div class="approval-title">اعتماد العميل على خطة المحتوى</div>
  <div class="approval-row">
    <div class="approval-field"><div class="approval-line"></div><div class="approval-label">الاسم والتوقيع</div></div>
    <div class="approval-field"><div class="approval-line"></div><div class="approval-label">التاريخ</div></div>
    <div class="approval-field"><div class="approval-line"></div><div class="approval-label">الختم</div></div>
  </div>
</div>

<div class="page-footer">
  <span>محور — نظام إدارة المحتوى</span>
  <span>${esc(clientName)} · ${monthLabel(year, month)}</span>
</div>

<div class="pbw">
  <button class="pbtn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
</div>

</body></html>`)
    win.document.close()
    win.focus()
  }

  // ── Preview helpers ────────────────────────────────────
  const pcell: React.CSSProperties = { padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)' }

  const previewCell = (it: ContentItem, key: ColKey): React.ReactNode => {
    const statusColor = STATUS_VAR[it.status]
    const sKey = scheduledKey(it)
    if (key === 'type') return <td key="type" style={{ ...pcell, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{TYPE_LABEL[it.type]}</td>
    if (key === 'platform') return (
      <td key="platform" style={{ ...pcell, whiteSpace: 'nowrap' }}>
        {it.platform
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)' }}>
              <PlatformIcon platform={it.platform} size={12} />{PLATFORM_LABEL[it.platform]}
            </span>
          : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
      </td>
    )
    if (key === 'dimensions') return <td key="dimensions" style={{ ...pcell, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{it.dimensions ?? '—'}</td>
    if (key === 'date') return <td key="date" style={{ ...pcell, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmtDayMonth(sKey)}</td>
    if (key === 'status') return (
      <td key="status" style={pcell}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
          background: `color-mix(in oklch, ${statusColor} 15%, transparent)`, color: statusColor,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
          {STATUS_LABEL[it.status]}
        </span>
      </td>
    )
    return <td key={key} />
  }

  const previewCols = COL_DEFS.filter((c) => visibleCols.has(c.key))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-4xl flex flex-col animate-fade-up"
        style={{
          background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Printer size={18} style={{ color: 'var(--iris-500)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>تصدير جدول المحتوى</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>العميل</label>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-8 rounded-md ps-3 pe-7 text-sm outline-none appearance-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              >
                {clients.length > 1 && <option value="__all">كل العملاء</option>}
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute top-1/2 -translate-y-1/2 end-2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{monthLabel(year, month)}</span>
          <span className="axis-num text-sm ms-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {monthItems.length} قطعة
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 h-8 rounded-md text-sm font-semibold"
            style={{ background: 'var(--iris-500)', color: 'white' }}
          >
            <Printer size={14} /> طباعة / PDF
          </button>
        </div>

        {/* Options + column picker */}
        <div className="px-5 py-2.5 space-y-2 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>خيارات:</span>
            <Toggle active={includeBody} onClick={() => setIncludeBody((v) => !v)}>نص المنشور</Toggle>
            <Toggle active={groupByWeek} onClick={() => setGroupByWeek((v) => !v)}>تجميع أسبوعي</Toggle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>الأعمدة:</span>
            {COL_DEFS.map((c) => (
              <Toggle key={c.key} active={visibleCols.has(c.key)} onClick={() => toggleCol(c.key)}>
                {c.label}
              </Toggle>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto flex-1 p-5">
          {(monthItems.length > 0 || unscheduled.length > 0) && (
            <div className="flex gap-3 rounded-xl p-3 mb-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
              <Stat label="مجدول" value={monthItems.length} color="var(--iris-500)" />
              {selectedClient?.deliverableCount ? (
                <Stat
                  label={`منجز / ${selectedClient.deliverableCount}`}
                  value={monthItems.filter((i) => i.status === 'delivered' || i.status === 'published').length}
                  color="var(--success-500)"
                />
              ) : null}
              {unscheduled.length > 0 && <Stat label="بدون موعد" value={unscheduled.length} color="var(--color-text-muted)" />}
            </div>
          )}

          {monthItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'العنوان', ...previewCols.map((c) => c.label)].map((h) => (
                    <th key={h} style={{
                      textAlign: 'right', padding: '7px 10px', fontSize: 11, fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      borderBottom: '2px solid var(--color-surface-border)',
                      background: 'var(--color-surface-overlay)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthItems.map((it, idx) => (
                  <Fragment key={it.id}>
                    <tr>
                      <td style={{ ...pcell, color: 'var(--color-text-muted)', fontSize: 11, width: 28 }}>{idx + 1}</td>
                      <td style={{ ...pcell, color: 'var(--color-text-primary)', fontWeight: 500 }}>{it.title}</td>
                      {previewCols.map((c) => previewCell(it, c.key))}
                    </tr>
                    {includeBody && it.body && (
                      <tr>
                        <td />
                        <td colSpan={1 + previewCols.length} style={{ padding: '0 10px 8px', color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', borderBottom: '1px solid var(--color-surface-border)' }}>
                          {it.body}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm">لا يوجد محتوى مجدول في {monthLabel(year, month)}</p>
            </div>
          )}

          {unscheduled.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-surface-border)', paddingTop: 8 }}>
                بدون موعد نشر ({unscheduled.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unscheduled.map((it) => {
                  const sc = STATUS_VAR[it.status]
                  return (
                    <span key={it.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 11,
                      background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, display: 'inline-block' }} />
                      {it.title}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 shrink-0 text-xs" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
          سيُفتح ملف طباعة في نافذة جديدة — اختر «حفظ كـ PDF» لمشاركته مع العميل
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="axis-num text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors"
      style={{
        background: active ? 'color-mix(in oklch, var(--iris-500) 15%, transparent)' : 'var(--color-surface-overlay)',
        color: active ? 'var(--iris-500)' : 'var(--color-text-muted)',
        border: `1px solid ${active ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
      }}
    >
      {children}
    </button>
  )
}
