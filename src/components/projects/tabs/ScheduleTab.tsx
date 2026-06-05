'use client'
import { useState } from 'react'
import { Plus, Trash2, MapPin, User, Check, X, CalendarDays } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, ScheduleEvent, ScheduleStatus } from '@/types'
import { useScheduleStore } from '@/store/store'
import { formatDateShort } from '@/lib/utils'

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  planned: 'مخطط', confirmed: 'مؤكد', done: 'منجز', cancelled: 'ملغي',
}
const STATUS_VAR: Record<ScheduleStatus, string> = {
  planned: 'var(--fg-3)', confirmed: 'var(--info-500)', done: 'var(--success-500)', cancelled: 'var(--danger-500)',
}

interface Props { project: Project }

export default function ScheduleTab({ project }: Props) {
  const pid = project.id
  const events = useScheduleStore(useShallow((s) =>
    [...s.events.filter((e) => e.projectId === pid)].sort((a, b) => {
      const da = a.date ?? '', db = b.date ?? ''
      if (da !== db) return da < db ? -1 : 1
      return (a.startTime ?? '').localeCompare(b.startTime ?? '')
    })
  ))
  const { addEvent, updateEvent, deleteEvent } = useScheduleStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الأجندة والبرنامج</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة فقرة
        </button>
      </div>

      <div className="space-y-2">
        {events.map((e) =>
          editingId === e.id
            ? <EventForm key={e.id} initial={e} onSave={(d) => { updateEvent(e.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            : <EventRow key={e.id} ev={e} onEdit={() => setEditingId(e.id)} onDelete={() => deleteEvent(e.id)} />
        )}
        {adding && (
          <EventForm
            onSave={(d) => { addEvent({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {events.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarDays size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد فقرات في البرنامج بعد</p>
        </div>
      )}
    </div>
  )
}

function EventRow({ ev: e, onEdit, onDelete }: { ev: ScheduleEvent; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      <div className="shrink-0 w-16 text-center">
        <p className="axis-num text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{e.date ? formatDateShort(e.date) : '—'}</p>
        {e.startTime && <p className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.startTime}{e.endTime ? `–${e.endTime}` : ''}</p>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {e.location && <span className="inline-flex items-center gap-1"><MapPin size={11} />{e.location}</span>}
          {e.owner && <span className="inline-flex items-center gap-1"><User size={11} />{e.owner}</span>}
        </div>
      </div>
      <span
        className="shrink-0 flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium"
        style={{ background: `color-mix(in oklch, ${STATUS_VAR[e.status]} 15%, transparent)`, color: STATUS_VAR[e.status] }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_VAR[e.status] }} />
        {STATUS_LABEL[e.status]}
      </span>
      <button
        onClick={(ev) => { ev.stopPropagation(); onDelete() }}
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

function EventForm({ initial, onSave, onCancel }: { initial?: ScheduleEvent; onSave: (d: Omit<ScheduleEvent, 'id' | 'order' | 'createdAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [status, setStatus] = useState<ScheduleStatus>(initial?.status ?? 'planned')

  const save = () => {
    if (!title.trim()) return
    onSave({ title, date: date ? new Date(date).toISOString() : undefined, startTime: startTime || undefined, endTime: endTime || undefined, location: location || undefined, owner: owner || undefined, status })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">عنوان الفقرة</label>
        <input className={inputCls} style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: الجلسة الافتتاحية" autoFocus />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="axis-label mb-1 block">التاريخ</label>
          <input type="date" className={inputCls} style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">من</label>
          <input type="time" className={inputCls} style={inputStyle} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">إلى</label>
          <input type="time" className={inputCls} style={inputStyle} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">المكان</label>
          <input className={inputCls} style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="القاعة الرئيسية" />
        </div>
        <div>
          <label className="axis-label mb-1 block">المسؤول</label>
          <input className={inputCls} style={inputStyle} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="اسم المسؤول" />
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">الحالة</label>
        <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ScheduleStatus)}>
          {(Object.keys(STATUS_LABEL) as ScheduleStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
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
