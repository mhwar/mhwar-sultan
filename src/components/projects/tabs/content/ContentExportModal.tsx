'use client'
import { useState, useMemo } from 'react'
import { X, Printer, ChevronDown } from 'lucide-react'
import type { Client, ContentItem } from '@/types'
import { TYPE_LABEL, PLATFORM_LABEL, STATUS_LABEL, STATUS_VAR, scheduledKey, keyInMonth, monthLabel } from './contentMeta'

interface Props {
  items: ContentItem[]
  clients: Client[]
  clientColorMap: Record<string, string>
  year: number
  month: number
  onClose: () => void
}

/** Inline hex/oklch for print (CSS variables don't survive the new window). */
const PRINT_STATUS_COLOR: Record<string, string> = {
  idea: '#9ca3af',
  draft: '#f59e0b',
  design: '#a78bfa',
  review: '#60a5fa',
  approved: '#34d399',
  delivered: '#818cf8',
  published: '#6366f1',
}
const PRINT_STATUS_BG: Record<string, string> = {
  idea: '#f3f4f6',
  draft: '#fffbeb',
  design: '#ede9fe',
  review: '#eff6ff',
  approved: '#ecfdf5',
  delivered: '#eef2ff',
  published: '#eef2ff',
}

export default function ContentExportModal({ items, clients, clientColorMap, year, month, onClose }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? '__all')

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const monthItems = useMemo(() => {
    return items
      .filter((i) => {
        if (selectedClientId !== '__all' && i.clientId !== selectedClientId) return false
        return keyInMonth(scheduledKey(i), year, month)
      })
      .sort((a, b) => {
        const ka = scheduledKey(a) ?? ''
        const kb = scheduledKey(b) ?? ''
        return ka < kb ? -1 : ka > kb ? 1 : 0
      })
  }, [items, selectedClientId, year, month])

  const unscheduled = useMemo(() => {
    return items.filter((i) => {
      if (selectedClientId !== '__all' && i.clientId !== selectedClientId) return false
      return !scheduledKey(i)
    })
  }, [items, selectedClientId])

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=720')
    if (!win) return
    const clientName = selectedClient?.name ?? 'كل العملاء'
    const logoHtml = selectedClient?.logo
      ? `<img src="${selectedClient.logo}" alt="" style="height:48px;object-fit:contain;max-width:120px;" />`
      : ''
    const printedAt = new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })

    const rowsHtml = monthItems.map((it, idx) => {
      const sKey = scheduledKey(it)
      const day = sKey ? sKey.slice(8, 10) + '/' + sKey.slice(5, 7) : '—'
      const sc = PRINT_STATUS_COLOR[it.status] ?? '#6b7280'
      const sb = PRINT_STATUS_BG[it.status] ?? '#f3f4f6'
      return `<tr>
        <td class="num center">${idx + 1}</td>
        <td class="title">${it.title}</td>
        <td>${TYPE_LABEL[it.type]}</td>
        <td>${it.platform ? PLATFORM_LABEL[it.platform] : '—'}</td>
        <td class="num center">${day}</td>
        <td><span class="badge" style="color:${sc};background:${sb}">
          <span class="dot" style="background:${sc}"></span>${STATUS_LABEL[it.status]}
        </span></td>
      </tr>`
    }).join('')

    const unschHtml = unscheduled.length > 0 ? `
      <h3 class="section-title">بدون موعد نشر <span class="count">(${unscheduled.length})</span></h3>
      <table>
        <tbody>
          ${unscheduled.map((it) => {
            const sc = PRINT_STATUS_COLOR[it.status] ?? '#6b7280'
            const sb = PRINT_STATUS_BG[it.status] ?? '#f3f4f6'
            return `<tr>
              <td class="title">${it.title}</td>
              <td>${TYPE_LABEL[it.type]}</td>
              <td>${it.platform ? PLATFORM_LABEL[it.platform] : '—'}</td>
              <td><span class="badge" style="color:${sc};background:${sb}">
                <span class="dot" style="background:${sc}"></span>${STATUS_LABEL[it.status]}
              </span></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>` : ''

    const quota = selectedClient?.deliverableCount ?? 0
    const done = monthItems.filter((i) => i.status === 'delivered' || i.status === 'published').length
    const pct = quota > 0 ? Math.round((done / quota) * 100) : null

    const summaryHtml = `
      <div class="summary-row">
        <div class="summary-item"><span class="summary-num">${monthItems.length}</span><span class="summary-label">قطعة مجدولة</span></div>
        ${quota > 0 ? `<div class="summary-item"><span class="summary-num">${done}</span><span class="summary-label">منجزة / ${quota}</span></div>` : ''}
        ${pct !== null ? `<div class="summary-item"><span class="summary-num">${pct}%</span><span class="summary-label">من الهدف</span></div>` : ''}
        <div class="summary-item"><span class="summary-num">${unscheduled.length}</span><span class="summary-label">بدون موعد</span></div>
      </div>`

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>جدول المحتوى — ${clientName} — ${monthLabel(year, month)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 22mm 15mm;
    }
    @page :first { margin-top: 14mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif;
      direction: rtl;
      background: #fff;
      color: #1a1a2e;
      font-size: 10pt;
      line-height: 1.5;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10pt;
      border-bottom: 2.5pt solid #6366f1;
      margin-bottom: 14pt;
    }
    .header-left { display: flex; align-items: center; gap: 10pt; }
    .header-logo { height: 44pt; object-fit: contain; max-width: 100pt; }
    .header-title { font-size: 16pt; font-weight: 700; color: #1a1a2e; line-height: 1.2; }
    .header-sub { font-size: 9pt; color: #6b7280; margin-top: 2pt; }
    .header-right { text-align: left; font-size: 8.5pt; color: #6b7280; line-height: 1.6; }
    .header-month { font-size: 12pt; font-weight: 600; color: #6366f1; }

    /* ── Summary row ── */
    .summary-row {
      display: flex;
      gap: 12pt;
      padding: 8pt 10pt;
      background: #f8f8fc;
      border-radius: 6pt;
      margin-bottom: 12pt;
      border: 0.5pt solid #e5e7eb;
    }
    .summary-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .summary-num { font-size: 14pt; font-weight: 700; color: #6366f1; font-variant-numeric: tabular-nums; }
    .summary-label { font-size: 7.5pt; color: #6b7280; margin-top: 1pt; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }

    thead tr { background: #6366f1; }
    thead th {
      color: white;
      font-weight: 600;
      font-size: 9pt;
      padding: 6pt 7pt;
      text-align: right;
    }
    thead th.center { text-align: center; }

    tbody tr { border-bottom: 0.4pt solid #e9e9f0; }
    tbody tr:nth-child(even) { background: #f9f9fc; }
    tbody tr:last-child { border-bottom: none; }

    td { padding: 5.5pt 7pt; font-size: 9.5pt; vertical-align: middle; }
    td.num { font-variant-numeric: tabular-nums; direction: ltr; }
    td.center { text-align: center; }
    td.title { font-weight: 500; max-width: 180pt; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4pt;
      padding: 1.5pt 6pt;
      border-radius: 99pt;
      font-size: 8.5pt;
      font-weight: 500;
      white-space: nowrap;
    }
    .dot {
      display: inline-block;
      width: 5pt;
      height: 5pt;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ── Section title ── */
    .section-title {
      font-size: 10pt;
      font-weight: 600;
      color: #374151;
      margin: 10pt 0 6pt;
      padding-bottom: 4pt;
      border-bottom: 0.8pt dashed #d1d5db;
    }
    .section-title .count { font-weight: 400; color: #9ca3af; }

    /* ── Footer ── */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #9ca3af;
      padding: 5pt 0;
      border-top: 0.4pt solid #e5e7eb;
    }

    /* ── Print button (hidden on print) ── */
    .print-btn-wrap { text-align: center; margin-top: 20pt; }
    .print-btn {
      padding: 9pt 24pt;
      font-size: 11pt;
      cursor: pointer;
      border-radius: 6pt;
      background: #6366f1;
      color: white;
      border: none;
      font-family: inherit;
    }

    @media print {
      .print-btn-wrap { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="page-header">
    <div class="header-left">
      ${logoHtml ? `<img class="header-logo" src="${selectedClient?.logo}" alt="${clientName}" />` : ''}
      <div>
        <div class="header-title">جدول المحتوى الشهري</div>
        <div class="header-sub">${clientName}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-month">${monthLabel(year, month)}</div>
      ${quota > 0 ? `<div>المستهدف: <strong>${quota}</strong> قطعة / شهر</div>` : ''}
      <div>تاريخ الإصدار: ${printedAt}</div>
    </div>
  </div>

  <!-- Summary -->
  ${summaryHtml}

  <!-- Main table -->
  ${monthItems.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th class="center" style="width:22pt">#</th>
        <th>العنوان</th>
        <th style="width:46pt">النوع</th>
        <th style="width:54pt">المنصة</th>
        <th class="center" style="width:40pt">التاريخ</th>
        <th style="width:62pt">الحالة</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>` : `<p style="color:#9ca3af;text-align:center;padding:16pt">لا يوجد محتوى مجدول لهذا الشهر</p>`}

  ${unschHtml}

  <!-- Footer -->
  <div class="page-footer">
    <span>محور — نظام إدارة المحتوى</span>
    <span>${clientName} · ${monthLabel(year, month)}</span>
  </div>

  <div class="print-btn-wrap">
    <button class="print-btn" onclick="window.print()">🖨️ &nbsp;طباعة / حفظ كـ PDF</button>
  </div>

</body>
</html>`)
    win.document.close()
    win.focus()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl flex flex-col animate-fade-up"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
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
            {monthItems.length} قطعة مجدولة
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 h-8 rounded-md text-sm font-semibold"
            style={{ background: 'var(--iris-500)', color: 'white' }}
          >
            <Printer size={14} /> طباعة / تصدير PDF
          </button>
        </div>

        {/* Preview table */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* Summary strip */}
          {(monthItems.length > 0 || unscheduled.length > 0) && (
            <div className="flex gap-3 rounded-xl p-3 mb-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
              <Stat label="مجدول" value={monthItems.length} color="var(--iris-500)" />
              {selectedClient?.deliverableCount ? (
                <Stat label={`منجز / ${selectedClient.deliverableCount}`} value={monthItems.filter((i) => i.status === 'delivered' || i.status === 'published').length} color="var(--success-500)" />
              ) : null}
              <Stat label="بدون موعد" value={unscheduled.length} color="var(--color-text-muted)" />
            </div>
          )}

          {monthItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'العنوان', 'النوع', 'المنصة', 'التاريخ', 'الحالة'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'right', padding: '7px 10px', fontSize: 11,
                      fontWeight: 600, color: 'var(--color-text-muted)',
                      borderBottom: '2px solid var(--color-surface-border)',
                      background: 'var(--color-surface-overlay)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthItems.map((it, idx) => {
                  const sKey = scheduledKey(it)
                  const statusColor = STATUS_VAR[it.status]
                  return (
                    <tr key={it.id}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', fontSize: 12, width: 28 }}>{idx + 1}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{it.title}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{TYPE_LABEL[it.type]}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{it.platform ? PLATFORM_LABEL[it.platform] : '—'}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {sKey ? sKey.slice(8, 10) + '/' + sKey.slice(5, 7) : '—'}
                      </td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-surface-border)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                          background: `color-mix(in oklch, ${statusColor} 15%, transparent)`,
                          color: statusColor,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
                          {STATUS_LABEL[it.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm">لا يوجد محتوى مجدول لهذا العميل في {monthLabel(year, month)}</p>
            </div>
          )}

          {/* Unscheduled section */}
          {unscheduled.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-surface-border)', paddingTop: 8 }}>
                بدون موعد نشر ({unscheduled.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unscheduled.map((it) => {
                  const statusColor = STATUS_VAR[it.status]
                  return (
                    <span key={it.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 11,
                      background: 'var(--color-surface-overlay)',
                      border: '1px solid var(--color-surface-border)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                      {it.title}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 shrink-0 text-xs" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
          سيُفتح ملف طباعة في نافذة جديدة — اختر «حفظ كـ PDF» من خيارات الطابعة للمشاركة مع العميل
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
