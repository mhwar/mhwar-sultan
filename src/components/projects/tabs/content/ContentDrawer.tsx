'use client'
import { useEffect, useState } from 'react'
import { X, Trash2, Check, Plus, ListChecks, FileText, Maximize2, ChevronLeft, Inbox } from 'lucide-react'
import type { Client, ContentItem, ContentType, ContentStatus, ContentPlatform, ContentChecklistItem, ContentSource } from '@/types'
import {
  TYPE_LABEL, PLATFORM_LABEL, STATUS_LABEL, STATUS_ORDER, STATUS_VAR, SOURCE_LABEL, CONTENT_SIZES, nextStatus,
} from './contentMeta'
import { generateId } from '@/lib/utils'
import { PlatformIcon } from './PlatformIcon'
import { useTeamStore } from '@/store/store'
import { useShallow } from 'zustand/shallow'

const fieldCls = 'w-full h-9 rounded-md px-2.5 text-sm outline-none'
const fieldStyle = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border-default)',
  color: 'var(--fg-1)',
} as React.CSSProperties

interface Props {
  item: ContentItem
  clients: Client[]
  accent: string
  onUpdate: (data: Partial<ContentItem>) => void
  onDelete: () => void
  onClose: () => void
}

/** Side drawer for viewing, editing, and tracking a single content piece. */
export default function ContentDrawer({ item, clients, accent, onUpdate, onDelete, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const [newTask, setNewTask] = useState('')
  // Custom-dimension mode when the stored value isn't one of the presets.
  const isPreset = CONTENT_SIZES.some((s) => s.value === item.dimensions)
  const [customSize, setCustomSize] = useState(!!item.dimensions && !isPreset)
  const team = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === item.projectId).sort((a, b) => a.order - b.order)))

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])

  const close = () => {
    setOpen(false)
    setTimeout(onClose, 320)
  }

  const checklist = item.checklist ?? []
  const doneCount = checklist.filter((c) => c.done).length
  const pct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0

  const clientName = item.clientId ? clients.find((c) => c.id === item.clientId)?.name : undefined

  const setChecklist = (next: ContentChecklistItem[]) => onUpdate({ checklist: next })
  const addTask = () => {
    if (!newTask.trim()) return
    setChecklist([...checklist, { id: generateId(), title: newTask.trim(), done: false }])
    setNewTask('')
  }
  const toggleTask = (id: string) =>
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  const deleteTask = (id: string) =>
    setChecklist(checklist.filter((c) => c.id !== id))

  const next = nextStatus(item.status)

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 480 }}>

        {/* Header */}
        <div className="relative" style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 16%, transparent), transparent 60%)` }}>
          <div style={{ height: 3, background: accent }} />
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {clientName && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
                    <span className="axis-label" style={{ letterSpacing: '0.04em', color: 'var(--fg-3)' }}>{clientName}</span>
                  </div>
                )}
                <textarea
                  value={item.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  rows={1}
                  placeholder="عنوان المحتوى"
                  className="w-full bg-transparent outline-none resize-none font-bold leading-snug"
                  style={{ color: 'var(--fg-1)', fontSize: '18px' }}
                  autoFocus={!item.title}
                />
              </div>
              <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>

            {/* Status + checklist progress */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 h-6 rounded-full text-xs font-medium inline-flex items-center"
                style={{ background: `color-mix(in oklch, ${STATUS_VAR[item.status]} 15%, transparent)`, color: STATUS_VAR[item.status] }}
              >
                {STATUS_LABEL[item.status]}
              </span>
              {checklist.length > 0 && (
                <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{doneCount}/{checklist.length} مهمة · {pct}%</span>
              )}
            </div>
            {checklist.length > 0 && (
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${pct}%`, background: accent }} />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-6" style={{ paddingTop: 20 }}>

          {/* Status stepper */}
          <section>
            <div className="drawer-section__title">المرحلة</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s, i) => {
                const curIdx = STATUS_ORDER.indexOf(item.status)
                const reached = i <= curIdx
                const isCurrent = s === item.status
                const c = STATUS_VAR[s]
                return (
                  <button
                    key={s}
                    onClick={() => onUpdate({ status: s })}
                    className="px-2.5 h-7 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    style={{
                      background: isCurrent ? c : reached ? `color-mix(in oklch, ${c} 15%, transparent)` : 'var(--surface-1)',
                      color: isCurrent ? 'white' : reached ? c : 'var(--fg-3)',
                      border: `1px solid ${reached ? 'transparent' : 'var(--border-default)'}`,
                    }}
                  >
                    {reached && !isCurrent && <Check size={11} strokeWidth={3} />}
                    {STATUS_LABEL[s]}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Meta fields */}
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="axis-label mb-1 block">العميل</label>
                <select className={fieldCls} style={fieldStyle} value={item.clientId ?? ''} onChange={(e) => onUpdate({ clientId: e.target.value || undefined })}>
                  <option value="">— بدون عميل —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="axis-label mb-1 block">النوع</label>
                <select className={fieldCls} style={fieldStyle} value={item.type} onChange={(e) => onUpdate({ type: e.target.value as ContentType })}>
                  {(Object.keys(TYPE_LABEL) as ContentType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="axis-label mb-1 flex items-center gap-1.5">
                  المنصة
                  {item.platform && <PlatformIcon platform={item.platform} size={12} style={{ color: 'var(--fg-3)' }} />}
                </label>
                <select className={fieldCls} style={fieldStyle} value={item.platform ?? ''} onChange={(e) => onUpdate({ platform: (e.target.value as ContentPlatform) || undefined })}>
                  <option value="">— اختر —</option>
                  {(Object.keys(PLATFORM_LABEL) as ContentPlatform[]).map((k) => <option key={k} value={k}>{PLATFORM_LABEL[k]}</option>)}
                </select>
              </div>
              <div>
                <label className="axis-label mb-1 block inline-flex items-center gap-1"><Maximize2 size={11} /> المقاس</label>
                {customSize ? (
                  <div className="flex gap-1">
                    <input
                      className={fieldCls} style={fieldStyle} dir="ltr"
                      value={item.dimensions ?? ''}
                      onChange={(e) => onUpdate({ dimensions: e.target.value || undefined })}
                      placeholder="1080×1080"
                    />
                    <button
                      onClick={() => { setCustomSize(false); onUpdate({ dimensions: undefined }) }}
                      className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center"
                      style={{ border: '1px solid var(--border-default)', color: 'var(--fg-3)' }}
                      title="قائمة المقاسات"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    className={fieldCls} style={fieldStyle}
                    value={item.dimensions ?? ''}
                    onChange={(e) => {
                      if (e.target.value === '__custom') { setCustomSize(true); onUpdate({ dimensions: undefined }) }
                      else onUpdate({ dimensions: e.target.value || undefined })
                    }}
                  >
                    <option value="">— بدون مقاس —</option>
                    {CONTENT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    <option value="__custom">مقاس مخصص…</option>
                  </select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="axis-label mb-1 flex items-center gap-1.5"><Inbox size={11} /> المصدر</label>
                <div className="flex h-9 rounded-md overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                  {(Object.keys(SOURCE_LABEL) as ContentSource[]).map((s) => {
                    const active = (item.source ?? 'internal') === s
                    return (
                      <button
                        key={s}
                        onClick={() => onUpdate({ source: s })}
                        className="flex-1 text-xs font-medium transition-colors"
                        style={{
                          background: active ? (s === 'client-request' ? 'color-mix(in oklch, var(--warning-500) 18%, transparent)' : 'var(--surface-1)') : 'transparent',
                          color: active ? (s === 'client-request' ? 'var(--warning-500)' : 'var(--fg-1)') : 'var(--fg-3)',
                        }}
                      >
                        {SOURCE_LABEL[s]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="axis-label mb-1 block">المسؤول</label>
                <select className={fieldCls} style={fieldStyle} value={item.assigneeId ?? ''} onChange={(e) => onUpdate({ assigneeId: e.target.value || undefined })}>
                  <option value="">— بدون مسؤول —</option>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="axis-label mb-1 block">تاريخ التسليم</label>
                <input type="date" className={fieldCls} style={fieldStyle} value={item.dueDate ? item.dueDate.slice(0, 10) : ''} onChange={(e) => onUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </div>
              <div>
                <label className="axis-label mb-1 block">تاريخ النشر</label>
                <input type="date" className={fieldCls} style={fieldStyle} value={item.publishDate ? item.publishDate.slice(0, 10) : ''} onChange={(e) => onUpdate({ publishDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </div>
            </div>
          </section>

          {/* Post body */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><FileText size={11} /> نص المنشور</span>
            </div>
            <textarea
              value={item.body ?? ''}
              onChange={(e) => onUpdate({ body: e.target.value || undefined })}
              rows={5}
              placeholder="اكتب نص المنشور / الكوبي هنا…"
              className="w-full rounded-md px-3 py-2.5 text-sm outline-none resize-y leading-relaxed"
              style={fieldStyle}
            />
          </section>

          {/* Production checklist */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><ListChecks size={11} /> مهام الإنتاج</span>
            </div>
            <div className="space-y-2 mb-2">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 group">
                  <button
                    onClick={() => toggleTask(c.id)}
                    className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                    style={{ background: c.done ? accent : 'transparent', borderColor: c.done ? accent : 'var(--border-default)' }}
                  >
                    {c.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                  </button>
                  <span className="text-sm flex-1" style={{ color: c.done ? 'var(--fg-3)' : 'var(--fg-2)', textDecoration: c.done ? 'line-through' : 'none' }}>
                    {c.title}
                  </span>
                  <button
                    onClick={() => deleteTask(c.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
                    style={{ color: 'var(--danger-500)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>أضف خطوات الإنتاج لتتبع الإنجاز (تصميم، مراجعة، جدولة…)</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="إضافة مهمة"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
                className="flex-1 text-xs px-3 py-2 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              />
              <button onClick={addTask} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: accent }}>
                <Plus size={13} />
              </button>
            </div>
          </section>

          {/* Notes */}
          <section>
            <div className="drawer-section__title">ملاحظات</div>
            <textarea
              value={item.notes ?? ''}
              onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
              rows={2}
              placeholder="ملاحظات داخلية"
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
              style={fieldStyle}
            />
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {next ? (
            <button
              onClick={() => onUpdate({ status: next })}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md text-sm font-semibold text-white"
              style={{ background: accent }}
            >
              <Check size={14} /> نقل إلى: {STATUS_LABEL[next]}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 h-9 text-sm" style={{ color: 'var(--success-500)' }}>
              <Check size={14} /> مكتمل
            </span>
          )}
          <button
            onClick={() => { onDelete(); close() }}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors hover:bg-red-500/10"
            style={{ color: 'var(--danger-500)' }}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>
    </div>
  )
}
