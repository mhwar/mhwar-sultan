'use client'
import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, X, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Client, ContentItem, ContentType, ContentStatus, ContentPlatform } from '@/types'
import { useContentStore, useClientStore } from '@/store/store'
import { formatDateShort } from '@/lib/utils'

const TYPE_LABEL: Record<ContentType, string> = {
  post: 'منشور', design: 'تصميم', video: 'فيديو', story: 'ستوري',
  reel: 'ريلز', article: 'مقال', other: 'أخرى',
}
const PLATFORM_LABEL: Record<ContentPlatform, string> = {
  twitter: 'تويتر', instagram: 'انستقرام', linkedin: 'لينكدإن',
  tiktok: 'تيك توك', youtube: 'يوتيوب', snapchat: 'سناب شات',
  facebook: 'فيسبوك', other: 'أخرى',
}

const STATUS_LABEL: Record<ContentStatus, string> = {
  idea: 'فكرة', draft: 'مسودة', design: 'تصميم',
  review: 'مراجعة', approved: 'معتمد', delivered: 'مُسلَّم', published: 'منشور',
}
const STATUS_ORDER: ContentStatus[] = ['idea', 'draft', 'design', 'review', 'approved', 'delivered', 'published']
const STATUS_VAR: Record<ContentStatus, string> = {
  idea: 'var(--fg-3)',
  draft: 'var(--warning-500)',
  design: 'oklch(0.65 0.18 280)',
  review: 'oklch(0.60 0.18 215)',
  approved: 'var(--success-500)',
  delivered: 'oklch(0.58 0.18 255)',
  published: 'var(--iris-500)',
}

const CLIENT_COLORS = ['var(--iris-500)', 'var(--warning-500)', 'var(--success-500)', 'oklch(0.65 0.18 320)', 'oklch(0.65 0.18 180)']

function nextStatus(s: ContentStatus): ContentStatus | null {
  const idx = STATUS_ORDER.indexOf(s)
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null
}
function prevStatus(s: ContentStatus): ContentStatus | null {
  const idx = STATUS_ORDER.indexOf(s)
  return idx > 0 ? STATUS_ORDER[idx - 1] : null
}

interface Props { project: Project }

export default function ContentTab({ project }: Props) {
  const pid = project.id
  const items = useContentStore(useShallow((s) =>
    s.items.filter((i) => i.projectId === pid).sort((a, b) => a.order - b.order)
  ))
  const { addItem, updateItem, deleteItem } = useContentStore()
  const clients = useClientStore(useShallow((s) =>
    s.clients.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)
  ))

  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterClient !== 'all' && i.clientId !== filterClient) return false
      if (filterStatus !== 'all' && i.status !== filterStatus) return false
      return true
    })
  }, [items, filterClient, filterStatus])

  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((i) => { counts[i.status] = (counts[i.status] ?? 0) + 1 })
    return counts
  }, [items])

  const clientColorMap = useMemo(
    () => Object.fromEntries(clients.map((c, i) => [c.id, CLIENT_COLORS[i % CLIENT_COLORS.length]])),
    [clients]
  )

  return (
    <div className="axis-card p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>المحتوى</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة محتوى
        </button>
      </div>

      {/* Client filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterClient('all')}
          className="px-3 h-7 rounded-full text-xs font-medium transition-colors"
          style={{
            background: filterClient === 'all' ? 'var(--iris-500)' : 'var(--color-surface-overlay)',
            color: filterClient === 'all' ? 'white' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          الكل ({items.length})
        </button>
        {clients.map((c) => {
          const count = items.filter((i) => i.clientId === c.id).length
          return (
            <button
              key={c.id}
              onClick={() => setFilterClient(filterClient === c.id ? 'all' : c.id)}
              className="px-3 h-7 rounded-full text-xs font-medium transition-colors"
              style={{
                background: filterClient === c.id ? clientColorMap[c.id] : 'var(--color-surface-overlay)',
                color: filterClient === c.id ? 'white' : 'var(--color-text-secondary)',
                border: filterClient === c.id ? 'none' : '1px solid var(--color-surface-border)',
              }}
            >
              {c.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterStatus('all')}
          className="px-2.5 h-6 rounded-full text-xs transition-colors"
          style={{
            background: filterStatus === 'all' ? 'var(--color-surface-border)' : 'transparent',
            color: filterStatus === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          الكل
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className="px-2.5 h-6 rounded-full text-xs transition-colors"
            style={{
              background: filterStatus === s ? `color-mix(in oklch, ${STATUS_VAR[s]} 20%, transparent)` : 'transparent',
              color: filterStatus === s ? STATUS_VAR[s] : 'var(--color-text-muted)',
              border: `1px solid ${filterStatus === s ? STATUS_VAR[s] : 'var(--color-surface-border)'}`,
            }}
          >
            {STATUS_LABEL[s]} {statusCounts[s] ? `(${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((item) =>
          editingId === item.id
            ? <ContentForm
                key={item.id}
                initial={item}
                clients={clients}
                onSave={(d) => { updateItem(item.id, d); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            : <ContentRow
                key={item.id}
                item={item}
                clientName={item.clientId ? (clientMap[item.clientId]?.name ?? '') : ''}
                clientColor={item.clientId ? (clientColorMap[item.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                onEdit={() => setEditingId(item.id)}
                onDelete={() => deleteItem(item.id)}
                onAdvance={() => { const n = nextStatus(item.status); if (n) updateItem(item.id, { status: n }) }}
                onRevert={() => { const p = prevStatus(item.status); if (p) updateItem(item.id, { status: p }) }}
              />
        )}
        {adding && (
          <ContentForm
            clients={clients}
            onSave={(d) => { addItem({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {filtered.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Layers size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {items.length === 0 ? 'لا يوجد محتوى بعد' : 'لا توجد نتائج للفلتر المحدد'}
          </p>
        </div>
      )}
    </div>
  )
}

function ContentRow({
  item, clientName, clientColor, onEdit, onDelete, onAdvance, onRevert,
}: {
  item: ContentItem
  clientName: string
  clientColor: string
  onEdit: () => void
  onDelete: () => void
  onAdvance: () => void
  onRevert: () => void
}) {
  const color = STATUS_VAR[item.status]
  const hasNext = nextStatus(item.status) !== null
  const hasPrev = prevStatus(item.status) !== null

  return (
    <div
      className="group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      {/* Status dot */}
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {clientName && (
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: clientColor }}>{clientName}</span>
          )}
          <span>{TYPE_LABEL[item.type]}</span>
          {item.platform && <span>{PLATFORM_LABEL[item.platform]}</span>}
          {item.dueDate && <span className="num-tabular">{formatDateShort(item.dueDate)}</span>}
        </div>
      </div>

      {/* Status controls */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onRevert}
          disabled={!hasPrev}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-20"
          style={{ color: 'var(--color-text-muted)' }}
          title="رجوع"
        >
          <ChevronRight size={14} />
        </button>
        <span
          className="px-2 h-6 rounded-full text-xs font-medium flex items-center"
          style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
        >
          {STATUS_LABEL[item.status]}
        </span>
        <button
          onClick={onAdvance}
          disabled={!hasNext}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-20"
          style={{ color: 'var(--color-text-muted)' }}
          title="التالي"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
        style={{ color: 'var(--danger-500)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties

type ItemFormData = Omit<ContentItem, 'id' | 'order' | 'createdAt' | 'projectId'>

function ContentForm({
  initial, clients, onSave, onCancel,
}: {
  initial?: ContentItem
  clients: Client[]
  onSave: (d: ItemFormData) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [clientId, setClientId] = useState(initial?.clientId ?? '')
  const [type, setType] = useState<ContentType>(initial?.type ?? 'post')
  const [platform, setPlatform] = useState<ContentPlatform | ''>(initial?.platform ?? '')
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? 'idea')
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '')
  const [publishDate, setPublishDate] = useState(initial?.publishDate ? initial.publishDate.slice(0, 10) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const save = () => {
    if (!title.trim()) return
    onSave({
      title,
      clientId: clientId || undefined,
      type,
      platform: (platform as ContentPlatform) || undefined,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
      notes: notes || undefined,
    })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">العنوان</label>
        <input className={inputCls} style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: منشور ترحيبي للأسبوع الأول" autoFocus />
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
          <label className="axis-label mb-1 block">تاريخ الاستحقاق</label>
          <input type="date" className={inputCls} style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">تاريخ النشر</label>
          <input type="date" className={inputCls} style={inputStyle} value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">ملاحظات</label>
        <input className={inputCls} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}
