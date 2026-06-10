'use client'
import { useMemo, useRef, useState } from 'react'
import {
  Plus, Trash2, Check, CalendarClock, ListTodo, ArrowUpRight, ClipboardList,
  Sparkles, ArrowRight, Printer, History, Gauge, Target, Wallet, CornerDownLeft,
  FileText, Gavel, Lightbulb, Calendar, Save,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type {
  Project, Meeting, MeetingStatus, MeetingKind, MeetingActionItem,
  MeetingAgendaItem, MeetingDecision, MeetingRecommendation, TeamMember, Sprint,
} from '@/types'
import { useMeetingStore, useTeamStore, useTaskStore, useSprintStore, useFinanceStore } from '@/store/store'
import { formatDateShort, formatDateAr, generateId } from '@/lib/utils'
import { Avatar } from '@/lib/avatar'

const STATUS_LABEL: Record<MeetingStatus, string> = { upcoming: 'قادم', done: 'منعقد', cancelled: 'ملغي' }
const STATUS_VAR: Record<MeetingStatus, string> = {
  upcoming: 'var(--info-500)', done: 'var(--success-500)', cancelled: 'var(--danger-500)',
}
const KIND_LABEL: Record<MeetingKind, string> = {
  weekly: 'متابعة أسبوعية', review: 'مراجعة', external: 'اجتماع خارجي', other: 'نوع آخر',
}
/** Human label for a meeting's kind, honouring a custom `kindLabel` for `other`. */
function kindText(m: Meeting): string | undefined {
  if (!m.kind) return undefined
  if (m.kind === 'other') return m.kindLabel?.trim() || 'اجتماع آخر'
  return KIND_LABEL[m.kind]
}

const SPRINT_STATUS_LABEL: Record<Sprint['status'], string> = { planned: 'مخطط', active: 'نشط', completed: 'مكتمل' }

const WEEKLY_AGENDA = [
  'استعراض منجزات الأسبوع',
  'متابعة بنود الاجتماع السابق',
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

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])
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

  // ── Full meeting page ──
  const open = openId ? meetings.find((m) => m.id === openId) : undefined
  if (open) {
    return (
      <MeetingPage
        project={project}
        meeting={open}
        meetings={meetings}
        members={members}
        memberById={memberById}
        memberName={memberName}
        onChange={(d) => updateMeeting(open.id, d)}
        onDelete={() => { deleteMeeting(open.id); setOpenId(null) }}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const renderSection = (title: string, list: Meeting[]) =>
    list.length === 0 ? null : (
      <div className="space-y-2">
        <p className="axis-label">{title}</p>
        {list.map((m) => (
          <MeetingRow key={m.id} m={m} memberById={memberById} onOpen={() => setOpenId(m.id)} />
        ))}
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
          {renderSection('القادمة', upcoming)}
          {renderSection('السابقة', past)}
        </div>
      )}
    </div>
  )
}

// ── Collapsed meeting row ──
function MeetingRow({ m, memberById, onOpen }: { m: Meeting; memberById: Record<string, TeamMember>; onOpen: () => void }) {
  const doneItems = m.actionItems.filter((a) => a.done).length
  const attendees = m.attendees.map((id) => memberById[id]).filter(Boolean) as TeamMember[]
  const kind = kindText(m)
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {kind && <span>{kind}</span>}
          {attendees.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="flex -space-x-1.5 -space-x-reverse">
                {attendees.slice(0, 4).map((a) => (
                  <Avatar key={a.id} name={a.name} src={a.avatar} size={18} className="ring-1 ring-[var(--color-surface-overlay)]" />
                ))}
              </span>
              {attendees.length > 4 && <span className="axis-num">+{attendees.length - 4}</span>}
            </span>
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

// ════════════════════ Reusable bits (module scope = stable identity) ════════════════════
// NB: defining these at module scope (not inside MeetingPage) is what keeps inputs
// from losing focus on every keystroke.

function SectionCard({ icon, title, children, extra }: { icon: React.ReactNode; title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="axis-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <span style={{ color: 'var(--iris-500)' }}>{icon}</span> {title}
        </h3>
        {extra}
      </div>
      {children}
    </div>
  )
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 h-7 mt-2 rounded-md text-xs font-medium transition-colors"
      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-surface-border)' }}
    >
      <Plus size={13} /> {label}
    </button>
  )
}

function MemberSelect({ value, onChange, members, placeholder, width = 'w-32' }: {
  value: string; onChange: (v: string) => void; members: TeamMember[]; placeholder: string; width?: string
}) {
  return (
    <select className={`${inputCls} ${width} shrink-0`} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {members.map((mem) => <option key={mem.id} value={mem.id}>{mem.name}</option>)}
    </select>
  )
}

function RowDelete({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--danger-500)' }} aria-label="حذف">
      <Trash2 size={13} />
    </button>
  )
}

// ── Agenda ──
function AgendaEditor({ items, onChange }: { items: MeetingAgendaItem[]; onChange: (v: MeetingAgendaItem[]) => void }) {
  const patch = (id: string, text: string) => onChange(items.map((a) => (a.id === id ? { ...a, text } : a)))
  const remove = (id: string) => onChange(items.filter((a) => a.id !== id))
  const add = () => onChange([...items, { id: generateId(), text: '' }])
  return (
    <div className="space-y-1.5">
      {items.map((a, i) => (
        <div key={a.id} className="group flex items-center gap-2">
          <span className="axis-num text-xs shrink-0 w-5 text-center" style={{ color: 'var(--color-text-muted)' }}>{i + 1}.</span>
          <input className={inputCls} style={inputStyle} value={a.text} onChange={(e) => patch(a.id, e.target.value)} placeholder="بند للأجندة…" />
          <RowDelete onClick={() => remove(a.id)} />
        </div>
      ))}
      <AddRowButton label="إضافة بند" onClick={add} />
    </div>
  )
}

// ── Decisions (text + owner + deadline) ──
function DecisionEditor({ items, onChange, members }: { items: MeetingDecision[]; onChange: (v: MeetingDecision[]) => void; members: TeamMember[] }) {
  const patch = (id: string, d: Partial<MeetingDecision>) => onChange(items.map((x) => (x.id === id ? { ...x, ...d } : x)))
  const remove = (id: string) => onChange(items.filter((x) => x.id !== id))
  const add = () => onChange([...items, { id: generateId(), text: '' }])
  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div key={d.id} className="group rounded-lg p-2 space-y-1.5" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-center gap-2">
            <input className={`${inputCls} bg-transparent`} style={{ ...inputStyle, background: 'var(--color-surface-overlay)' }} value={d.text} onChange={(e) => patch(d.id, { text: e.target.value })} placeholder="نص القرار…" />
            <RowDelete onClick={() => remove(d.id)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MemberSelect value={d.ownerId ?? ''} onChange={(v) => patch(d.id, { ownerId: v || undefined })} members={members} placeholder="المسؤول" />
            <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar size={12} /> الموعد
              <input type="date" className="h-8 rounded-md px-2 text-sm outline-none" style={inputStyle} value={d.dueDate ?? ''} onChange={(e) => patch(d.id, { dueDate: e.target.value || undefined })} />
            </label>
          </div>
        </div>
      ))}
      <AddRowButton label="إضافة قرار" onClick={add} />
    </div>
  )
}

// ── Recommendations (text + owner + deadline + done) ──
function RecommendationEditor({ items, onChange, members }: { items: MeetingRecommendation[]; onChange: (v: MeetingRecommendation[]) => void; members: TeamMember[] }) {
  const patch = (id: string, d: Partial<MeetingRecommendation>) => onChange(items.map((x) => (x.id === id ? { ...x, ...d } : x)))
  const remove = (id: string) => onChange(items.filter((x) => x.id !== id))
  const add = () => onChange([...items, { id: generateId(), text: '', done: false }])
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="group rounded-lg p-2 space-y-1.5" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => patch(r.id, { done: !r.done })}
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{ background: r.done ? 'var(--success-500)' : 'transparent', border: r.done ? 'none' : '1.5px solid var(--color-surface-border)' }}
              aria-label={r.done ? 'إلغاء التنفيذ' : 'تم التنفيذ'}
            >
              {r.done && <Check size={11} color="#fff" strokeWidth={3} />}
            </button>
            <input
              className="flex-1 h-8 rounded-md px-2 text-sm outline-none"
              style={{ ...inputStyle, background: 'var(--color-surface-overlay)', textDecoration: r.done ? 'line-through' : 'none', opacity: r.done ? 0.6 : 1 }}
              value={r.text}
              onChange={(e) => patch(r.id, { text: e.target.value })}
              placeholder="نص التوصية…"
            />
            <RowDelete onClick={() => remove(r.id)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap ps-6">
            <MemberSelect value={r.assigneeId ?? ''} onChange={(v) => patch(r.id, { assigneeId: v || undefined })} members={members} placeholder="المسؤول" />
            <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar size={12} /> الموعد
              <input type="date" className="h-8 rounded-md px-2 text-sm outline-none" style={inputStyle} value={r.dueDate ?? ''} onChange={(e) => patch(r.id, { dueDate: e.target.value || undefined })} />
            </label>
          </div>
        </div>
      ))}
      <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
        التوصيات غير المنجزة تظهر تلقائياً في قسم المتابعة بالاجتماع التالي
      </p>
      <AddRowButton label="إضافة توصية" onClick={add} />
    </div>
  )
}

// ── Action items (title + owner + deadline + status + task link) ──
function ActionItemEditor({ items, onChange, members, onToggle, onConvert }: {
  items: MeetingActionItem[]
  onChange: (v: MeetingActionItem[]) => void
  members: TeamMember[]
  onToggle: (a: MeetingActionItem) => void
  onConvert: (a: MeetingActionItem) => void
}) {
  const patch = (id: string, d: Partial<MeetingActionItem>) => onChange(items.map((x) => (x.id === id ? { ...x, ...d } : x)))
  const remove = (id: string) => onChange(items.filter((x) => x.id !== id))
  const add = () => onChange([...items, { id: generateId(), title: '', done: false }])
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className="group rounded-lg p-2" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(a)}
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{ background: a.done ? 'var(--success-500)' : 'transparent', border: a.done ? 'none' : '1.5px solid var(--color-surface-border)' }}
              aria-label={a.done ? 'إلغاء الإنجاز' : 'إنجاز'}
            >
              {a.done && <Check size={11} color="#fff" strokeWidth={3} />}
            </button>
            <input
              className="flex-1 min-w-0 h-8 rounded-md px-2 text-sm outline-none"
              style={{ ...inputStyle, background: 'var(--color-surface-overlay)', textDecoration: a.done ? 'line-through' : 'none', opacity: a.done ? 0.6 : 1 }}
              value={a.title}
              onChange={(e) => patch(a.id, { title: e.target.value })}
              placeholder="بند عمل…"
            />
            <RowDelete onClick={() => remove(a.id)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1.5 ps-6">
            <MemberSelect value={a.assigneeId ?? ''} onChange={(v) => patch(a.id, { assigneeId: v || undefined })} members={members} placeholder="بلا مسؤول" />
            <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar size={12} /> الموعد
              <input type="date" className="h-8 rounded-md px-2 text-sm outline-none" style={inputStyle} value={a.dueDate ?? ''} onChange={(e) => patch(a.id, { dueDate: e.target.value || undefined })} />
            </label>
            {a.taskId ? (
              <span className="shrink-0 flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold" style={{ background: 'color-mix(in oklch, var(--iris-500) 14%, transparent)', color: 'var(--iris-500)' }}>
                <Check size={9} /> مهمة في التنفيذ
              </span>
            ) : (
              <button
                onClick={() => onConvert(a)}
                disabled={!a.title.trim()}
                className="shrink-0 flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold transition-colors disabled:opacity-40"
                style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                title="إنشاء مهمة في تبويب التنفيذ"
              >
                <ArrowUpRight size={9} /> تحويل لمهمة
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
        بنود العمل تُتابَع في الاجتماع التالي تلقائياً، ويمكن تحويل أي بند إلى مهمة في تبويب التنفيذ
      </p>
      <AddRowButton label="إضافة بند عمل" onClick={add} />
    </div>
  )
}

function IncludeToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-semibold transition-colors"
      style={{
        background: on ? 'color-mix(in oklch, var(--iris-500) 14%, transparent)' : 'var(--color-surface-muted)',
        color: on ? 'var(--iris-500)' : 'var(--color-text-muted)',
        border: `1px solid ${on ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
      }}
      title="تضمين هذه البطاقة في المحضر المُصدَّر"
    >
      {on && <Check size={10} />} تضمين
    </button>
  )
}

function PrevRow({ text, assignee, done, dueDate }: { text: string; assignee?: string; done: boolean; dueDate?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-muted)' }}>
      <span
        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
        style={{ background: done ? 'var(--success-500)' : 'transparent', border: done ? 'none' : '1.5px solid var(--color-surface-border)' }}
      >
        {done && <Check size={11} color="#fff" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--color-text-primary)', opacity: done ? 0.55 : 1, textDecoration: done ? 'line-through' : 'none' }}>
        {text}
      </span>
      {assignee && <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{assignee}</span>}
      {dueDate && !done && <span className="axis-num text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{dueDate}</span>}
      <span className="shrink-0 px-1.5 h-5 rounded text-[10px] font-semibold flex items-center" style={{ background: `color-mix(in oklch, ${done ? 'var(--success-500)' : 'var(--warning-500)'} 14%, transparent)`, color: done ? 'var(--success-500)' : 'var(--warning-500)' }}>
        {done ? 'منجز' : 'معلق'}
      </span>
    </div>
  )
}

// ════════════════════ Full meeting page ════════════════════
function MeetingPage({ project, meeting: m, meetings, members, memberById, memberName, onChange, onDelete, onBack }: {
  project: Project
  meeting: Meeting
  meetings: Meeting[]
  members: TeamMember[]
  memberById: Record<string, TeamMember>
  memberName: Record<string, string>
  onChange: (d: Partial<Meeting>) => void
  onDelete: () => void
  onBack: () => void
}) {
  const pid = project.id
  const { addTask, updateTask } = useTaskStore()
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === pid)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === pid).sort((a, b) => a.order - b.order)))
  const finance = useFinanceStore(useShallow((s) => s.entries.filter((e) => e.projectId === pid)))

  // ── Auto-save indicator ──
  const [savedVisible, setSavedVisible] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackSave = (d: Partial<Meeting>) => {
    onChange(d)
    setSavedVisible(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSavedVisible(false), 2000)
  }

  // Which live blocks get embedded in the exported minutes
  const [incProgress, setIncProgress] = useState(true)
  // Per-initiative inclusion: null = all, Set = selected ids
  const [incInitiativesOn, setIncInitiativesOn] = useState(true)
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string> | null>(null) // null = all
  const [incFinance, setIncFinance] = useState(false)

  const toggleInitiativeId = (id: string) => {
    setSelectedInitiatives((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const decisions = m.decisions ?? []
  const recommendations = m.recommendations ?? []

  // ── Previous meeting (for follow-up) ──
  const prev = useMemo(() => {
    const before = meetings
      .filter((x) => x.id !== m.id && (x.date < m.date || (x.date === m.date && x.createdAt < m.createdAt)))
      .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    return before[before.length - 1]
  }, [meetings, m.id, m.date, m.createdAt])

  const prevPendingItems = prev?.actionItems.filter((a) => !a.done) ?? []
  const prevPendingRecs = prev?.recommendations?.filter((r) => !r.done) ?? []
  const hasPrevPending = prevPendingItems.length > 0 || prevPendingRecs.length > 0

  const carryOver = () => {
    if (!prev || !hasPrevPending) return
    const existing = new Set(m.actionItems.map((a) => a.title))
    const carried = prevPendingItems
      .filter((a) => !existing.has(a.title))
      .map((a) => ({ id: generateId(), title: a.title, assigneeId: a.assigneeId, dueDate: a.dueDate, done: false, taskId: a.taskId }))
    if (carried.length) trackSave({ actionItems: [...m.actionItems, ...carried] })
  }

  // ── Live project snapshot ──
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const activeTasks = tasks.filter((t) => t.status === 'in-progress').length
  const initiatives = sprints.map((sp) => {
    const cl = sp.checklist ?? []
    const clDone = cl.filter((c) => c.done).length
    const spTasks = tasks.filter((t) => t.sprintId === sp.id)
    const spDone = spTasks.filter((t) => t.status === 'done').length
    const pct = cl.length > 0 ? Math.round((clDone / cl.length) * 100) : (spTasks.length > 0 ? Math.round((spDone / spTasks.length) * 100) : 0)
    return { sp, pct, clDone, clTotal: cl.length, spDone, spTotal: spTasks.length }
  })
  const income = finance.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = finance.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
  const currency = finance[0]?.currency ?? 'SAR'

  // ── Action items ──
  const toggleItem = (a: MeetingActionItem) => {
    trackSave({ actionItems: m.actionItems.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) })
    if (a.taskId) updateTask(a.taskId, { status: !a.done ? 'done' : 'todo' })
  }
  const convertToTask = (a: MeetingActionItem) => {
    if (a.taskId || !a.title.trim()) return
    const taskId = addTask({
      projectId: pid, title: a.title, assigneeId: a.assigneeId, dueDate: a.dueDate,
      status: a.done ? 'done' : 'todo', priority: 'medium',
    })
    trackSave({ actionItems: m.actionItems.map((x) => (x.id === a.id ? { ...x, taskId } : x)) })
  }

  const toggleAttendee = (id: string) =>
    trackSave({ attendees: m.attendees.includes(id) ? m.attendees.filter((a) => a !== id) : [...m.attendees, id] })

  // Initiatives selected for export
  const exportInitiatives = incInitiativesOn
    ? (selectedInitiatives === null ? initiatives : initiatives.filter((i) => selectedInitiatives.has(i.sp.id)))
    : undefined

  // ── Export (agenda before / minutes after) ──
  const exportDoc = (mode: 'agenda' | 'minutes') => {
    const html = buildMeetingHTML({
      mode, project, meeting: m, members, memberName,
      prevMeeting: prev,
      snapshot: mode === 'minutes' ? {
        progress: incProgress ? { progress: project.progress, doneTasks, activeTasks, totalTasks: tasks.length } : undefined,
        initiatives: exportInitiatives,
        finance: incFinance && finance.length > 0 ? { income, expense, currency } : undefined,
      } : {},
    })
    const w = window.open('', '_blank', 'width=900,height=800,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  const kindLabel = kindText(m)

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="axis-card p-4 md:p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-md shrink-0 transition-colors hover:bg-white/5 text-xs font-medium"
            style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
            aria-label="عودة لقائمة الاجتماعات"
          >
            <ArrowRight size={14} /> رجوع
          </button>
          {savedVisible && (
            <span className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium shrink-0 transition-opacity" style={{ background: 'color-mix(in oklch, var(--success-500) 14%, transparent)', color: 'var(--success-500)' }}>
              <Save size={11} /> تم الحفظ
            </span>
          )}
          <div className="flex-1 min-w-[220px]">
            <label className="axis-label mb-1 block">عنوان الاجتماع</label>
            <input
              className="w-full h-9 rounded-md px-2.5 outline-none text-lg font-bold"
              style={inputStyle}
              value={m.title}
              onChange={(e) => trackSave({ title: e.target.value })}
              placeholder="اكتب عنواناً للاجتماع…"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {formatDateAr(m.date + 'T00:00:00Z')}
              {m.startTime && <> · <span className="axis-num">{m.startTime}{m.endTime ? `–${m.endTime}` : ''}</span></>}
              {kindLabel && <> · {kindLabel}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportDoc('agenda')}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold"
              style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
              title="تصدير الأجندة لإرسالها للفريق قبل الاجتماع"
            >
              <FileText size={13} /> تصدير الأجندة
            </button>
            <button
              onClick={() => exportDoc('minutes')}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold"
              style={{ background: 'var(--iris-500)', color: '#fff' }}
              title="تصدير المحضر النهائي بعد الاجتماع"
            >
              <Printer size={13} /> تصدير المحضر
            </button>
          </div>
        </div>

        {/* Schedule + status row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
          <div>
            <label className="axis-label mb-1 block">التاريخ</label>
            <input type="date" className={inputCls} style={inputStyle} value={m.date} onChange={(e) => trackSave({ date: e.target.value })} />
          </div>
          <div>
            <label className="axis-label mb-1 block">من</label>
            <input type="time" className={inputCls} style={inputStyle} value={m.startTime ?? ''} onChange={(e) => trackSave({ startTime: e.target.value || undefined })} />
          </div>
          <div>
            <label className="axis-label mb-1 block">إلى</label>
            <input type="time" className={inputCls} style={inputStyle} value={m.endTime ?? ''} onChange={(e) => trackSave({ endTime: e.target.value || undefined })} />
          </div>
          <div>
            <label className="axis-label mb-1 block">النوع</label>
            <select className={inputCls} style={inputStyle} value={m.kind ?? ''} onChange={(e) => trackSave({ kind: (e.target.value || undefined) as MeetingKind | undefined })}>
              <option value="">—</option>
              {(Object.keys(KIND_LABEL) as MeetingKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label className="axis-label mb-1 block">الحالة</label>
            <select className={inputCls} style={inputStyle} value={m.status} onChange={(e) => trackSave({ status: e.target.value as MeetingStatus })}>
              {(Object.keys(STATUS_LABEL) as MeetingStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
            </select>
          </div>
        </div>

        {/* Custom kind label */}
        {m.kind === 'other' && (
          <div className="mt-2">
            <label className="axis-label mb-1 block">مسمى النوع</label>
            <input
              className={inputCls} style={inputStyle} value={m.kindLabel ?? ''}
              onChange={(e) => trackSave({ kindLabel: e.target.value || undefined })}
              placeholder="مثال: ورشة عمل، جلسة تنسيق مع GS1، عرض للشركاء…"
            />
          </div>
        )}

        {/* Attendees */}
        <div className="mt-4">
          <label className="axis-label mb-1.5 block">الحضور — يظهرون في الأجندة والمحضر المُصدَّر</label>
          <div className="flex flex-wrap gap-1.5">
            {members.map((mem) => {
              const on = m.attendees.includes(mem.id)
              return (
                <button
                  key={mem.id}
                  onClick={() => toggleAttendee(mem.id)}
                  className="flex items-center gap-1.5 ps-1 pe-2.5 h-8 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: on ? 'color-mix(in oklch, var(--iris-500) 14%, transparent)' : 'var(--color-surface-muted)',
                    color: on ? 'var(--iris-500)' : 'var(--color-text-muted)',
                    border: `1px solid ${on ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
                  }}
                >
                  <Avatar name={mem.name} src={mem.avatar} size={22} />
                  {mem.name}
                  {on && <Check size={12} />}
                </button>
              )
            })}
            {members.length === 0 && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>أضف أعضاء الفريق من تبويب الفريق أولاً</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Follow-up from previous meeting */}
          {prev && (prev.actionItems.length > 0 || (prev.recommendations ?? []).length > 0) && (
            <SectionCard
              icon={<History size={15} />}
              title={`متابعة الاجتماع السابق — ${formatDateShort(prev.date + 'T00:00:00Z')}`}
              extra={hasPrevPending && (
                <button
                  onClick={carryOver}
                  className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors"
                  style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                  title="نسخ بنود العمل غير المنجزة إلى هذا الاجتماع"
                >
                  <CornerDownLeft size={11} /> ترحيل بنود العمل ({prevPendingItems.length})
                </button>
              )}
            >
              {/* Action items */}
              {prev.actionItems.length > 0 && (
                <div className="mb-3">
                  <p className="axis-label mb-1.5">بنود العمل</p>
                  <div className="space-y-1">
                    {prev.actionItems.map((a) => (
                      <PrevRow key={a.id} text={a.title} assignee={memberName[a.assigneeId ?? '']} done={a.done} />
                    ))}
                  </div>
                </div>
              )}
              {/* Recommendations */}
              {(prev.recommendations ?? []).length > 0 && (
                <div>
                  <p className="axis-label mb-1.5">التوصيات</p>
                  <div className="space-y-1">
                    {(prev.recommendations ?? []).map((r) => (
                      <PrevRow key={r.id} text={r.text} assignee={memberName[r.assigneeId ?? '']} done={r.done} dueDate={r.dueDate} />
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Agenda */}
          <SectionCard icon={<ClipboardList size={15} />} title="الأجندة">
            <AgendaEditor items={m.agenda} onChange={(agenda) => trackSave({ agenda })} />
          </SectionCard>

          {/* Minutes — narrative */}
          <SectionCard icon={<ListTodo size={15} />} title="محضر الاجتماع">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="axis-label mb-1 block">المنجزات</label>
                <textarea rows={4} className={areaCls} style={inputStyle} value={m.achievements ?? ''} onChange={(e) => trackSave({ achievements: e.target.value || undefined })} placeholder="ما الذي أُنجز منذ آخر اجتماع؟" />
              </div>
              <div>
                <label className="axis-label mb-1 block">التحديات والمعالجات</label>
                <textarea rows={4} className={areaCls} style={inputStyle} value={m.challenges ?? ''} onChange={(e) => trackSave({ challenges: e.target.value || undefined })} placeholder="التحديات القائمة وكيف ستُعالج" />
              </div>
            </div>
          </SectionCard>

          {/* Decisions */}
          <SectionCard icon={<Gavel size={15} />} title="القرارات">
            <DecisionEditor items={decisions} onChange={(v) => trackSave({ decisions: v })} members={members} />
          </SectionCard>

          {/* Recommendations */}
          <SectionCard icon={<Lightbulb size={15} />} title="التوصيات والمخرجات">
            <RecommendationEditor items={recommendations} onChange={(v) => trackSave({ recommendations: v })} members={members} />
          </SectionCard>

          {/* Action items */}
          <SectionCard icon={<ListTodo size={15} />} title="بنود العمل">
            <ActionItemEditor
              items={m.actionItems}
              onChange={(v) => trackSave({ actionItems: v })}
              members={members}
              onToggle={toggleItem}
              onConvert={convertToTask}
            />
          </SectionCard>

          {/* Danger zone */}
          <div className="flex justify-start">
            <button onClick={onDelete} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ color: 'var(--danger-500)' }}>
              <Trash2 size={12} /> حذف الاجتماع
            </button>
          </div>
        </div>

        {/* ── Side column: live project snapshot ── */}
        <div className="space-y-4">
          <SectionCard
            icon={<Gauge size={15} />}
            title="تقدم المشروع"
            extra={<IncludeToggle on={incProgress} onToggle={() => setIncProgress((v) => !v)} />}
          >
            <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <span>الإنجاز الكلي</span>
              <span className="axis-num font-bold" style={{ color: 'var(--color-text-primary)' }}>{project.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--color-surface-muted)' }}>
              <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.color }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg py-2" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="axis-num text-sm font-bold" style={{ color: 'var(--success-500)' }}>{doneTasks}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>منجزة</p>
              </div>
              <div className="rounded-lg py-2" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="axis-num text-sm font-bold" style={{ color: 'var(--info-500)' }}>{activeTasks}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>جارية</p>
              </div>
              <div className="rounded-lg py-2" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="axis-num text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{tasks.length}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>الإجمالي</p>
              </div>
            </div>
          </SectionCard>

          {initiatives.length > 0 && (
            <SectionCard
              icon={<Target size={15} />}
              title="المبادرات"
              extra={<IncludeToggle on={incInitiativesOn} onToggle={() => setIncInitiativesOn((v) => !v)} />}
            >
              <div className="space-y-2">
                {initiatives.map(({ sp, pct, clDone, clTotal, spDone, spTotal }) => {
                  const isSelected = selectedInitiatives === null || selectedInitiatives.has(sp.id)
                  return (
                    <div key={sp.id}
                      className="rounded-lg p-2 transition-colors"
                      style={{ background: incInitiativesOn && isSelected ? `color-mix(in oklch, ${project.color} 6%, var(--color-surface-muted))` : 'var(--color-surface-muted)', opacity: incInitiativesOn ? 1 : 0.45 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {incInitiativesOn && (
                          <button
                            onClick={() => toggleInitiativeId(sp.id)}
                            className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                            style={{ background: isSelected ? project.color : 'transparent', border: isSelected ? 'none' : '1.5px solid var(--color-surface-border)' }}
                            title={isSelected ? 'إلغاء التضمين في المحضر' : 'تضمين في المحضر'}
                          >
                            {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                          </button>
                        )}
                        <span className="flex-1 truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{sp.name}</span>
                        <span className="axis-num text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden ms-6" style={{ background: 'var(--color-surface-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: project.color }} />
                      </div>
                      <p className="text-[10px] mt-0.5 ms-6" style={{ color: 'var(--color-text-muted)' }}>
                        {SPRINT_STATUS_LABEL[sp.status]}
                        {clTotal > 0 && <> · معالم <span className="axis-num">{clDone}/{clTotal}</span></>}
                        {spTotal > 0 && <> · مهام <span className="axis-num">{spDone}/{spTotal}</span></>}
                      </p>
                    </div>
                  )
                })}
              </div>
              {incInitiativesOn && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {selectedInitiatives === null
                    ? `جميع المبادرات (${initiatives.length}) مضمّنة في المحضر`
                    : selectedInitiatives.size === 0
                    ? 'لم تُختر أي مبادرة'
                    : `${selectedInitiatives.size} من ${initiatives.length} مبادرة مضمّنة`}
                </p>
              )}
            </SectionCard>
          )}

          {finance.length > 0 && (
            <SectionCard
              icon={<Wallet size={15} />}
              title="المالية"
              extra={<IncludeToggle on={incFinance} onToggle={() => setIncFinance((v) => !v)} />}
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>الإيرادات</span><span className="axis-num font-bold" style={{ color: 'var(--success-500)' }}>{income.toLocaleString('en-US')} {currency}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>المصروفات</span><span className="axis-num font-bold" style={{ color: 'var(--danger-500)' }}>{expense.toLocaleString('en-US')} {currency}</span></div>
                <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid var(--color-surface-border)' }}><span style={{ color: 'var(--color-text-muted)' }}>الصافي</span><span className="axis-num font-bold" style={{ color: income - expense >= 0 ? 'var(--iris-500)' : 'var(--danger-500)' }}>{(income - expense).toLocaleString('en-US')} {currency}</span></div>
              </div>
            </SectionCard>
          )}

          <p className="text-[11px] leading-relaxed px-1" style={{ color: 'var(--color-text-muted)' }}>
            فعّل «تضمين» على أي بطاقة لإدراجها في المحضر المُصدَّر · «تصدير الأجندة» يرسل بنود الجلسة للفريق قبل الاجتماع
          </p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════ Meeting document export (HTML → window.print) ════════════════════
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function nl2li(s: string): string {
  return s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join('')
}
function fmtDate(d?: string): string {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d + 'T00:00:00Z'))
  } catch { return d }
}

interface MinutesSnapshot {
  progress?: { progress: number; doneTasks: number; activeTasks: number; totalTasks: number }
  initiatives?: { sp: Sprint; pct: number; clDone: number; clTotal: number; spDone: number; spTotal: number }[]
  finance?: { income: number; expense: number; currency: string }
}

function buildMeetingHTML({ mode, project, meeting: m, members, memberName, prevMeeting, snapshot }: {
  mode: 'agenda' | 'minutes'
  project: Project
  meeting: Meeting
  members: TeamMember[]
  memberName: Record<string, string>
  prevMeeting?: Meeting
  snapshot: MinutesSnapshot
}): string {
  const color = project.color
  const dateLabel = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(m.date + 'T00:00:00Z'))
  const memberRole: Record<string, string> = Object.fromEntries(members.map((x) => [x.id, x.role]))
  const isAgenda = mode === 'agenda'
  const docKind = isAgenda ? 'أجندة اجتماع' : 'محضر اجتماع'
  const meetKind = kindText(m)

  const attendeesHtml = m.attendees
    .filter((id) => memberName[id])
    .map((id) => `<span class="att"><b>${esc(memberName[id])}</b>${memberRole[id] ? ` — ${esc(memberRole[id])}` : ''}</span>`)
    .join('')

  const agendaHtml = m.agenda.filter((a) => a.text.trim()).length
    ? `<div class="sec"><h2>الأجندة</h2><ol>${m.agenda.filter((a) => a.text.trim()).map((a) => `<li>${esc(a.text)}</li>`).join('')}</ol></div>`
    : ''

  const prevItemsHtml = prevMeeting && prevMeeting.actionItems.length
    ? `<h3 style="font-size:13px;font-weight:700;margin:8px 0 4px;color:#334155">بنود العمل</h3>
       <table><thead><tr><th>البند</th><th>المسؤول</th><th>الموعد</th><th>الحالة</th></tr></thead><tbody>
       ${prevMeeting.actionItems.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.assigneeId && memberName[a.assigneeId] ? esc(memberName[a.assigneeId]) : '—'}</td><td class="num">${fmtDate(a.dueDate)}</td><td><span class="pill ${a.done ? 'ok' : 'wait'}">${a.done ? 'منجز' : 'معلق'}</span></td></tr>`).join('')}
       </tbody></table>` : ''
  const prevRecsHtml = prevMeeting && (prevMeeting.recommendations ?? []).length
    ? `<h3 style="font-size:13px;font-weight:700;margin:10px 0 4px;color:#334155">التوصيات</h3>
       <table><thead><tr><th>التوصية</th><th>المسؤول</th><th>الموعد</th><th>الحالة</th></tr></thead><tbody>
       ${(prevMeeting.recommendations ?? []).map((r) => `<tr><td>${esc(r.text)}</td><td>${r.assigneeId && memberName[r.assigneeId] ? esc(memberName[r.assigneeId]) : '—'}</td><td class="num">${fmtDate(r.dueDate)}</td><td><span class="pill ${r.done ? 'ok' : 'wait'}">${r.done ? 'منجز' : 'معلق'}</span></td></tr>`).join('')}
       </tbody></table>` : ''
  const prevHtml = (prevItemsHtml || prevRecsHtml)
    ? `<div class="sec"><h2>متابعة الاجتماع السابق</h2>${prevItemsHtml}${prevRecsHtml}</div>` : ''

  // ── Agenda document: lightweight, pre-meeting ──
  if (isAgenda) {
    const body = `
${attendeesHtml ? `<div class="sec"><h2>الحضور</h2>${attendeesHtml}</div>` : ''}
${agendaHtml || '<div class="sec"><p style="color:#64748b">لم تُضف بنود للأجندة بعد.</p></div>'}
${prevHtml}
<div class="note">هذه أجندة للاطلاع والتحضير قبل انعقاد الاجتماع.</div>`
    return wrapDoc({ color, title: `${docKind} — ${m.title}`, project, m, dateLabel, meetKind, body })
  }

  // ── Minutes document: full ──
  const minuteSec = (title: string, bodyText?: string) =>
    bodyText ? `<div class="sec"><h2>${title}</h2><ul>${nl2li(bodyText)}</ul></div>` : ''

  const decisions = (m.decisions ?? []).filter((d) => d.text.trim())
  const decisionsHtml = decisions.length
    ? `<div class="sec"><h2>القرارات</h2>
       <table><thead><tr><th>القرار</th><th>المسؤول</th><th>الموعد</th></tr></thead><tbody>
       ${decisions.map((d) => `<tr><td>${esc(d.text)}</td><td>${d.ownerId && memberName[d.ownerId] ? esc(memberName[d.ownerId]) : '—'}</td><td class="num">${fmtDate(d.dueDate)}</td></tr>`).join('')}
       </tbody></table></div>`
    : ''

  const recs = (m.recommendations ?? []).filter((r) => r.text.trim())
  const recsHtml = recs.length
    ? `<div class="sec"><h2>التوصيات والمخرجات</h2>
       <table><thead><tr><th>التوصية</th><th>المسؤول</th><th>الموعد</th><th>الحالة</th></tr></thead><tbody>
       ${recs.map((r) => `<tr><td>${esc(r.text)}</td><td>${r.assigneeId && memberName[r.assigneeId] ? esc(memberName[r.assigneeId]) : '—'}</td><td class="num">${fmtDate(r.dueDate)}</td><td><span class="pill ${r.done ? 'ok' : 'wait'}">${r.done ? 'منجز' : 'قيد المتابعة'}</span></td></tr>`).join('')}
       </tbody></table></div>`
    : ''

  const items = m.actionItems.filter((a) => a.title.trim())
  const itemsHtml = items.length
    ? `<div class="sec"><h2>بنود العمل</h2>
       <table><thead><tr><th>البند</th><th>المسؤول</th><th>الموعد</th><th>الحالة</th></tr></thead><tbody>
       ${items.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.assigneeId && memberName[a.assigneeId] ? esc(memberName[a.assigneeId]) : '—'}</td><td class="num">${fmtDate(a.dueDate)}</td><td><span class="pill ${a.done ? 'ok' : 'wait'}">${a.done ? 'منجز' : 'قيد المتابعة'}</span></td></tr>`).join('')}
       </tbody></table></div>`
    : ''

  let snapHtml = ''
  if (snapshot.progress || snapshot.initiatives?.length || snapshot.finance) {
    snapHtml += `<div class="sec"><h2>ملخص حالة المشروع</h2>`
    if (snapshot.progress) {
      const p = snapshot.progress
      snapHtml += `<div class="snap"><b>الإنجاز الكلي:</b> <span class="num">${p.progress}%</span> · المهام: <span class="num">${p.doneTasks}</span> منجزة، <span class="num">${p.activeTasks}</span> جارية من أصل <span class="num">${p.totalTasks}</span></div>`
    }
    if (snapshot.initiatives?.length) {
      snapHtml += `<table><thead><tr><th>المبادرة</th><th>الحالة</th><th>المعالم</th><th>المهام</th><th>التقدم</th></tr></thead><tbody>`
      for (const it of snapshot.initiatives) {
        snapHtml += `<tr><td>${esc(it.sp.name)}</td><td>${SPRINT_STATUS_LABEL[it.sp.status]}</td><td class="num">${it.clTotal ? `${it.clDone}/${it.clTotal}` : '—'}</td><td class="num">${it.spTotal ? `${it.spDone}/${it.spTotal}` : '—'}</td><td><div class="bar"><div class="fill" style="width:${it.pct}%"></div></div><span class="num pct">${it.pct}%</span></td></tr>`
      }
      snapHtml += `</tbody></table>`
    }
    if (snapshot.finance) {
      const f = snapshot.finance
      snapHtml += `<div class="snap"><b>المالية:</b> إيرادات <span class="num good">${f.income.toLocaleString('en-US')}</span> · مصروفات <span class="num bad">${f.expense.toLocaleString('en-US')}</span> · الصافي <span class="num">${(f.income - f.expense).toLocaleString('en-US')} ${esc(f.currency)}</span></div>`
    }
    snapHtml += `</div>`
  }

  const body = `
${attendeesHtml ? `<div class="sec"><h2>الحضور</h2>${attendeesHtml}</div>` : ''}
${agendaHtml}
${prevHtml}
${minuteSec('المنجزات', m.achievements)}
${minuteSec('التحديات والمعالجات', m.challenges)}
${decisionsHtml}
${recsHtml}
${itemsHtml}
${snapHtml}`
  return wrapDoc({ color, title: `${docKind} — ${m.title}`, project, m, dateLabel, meetKind, body })
}

function wrapDoc({ color, title, project, m, dateLabel, meetKind, body }: {
  color: string; title: string; project: Project; m: Meeting; dateLabel: string; meetKind?: string; body: string
}): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:28px 36px;direction:rtl;font-size:13px;line-height:1.7}
.print-btn{padding:9px 22px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:18px}
@media print{.print-btn{display:none}}
.head{border-inline-start:4px solid ${color};padding-inline-start:14px;margin-bottom:20px}
.head .proj{font-size:12px;color:#64748b;font-weight:600}
h1{font-size:20px;font-weight:700;margin:2px 0}
.meta{font-size:12px;color:#475569}
.sec{margin-bottom:18px}
h2{font-size:14px;font-weight:700;color:${color};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
ul,ol{padding-inline-start:20px}
li{margin-bottom:3px}
.att{display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:99px;padding:2px 12px;margin:0 0 6px 6px;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f1f5f9;text-align:right;padding:6px 10px;font-weight:700;border:1px solid #e2e8f0}
td{padding:6px 10px;border:1px solid #e2e8f0;vertical-align:middle}
.pill{display:inline-block;border-radius:99px;padding:1px 10px;font-size:11px;font-weight:700}
.pill.ok{background:#dcfce7;color:#15803d}
.pill.wait{background:#fef3c7;color:#b45309}
.num{font-variant-numeric:tabular-nums}
.good{color:#15803d}.bad{color:#b91c1c}
.snap{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;margin-bottom:8px}
.bar{display:inline-block;width:70px;height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;vertical-align:middle;margin-inline-end:6px}
.fill{height:100%;background:${color};border-radius:99px}
.pct{font-size:11px}
.note{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:8px 12px;font-size:12px;color:#64748b}
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<div class="head">
  <p class="proj">${esc(project.name)} — ${esc(title.split('—')[0].trim())}</p>
  <h1>${esc(m.title)}</h1>
  <p class="meta">${dateLabel}${m.startTime ? ` · <span class="num">${m.startTime}${m.endTime ? `–${m.endTime}` : ''}</span>` : ''}${meetKind ? ` · ${esc(meetKind)}` : ''} · الحالة: ${STATUS_LABEL[m.status]}</p>
</div>
${body}
<div class="footer"><span>أُعدّ عبر منصة محور</span><span class="num">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</span></div>
</body>
</html>`
}
