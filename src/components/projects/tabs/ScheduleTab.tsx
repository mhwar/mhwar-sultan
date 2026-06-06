'use client'
import { useState, useMemo } from 'react'
import { Plus, Trash2, MapPin, User, Check, X, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, ScheduleEvent, ScheduleStatus } from '@/types'
import { useScheduleStore } from '@/store/store'
import { formatDateShort } from '@/lib/utils'
import Segmented from '@/components/ui/Segmented'

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  planned: 'مخطط', confirmed: 'مؤكد', done: 'منجز', cancelled: 'ملغي',
}
const STATUS_VAR: Record<ScheduleStatus, string> = {
  planned: 'var(--fg-3)', confirmed: 'var(--info-500)', done: 'var(--success-500)', cancelled: 'var(--danger-500)',
}
const WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1))
}

function monthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let cur = 1 - firstDay
  while (cur <= days) {
    const week: (number | null)[] = []
    for (let d = 0; d < 7; d++, cur++) {
      week.push(cur >= 1 && cur <= days ? cur : null)
    }
    weeks.push(week)
  }
  return weeks
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

type CalView = 'list' | 'calendar'

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
  const [view, setView] = useState<CalView>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addDate, setAddDate] = useState<string | undefined>()
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const { year, month } = cursor
  const stepMonth = (d: number) => setCursor((c) => {
    const dt = new Date(c.year, c.month + d, 1)
    return { year: dt.getFullYear(), month: dt.getMonth() }
  })

  const eventsByDay = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {}
    for (const e of events) {
      if (!e.date) continue
      const k = e.date.slice(0, 10)
      if (!map[k]) map[k] = []
      map[k].push(e)
    }
    return map
  }, [events])

  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate())
  const grid = useMemo(() => monthGrid(year, month), [year, month])

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الأجندة والبرنامج</h2>
        <div className="flex items-center gap-2">
          <Segmented
            value={view}
            onChange={(v) => setView(v as CalView)}
            options={[
              { value: 'list', icon: <List size={14} />, label: 'قائمة' },
              { value: 'calendar', icon: <CalendarDays size={14} />, label: 'تقويم' },
            ]}
          />
          <button
            onClick={() => { setAddDate(undefined); setAdding(true) }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> إضافة فقرة
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        <div>
          {/* Month nav */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => stepMonth(-1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              <ChevronRight size={14} />
            </button>
            <span className="text-sm font-semibold flex-1 text-center" style={{ color: 'var(--color-text-primary)' }}>{monthLabel(year, month)}</span>
            <button onClick={() => stepMonth(1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-0.5">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {week.map((day, di) => {
                  if (day === null) return <div key={di} />
                  const key = dayKey(year, month, day)
                  const dayEvents = eventsByDay[key] ?? []
                  const isToday = key === todayKey
                  return (
                    <div
                      key={di}
                      onClick={() => { setAddDate(key); setAdding(true) }}
                      className="rounded-lg p-1 min-h-[64px] cursor-pointer transition-colors hover:bg-white/5"
                      style={{
                        background: isToday ? 'color-mix(in oklch, var(--iris-500) 8%, transparent)' : 'var(--color-surface-overlay)',
                        border: `1px solid ${isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                      }}
                    >
                      <p className="text-xs font-medium mb-1 text-center axis-num"
                        style={{ color: isToday ? 'var(--iris-500)' : 'var(--color-text-muted)' }}>
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            onClick={(ev) => { ev.stopPropagation(); setEditingId(e.id) }}
                            className="text-[10px] leading-tight px-1 py-0.5 rounded truncate"
                            style={{ background: `color-mix(in oklch, ${STATUS_VAR[e.status]} 20%, transparent)`, color: STATUS_VAR[e.status] }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-center axis-num" style={{ color: 'var(--color-text-muted)' }}>
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-2">
          {events.map((e) =>
            editingId === e.id
              ? <EventForm key={e.id} initial={e} onSave={(d) => { updateEvent(e.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
              : <EventRow key={e.id} ev={e} onEdit={() => setEditingId(e.id)} onDelete={() => deleteEvent(e.id)} />
          )}
          {adding && (
            <EventForm
              defaultDate={addDate}
              onSave={(d) => { addEvent({ ...d, projectId: pid }); setAdding(false); setAddDate(undefined) }}
              onCancel={() => { setAdding(false); setAddDate(undefined) }}
            />
          )}
          {events.length === 0 && !adding && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CalendarDays size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد فقرات في البرنامج بعد</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form (shown in both views) */}
      {view === 'calendar' && editingId && (
        <div className="mt-4">
          {events.filter((e) => e.id === editingId).map((e) => (
            <EventForm key={e.id} initial={e} onSave={(d) => { updateEvent(e.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
          ))}
        </div>
      )}

      {/* Add form (calendar view) */}
      {view === 'calendar' && adding && (
        <div className="mt-4">
          <EventForm
            defaultDate={addDate}
            onSave={(d) => { addEvent({ ...d, projectId: pid }); setAdding(false); setAddDate(undefined) }}
            onCancel={() => { setAdding(false); setAddDate(undefined) }}
          />
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

function EventForm({ initial, defaultDate, onSave, onCancel }: {
  initial?: ScheduleEvent
  defaultDate?: string
  onSave: (d: Omit<ScheduleEvent, 'id' | 'order' | 'createdAt' | 'projectId'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : (defaultDate ?? ''))
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
