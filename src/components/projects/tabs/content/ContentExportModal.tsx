'use client'
import { useState, useMemo, useRef } from 'react'
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

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const clientName = selectedClient?.name ?? 'كل العملاء'
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>جدول المحتوى — ${clientName} — ${monthLabel(year, month)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; background: #fff; color: #111;
      padding: 32px 40px; font-size: 13px;
    }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f4f4f6; text-align: right; padding: 8px 12px;
      font-size: 11px; font-weight: 600; color: #555;
      border-bottom: 2px solid #e0e0e0;
    }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:hover td { background: #fafafa; }
    .num { font-variant-numeric: tabular-nums; direction: ltr; }
    .status-dot {
      display: inline-block; width: 8px; height: 8px;
      border-radius: 50%; margin-left: 6px; vertical-align: middle;
    }
    .badge {
      display: inline-flex; align-items: center;
      padding: 1px 8px; border-radius: 99px; font-size: 11px; font-weight: 500;
    }
    .section-heading {
      background: #f9f9fc; padding: 6px 12px; font-weight: 600;
      font-size: 12px; color: #444; border-bottom: 1px solid #e0e0e0;
    }
    .empty { text-align: center; color: #999; padding: 24px; }
    .footer { margin-top: 32px; color: #aaa; font-size: 11px; text-align: center; }
    @media print {
      body { padding: 16px 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>جدول المحتوى الشهري</h1>
  <p class="meta">
    ${clientName !== 'كل العملاء' ? `العميل: ${clientName} &nbsp;·&nbsp; ` : ''}
    الشهر: ${monthLabel(year, month)}
    ${selectedClient?.deliverableCount ? `&nbsp;·&nbsp; المستهدف: ${selectedClient.deliverableCount} قطعة` : ''}
  </p>
  ${content.innerHTML}
  <p class="footer">تم الإنشاء بواسطة محور — ${new Date().toLocaleDateString('ar-SA-u-nu-latn')}</p>
  <div class="no-print" style="text-align:center;margin-top:24px">
    <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;border-radius:6px;background:#6366F1;color:white;border:none">طباعة / حفظ PDF</button>
  </div>
</body>
</html>`)
    win.document.close()
    win.focus()
  }

  const pad2 = (n: number) => String(n).padStart(2, '0')

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
          <div ref={printRef}>
            {monthItems.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['#', 'العنوان', 'النوع', 'المنصة', 'تاريخ النشر', 'الحالة'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'right', padding: '8px 10px', fontSize: 11,
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
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{it.title}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)' }}>{TYPE_LABEL[it.type]}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)' }}>{it.platform ? PLATFORM_LABEL[it.platform] : '—'}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {sKey ? sKey.slice(8, 10) + '/' + sKey.slice(5, 7) : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-surface-border)' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                            background: `color-mix(in oklch, ${statusColor} 15%, transparent)`,
                            color: statusColor,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
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
                <p className="text-xs font-semibold mb-2 pt-2" style={{ color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-surface-border)' }}>
                  بدون موعد نشر ({unscheduled.length})
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {unscheduled.map((it) => {
                      const statusColor = STATUS_VAR[it.status]
                      return (
                        <tr key={it.id}>
                          <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>{it.title}</td>
                          <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)' }}>{TYPE_LABEL[it.type]}</td>
                          <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)' }}>{it.platform ? PLATFORM_LABEL[it.platform] : '—'}</td>
                          <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-surface-border)' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                              background: `color-mix(in oklch, ${statusColor} 15%, transparent)`,
                              color: statusColor,
                            }}>
                              {STATUS_LABEL[it.status]}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            {selectedClient && (
              <div className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-surface-border)', paddingTop: 8 }}>
                <span className="axis-num">{monthItems.length}</span> قطعة مجدولة
                {selectedClient.deliverableCount ? (
                  <> · المستهدف <span className="axis-num">{selectedClient.deliverableCount}</span> قطعة</>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 shrink-0 text-xs" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
          سيفتح ملف طباعة في نافذة جديدة — احفظه كـ PDF من خيارات الطباعة
        </div>
      </div>
    </div>
  )
}
