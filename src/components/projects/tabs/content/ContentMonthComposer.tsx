'use client'
import { useState, useMemo } from 'react'
import { X, CalendarRange, Sparkles } from 'lucide-react'
import type { ContentItem, ContentType, Client } from '@/types'
import { TYPE_LABEL, monthLabel, keyToISO } from './contentMeta'

const TYPE_OPTS: ContentType[] = ['post', 'design', 'reel', 'story', 'video', 'article']

interface Props {
  projectId: string
  clients: Client[]
  /** Pre-selected client (from a client card). Empty = pick inside. */
  initialClientId?: string
  year: number
  month: number
  onCreate: (item: Partial<ContentItem> & { projectId: string }) => string
  onClose: () => void
}

/** Bulk month composer — write many content pieces at once (one per line),
 *  optionally spread evenly across the month's days. Mirrors the agency
 *  workflow of planning a client's whole month in one sitting. */
export default function ContentMonthComposer({
  projectId, clients, initialClientId, year, month, onCreate, onClose,
}: Props) {
  const [clientId, setClientId] = useState(initialClientId ?? '')
  const [type, setType] = useState<ContentType>('post')
  const [text, setText] = useState('')
  const [distribute, setDistribute] = useState(true)

  const lines = useMemo(
    () => text.split('\n').map((l) => l.trim()).filter(Boolean),
    [text]
  )

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  /** Evenly spread N pieces across the month's days (UTC keys). */
  const dateKeyFor = (i: number, n: number): string | undefined => {
    if (!distribute || n === 0) return undefined
    const day = n === 1 ? Math.ceil(daysInMonth / 2) : 1 + Math.round((i * (daysInMonth - 1)) / (n - 1))
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const createAll = () => {
    if (lines.length === 0) return
    lines.forEach((title, i) => {
      const key = dateKeyFor(i, lines.length)
      onCreate({
        projectId,
        title,
        type,
        status: 'idea',
        clientId: clientId || undefined,
        publishDate: key ? keyToISO(key) : undefined,
      })
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)' }}>
              <CalendarRange size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>تخطيط محتوى {monthLabel(year, month)}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>اكتب كل فكرة في سطر لإنشائها دفعة واحدة</p>
            </div>
          </div>
          <button onClick={onClose} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="إغلاق"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Client + type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="axis-label mb-1 block">العميل</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-9 rounded-md px-2 text-sm outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">بدون عميل</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="axis-label mb-1 block">النوع الافتراضي</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className="w-full h-9 rounded-md px-2 text-sm outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              >
                {TYPE_OPTS.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="axis-label mb-1 block">الأفكار</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'منشور ترحيبي ببداية الشهر\nتصميم العرض الأسبوعي\nريلز خلف الكواليس\nستوري استطلاع رأي…'}
              rows={7}
              autoFocus
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none leading-relaxed"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Distribute toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={distribute} onChange={(e) => setDistribute(e.target.checked)} className="accent-[var(--iris-500)]" />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>توزيع الأفكار على أيام الشهر تلقائياً</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="axis-num">{lines.length}</span> فكرة جاهزة
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 h-9 rounded-md text-xs font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>إلغاء</button>
            <button
              onClick={createAll}
              disabled={lines.length === 0}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md text-xs font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--iris-500)' }}
            >
              <Sparkles size={13} /> إنشاء الكل
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
