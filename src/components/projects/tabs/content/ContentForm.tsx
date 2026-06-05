'use client'
import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import type { Client, ContentItem, ContentType, ContentStatus, ContentPlatform } from '@/types'
import { TYPE_LABEL, PLATFORM_LABEL, STATUS_LABEL, STATUS_ORDER, STATUS_VAR } from './contentMeta'

const inputCls = 'w-full h-9 rounded-md px-2.5 text-sm outline-none'
const inputStyle = {
  background: 'var(--color-surface-muted)',
  border: '1px solid var(--color-surface-border)',
  color: 'var(--color-text-primary)',
} as React.CSSProperties

export type ContentFormData = Omit<ContentItem, 'id' | 'order' | 'createdAt' | 'projectId'>

interface Props {
  /** Existing item being edited (enables delete). */
  initial?: ContentItem
  /** Prefilled fields for a brand-new item (date, client, status…). */
  presets?: Partial<ContentItem>
  clients: Client[]
  onSave: (data: ContentFormData) => void
  onDelete?: () => void
  onClose: () => void
}

/** Modal sheet for creating or editing a content piece. */
export default function ContentForm({ initial, presets, clients, onSave, onDelete, onClose }: Props) {
  const base = initial ?? presets ?? {}
  const [title, setTitle] = useState(base.title ?? '')
  const [clientId, setClientId] = useState(base.clientId ?? '')
  const [type, setType] = useState<ContentType>(base.type ?? 'post')
  const [platform, setPlatform] = useState<ContentPlatform | ''>(base.platform ?? '')
  const [status, setStatus] = useState<ContentStatus>(base.status ?? 'idea')
  const [dueDate, setDueDate] = useState(base.dueDate ? base.dueDate.slice(0, 10) : '')
  const [publishDate, setPublishDate] = useState(base.publishDate ? base.publishDate.slice(0, 10) : '')
  const [notes, setNotes] = useState(base.notes ?? '')

  const save = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      clientId: clientId || undefined,
      type,
      platform: (platform as ContentPlatform) || undefined,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>
            {initial ? 'تعديل المحتوى' : 'محتوى جديد'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="axis-label mb-1 block">العنوان</label>
            <input
              className={inputCls} style={inputStyle}
              value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save() }}
              placeholder="مثال: منشور ترحيبي للأسبوع الأول" autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">العميل</label>
              <select className={inputCls} style={inputStyle} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— بدون عميل —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="axis-label mb-1 block">الحالة</label>
              <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}>
                {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">النوع</label>
              <select className={inputCls} style={inputStyle} value={type} onChange={(e) => setType(e.target.value as ContentType)}>
                {(Object.keys(TYPE_LABEL) as ContentType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="axis-label mb-1 block">المنصة</label>
              <select className={inputCls} style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value as ContentPlatform | '')}>
                <option value="">— اختر —</option>
                {(Object.keys(PLATFORM_LABEL) as ContentPlatform[]).map((k) => <option key={k} value={k}>{PLATFORM_LABEL[k]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">تاريخ التسليم</label>
              <input type="date" className={inputCls} style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">تاريخ النشر</label>
              <input type="date" className={inputCls} style={inputStyle} value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="axis-label mb-1 block">ملاحظات</label>
            <textarea
              className="w-full rounded-md px-2.5 py-2 text-sm outline-none resize-none" style={inputStyle}
              rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري"
            />
          </div>

          {/* Status preview strip */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_VAR[status] }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{STATUS_LABEL[status]}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-5 py-4 sticky bottom-0"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
        >
          <button onClick={save} className="flex items-center gap-1.5 px-4 h-9 rounded-md text-sm font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
            <Check size={14} /> حفظ
          </button>
          <button onClick={onClose} className="flex items-center gap-1.5 px-4 h-9 rounded-md text-sm" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
            إلغاء
          </button>
          {initial && onDelete && (
            <button
              onClick={onDelete}
              className="ms-auto flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors hover:bg-red-500/10"
              style={{ color: 'var(--danger-500)' }}
            >
              <Trash2 size={14} /> حذف
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
