'use client'
import { useMemo, useState } from 'react'
import { Plus, Trash2, Check, X, CalendarClock, Users2, ListTodo, ArrowUpRight, ClipboardList, Sparkles } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Meeting, MeetingStatus, MeetingKind, MeetingActionItem } from '@/types'
import { useMeetingStore, useTeamStore, useTaskStore } from '@/store/store'
import { formatDateShort, generateId } from '@/lib/utils'

const STATUS_LABEL: Record<MeetingStatus, string> = { upcoming: 'قادم', done: 'منعقد', cancelled: 'ملغي' }
const STATUS_VAR: Record<MeetingStatus, string> = {
  upcoming: 'var(--info-500)', done: 'var(--success-500)', cancelled: 'var(--danger-500)',
}
const KIND_LABEL: Record<MeetingKind, string> = { weekly: 'متابعة أسبوعية', review: 'مراجعة', external: 'اجتماع خارجي' }

const WEEKLY_AGENDA = [
  'استعراض منجزات الأسبوع',
  'التحديات ومعالجاتها',
  'مستجدات الجهات الخارجية',
  'أولويات الأسبوع القادم',
]

/** yyyy-mm-dd of the next Monday strictly after today (Monday weekly session). */
function nextMonday(): string {
  const d = new Date()
  const ahead = (1 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + ahead)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties
const areaCls = 'w-full rounded-md p-2 text-sm outline-none resize-y'

interface Props { project: Project }

export default function MeetingsTab({ project }: Props) {
  const pid = project.id
  const meetings = useMeetingStore(useShallow((s) => s.meetings.filter((m) => m.projectId === pid)))
  const { addMeeting, updateMeeting, deleteMeeting } = useMeetingStore()
  const members = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === pid)))
  const [openId, setOpenId] = useState<string | null>(null)

  const memberName = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members])

  const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date))
  const past = meetings.filter((m) => m.status !== 'upcoming').sort((a, b) => b.date.localeCompare(a.date))

  const createBlank = () => {
    const id = addMeeting({
      projectId: pid, title: 'اجتماع جديد', date: nextMonday(),
      attendees: [], agenda: [], actionItems: [], status: 'upcoming',
    })
    setOpenId(id)
  }

  const createWeekly = () => {
    const id = addMeeting({
      projectId: pid,
      title: 'جلسة المتابعة الأسبوعية',
      date: nextMonday(), startTime: '10:00', endTime: '11:00',
      kind: 'weekly',
      attendees: members.map((m) => m.id),
      agenda: WEEKLY_AGENDA.map((text) => ({ id: generateId(), text })),
      actionItems: [],
      status: 'upcoming',
    })
    setOpenId(id)
  }

  const Section = ({ title, list }: { title: string; list: Meeting[] }) =>
    list.length === 0 ? null : (
      <div className="space-y-2">
        <p className="axis-label">{title}</p>
        {list.map((m) =>
          openId === m.id ? (
            <MeetingEditor
              key={m.id} meeting={m} projectId={pid}
              members={members} memberName={memberName}
              onChange={(d) => updateMeeting(m.id, d)}
              onDelete={() => { deleteMeeting(m.id); setOpenId(null) }}
              onClose={() => setOpenId(null)}
            />
          ) : (
            <MeetingRow key={m.id} m={m} memberName={memberName} onOpen={() => setOpenId(m.id)} />
          )
        )}
      </div>
    )

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الاجتماعات الدورية</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={createBlank}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> اجتماع جديد
          </button>
          <button
            onClick={createWeekly}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--iris-500)', color: '#fff' }}
          >
            <Sparkles size={13} /> جلسة متابعة أسبوعية
          </button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarClock size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا اجتماعات بعد — ابدأ بجلسة المتابعة الأسبوعية</p>
        </div>
      ) : (
        <div className="space-y-5">
          <Section title="القادمة" list={upcoming} />
          <Section title="السابقة" list={past} />
        </div>
      )}
    </div>
  )
}

// ── Collapsed meeting row ──
function MeetingRow({ m, memberName, onOpen }: { m: Meeting; memberName: Record<string, string>; onOpen: () => void }) {
  const doneItems = m.actionItems.filter((a) => a.done).length
  const names = m.attendees.map((id) => memberName[id]).filter(Boolean)
  return (
    <div
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      <div className="shrink-0 w-16 text-center">
        <p className="axis-num text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatDateShort(m.date + 'T00:00:00Z')}</p>
        {m.startTime && <p className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.startTime}{m.endTime ? `–${m.endTime}` : ''}</p>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{m.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {m.kind && <span>{KIND_LABEL[m.kind]}</span>}
          {names.length > 0 && (
            <span className="inline-flex items-center gap-1"><Users2 size={11} />{names.join('، ')}</span>
          )}
          {m.actionItems.length > 0 && (
            <span className="inline-flex items-center gap-1 axis-num"><ListTodo size={11} />{doneItems}/{m.actionItems.length} بند عمل</span>
          )}
        </div>
      </div>
      <span
        className="shrink-0 flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium"
        style={{ background: `color-mix(in oklch, ${STATUS_VAR[m.status]} 15%, transparent)`, color: STATUS_VAR[m.status] }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_VAR[m.status] }} />
        {STATUS_LABEL[m.status]}
      </span>
    </div>
  )
}

// ── Expanded inline editor (live-writes through onChange) ──
function MeetingEditor({ meeting: m, projectId, members, memberName, onChange, onDelete, onClose }: {
  meeting: Meeting
  projectId: string
  members: { id: string; name: string }[]
  memberName: Record<string, string>
  onChange: (d: Partial<Meeting>) => void
  onDelete: () => void
  onClose: () => void
}) {
  const { addTask, updateTask } = useTaskStore()
  const [agendaText, setAgendaText] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemAssignee, setItemAssignee] = useState('')

  const toggleAttendee = (id: string) =>
    onChange({ attendees: m.attendees.includes(id) ? m.attendees.filter((a) => a !== id) : [...m.attendees, id] })

  const addAgenda = () => {
    const t = agendaText.trim()
    if (!t) return
    onChange({ agenda: [...m.agenda, { id: generateId(), text: t }] })
    setAgendaText('')
  }

  const addItem = () => {
    const t = itemTitle.trim()
    if (!t) return
    onChange({ actionItems: [...m.actionItems, { id: generateId(), title: t, assigneeId: itemAssignee || undefined, done: false }] })
    setItemTitle('')
    setItemAssignee('')
  }

  const patchItem = (id: string, d: Partial<MeetingActionItem>) =>
    onChange({ actionItems: m.actionItems.map((a) => (a.id === id ? { ...a, ...d } : a)) })

  const toggleItem = (a: MeetingActionItem) => {
    patchItem(a.id, { done: !a.done })
    // Keep the linked task in sync when the item was converted
    if (a.taskId) updateTask(a.taskId, { status: !a.done ? 'done' : 'todo' })
  }

  const convertToTask = (a: MeetingActionItem) => {
    if (a.taskId) return
    const taskId = addTask({
      projectId, title: a.title, assigneeId: a.assigneeId,
      status: a.done ? 'done' : 'todo', priority: 'medium',
    })
    patchItem(a.id, { taskId })
  }

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      {/* Title + schedule */}
      <div>
        <label className="axis-label mb-1 block">عنوان الاجتماع</label>
        <input className={inputCls} style={inputStyle} value={m.title} onChange={(e) => onChange({ title: e.target.value })} autoFocus />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>
          <label className="axis-label mb-1 block">التاريخ</label>
          <input type="date" className={inputCls} style={inputStyle} value={m.date} onChange={(e) => onChange({ date: e.target.value })} />
        </div>
        <div>
          <label className="axis-label mb-1 block">من</label>
          <input type="time" className={inputCls} style={inputStyle} value={m.startTime ?? ''} onChange={(e) => onChange({ startTime: e.target.value || undefined })} />
        </div>
        <div>
          <label className="axis-label mb-1 block">إلى</label>
          <input type="time" className={inputCls} style={inputStyle} value={m.endTime ?? ''} onChange={(e) => onChange({ endTime: e.target.value || undefined })} />
        </div>
        <div>
          <label className="axis-label mb-1 block">النوع</label>
          <select className={inputCls} style={inputStyle} value={m.kind ?? ''} onChange={(e) => onChange({ kind: (e.target.value || undefined) as MeetingKind | undefined })}>
            <option value="">—</option>
            {(Object.keys(KIND_LABEL) as MeetingKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="axis-label mb-1 block">الحالة</label>
          <select className={inputCls} style={inputStyle} value={m.status} onChange={(e) => onChange({ status: e.target.value as MeetingStatus })}>
            {(Object.keys(STATUS_LABEL) as MeetingStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
        </div>
      </div>

      {/* Attendees */}
      <div>
        <label className="axis-label mb-1.5 block">الحضور</label>
        <div className="flex flex-wrap gap-1.5">
          {members.map((mem) => {
            const on = m.attendees.includes(mem.id)
            return (
              <button
                key={mem.id}
                onClick={() => toggleAttendee(mem.id)}
                className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: on ? 'color-mix(in oklch, var(--iris-500) 14%, transparent)' : 'var(--color-surface-muted)',
                  color: on ? 'var(--iris-500)' : 'var(--color-text-muted)',
                  border: `1px solid ${on ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
                }}
              >
                {mem.name}
              </button>
            )
          })}
          {members.length === 0 && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>أضف أعضاء الفريق من تبويب الفريق أولاً</p>}
        </div>
      </div>

      {/* Agenda */}
      <div>
        <label className="axis-label mb-1.5 block">الأجندة</label>
        <div className="space-y-1">
          {m.agenda.map((a, i) => (
            <div key={a.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-muted)' }}>
              <span className="axis-num text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{i + 1}.</span>
              <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{a.text}</span>
              <button
                onClick={() => onChange({ agenda: m.agenda.filter((x) => x.id !== a.id) })}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: 'var(--danger-500)' }}
                aria-label="حذف البند"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            className={inputCls} style={inputStyle} value={agendaText}
            onChange={(e) => setAgendaText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addAgenda() }}
            placeholder="أضف بنداً للأجندة…"
          />
          <button onClick={addAgenda} disabled={!agendaText.trim()} className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="إضافة">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Minutes: achievements / challenges / decisions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="axis-label mb-1 block">المنجزات</label>
          <textarea rows={4} className={areaCls} style={inputStyle} value={m.achievements ?? ''} onChange={(e) => onChange({ achievements: e.target.value || undefined })} placeholder="ما الذي أُنجز منذ آخر اجتماع؟" />
        </div>
        <div>
          <label className="axis-label mb-1 block">التحديات والمعالجات</label>
          <textarea rows={4} className={areaCls} style={inputStyle} value={m.challenges ?? ''} onChange={(e) => onChange({ challenges: e.target.value || undefined })} placeholder="التحديات القائمة وكيف ستُعالج" />
        </div>
        <div>
          <label className="axis-label mb-1 block">القرارات</label>
          <textarea rows={4} className={areaCls} style={inputStyle} value={m.decisions ?? ''} onChange={(e) => onChange({ decisions: e.target.value || undefined })} placeholder="القرارات المتخذة في الجلسة" />
        </div>
      </div>

      {/* Action items */}
      <div>
        <label className="axis-label mb-1.5 flex items-center gap-1.5"><ClipboardList size={12} /> بنود العمل</label>
        <div className="space-y-1">
          {m.actionItems.map((a) => (
            <div key={a.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-muted)' }}>
              <button
                onClick={() => toggleItem(a)}
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                style={{
                  background: a.done ? 'var(--success-500)' : 'transparent',
                  border: a.done ? 'none' : '1.5px solid var(--color-surface-border)',
                }}
                aria-label={a.done ? 'إلغاء الإنجاز' : 'إنجاز'}
              >
                {a.done && <Check size={11} color="#fff" strokeWidth={3} />}
              </button>
              <span className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--color-text-primary)', textDecoration: a.done ? 'line-through' : 'none', opacity: a.done ? 0.6 : 1 }}>
                {a.title}
              </span>
              {a.assigneeId && memberName[a.assigneeId] && (
                <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{memberName[a.assigneeId]}</span>
              )}
              {a.taskId ? (
                <span className="shrink-0 flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-semibold" style={{ background: 'color-mix(in oklch, var(--iris-500) 14%, transparent)', color: 'var(--iris-500)' }}>
                  <Check size={9} /> مهمة
                </span>
              ) : (
                <button
                  onClick={() => convertToTask(a)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-semibold transition-opacity"
                  style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                  title="إنشاء مهمة في تبويب التنفيذ"
                >
                  <ArrowUpRight size={9} /> تحويل لمهمة
                </button>
              )}
              <button
                onClick={() => onChange({ actionItems: m.actionItems.filter((x) => x.id !== a.id) })}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: 'var(--danger-500)' }}
                aria-label="حذف البند"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            className={inputCls} style={inputStyle} value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
            placeholder="أضف بند عمل…"
          />
          <select className={`${inputCls} w-36 shrink-0`} style={inputStyle} value={itemAssignee} onChange={(e) => setItemAssignee(e.target.value)}>
            <option value="">بلا مسؤول</option>
            {members.map((mem) => <option key={mem.id} value={mem.id}>{mem.name}</option>)}
          </select>
          <button onClick={addItem} disabled={!itemTitle.trim()} className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="إضافة">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={onDelete} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ color: 'var(--danger-500)' }}>
          <Trash2 size={12} /> حذف الاجتماع
        </button>
        <button onClick={onClose} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <X size={12} /> إغلاق
        </button>
      </div>
    </div>
  )
}
