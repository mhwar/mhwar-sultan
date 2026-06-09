'use client'
import { useMemo, useState } from 'react'
import {
  Plus, Trash2, Check, CalendarClock, Users2, ListTodo, ArrowUpRight, ClipboardList,
  Sparkles, ArrowRight, Printer, History, Gauge, Target, Wallet, CornerDownLeft,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Meeting, MeetingStatus, MeetingKind, MeetingActionItem, TeamMember, Sprint } from '@/types'
import { useMeetingStore, useTeamStore, useTaskStore, useSprintStore, useFinanceStore } from '@/store/store'
import { formatDateShort, formatDateAr, generateId } from '@/lib/utils'

const STATUS_LABEL: Record<MeetingStatus, string> = { upcoming: 'قادم', done: 'منعقد', cancelled: 'ملغي' }
const STATUS_VAR: Record<MeetingStatus, string> = {
  upcoming: 'var(--info-500)', done: 'var(--success-500)', cancelled: 'var(--danger-500)',
}
const KIND_LABEL: Record<MeetingKind, string> = { weekly: 'متابعة أسبوعية', review: 'مراجعة', external: 'اجتماع خارجي' }

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
        memberName={memberName}
        onChange={(d) => updateMeeting(open.id, d)}
        onDelete={() => { deleteMeeting(open.id); setOpenId(null) }}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const Section = ({ title, list }: { title: string; list: Meeting[] }) =>
    list.length === 0 ? null : (
      <div className="space-y-2">
        <p className="axis-label">{title}</p>
        {list.map((m) => (
          <MeetingRow key={m.id} m={m} memberName={memberName} onOpen={() => setOpenId(m.id)} />
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

// ════════════════════ Full meeting page ════════════════════
function MeetingPage({ project, meeting: m, meetings, members, memberName, onChange, onDelete, onBack }: {
  project: Project
  meeting: Meeting
  meetings: Meeting[]
  members: TeamMember[]
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

  const [agendaText, setAgendaText] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemAssignee, setItemAssignee] = useState('')
  // Which live blocks get embedded in the exported minutes
  const [incProgress, setIncProgress] = useState(true)
  const [incInitiatives, setIncInitiatives] = useState(true)
  const [incFinance, setIncFinance] = useState(false)

  // ── Previous meeting (for follow-up) ──
  const prev = useMemo(() => {
    const before = meetings
      .filter((x) => x.id !== m.id && (x.date < m.date || (x.date === m.date && x.createdAt < m.createdAt)))
      .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    return before[before.length - 1]
  }, [meetings, m.id, m.date, m.createdAt])

  const prevPending = prev?.actionItems.filter((a) => !a.done) ?? []
  const carryOver = () => {
    if (!prev || prevPending.length === 0) return
    const existing = new Set(m.actionItems.map((a) => a.title))
    const carried = prevPending
      .filter((a) => !existing.has(a.title))
      .map((a) => ({ id: generateId(), title: a.title, assigneeId: a.assigneeId, done: false, taskId: a.taskId }))
    if (carried.length) onChange({ actionItems: [...m.actionItems, ...carried] })
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
    if (a.taskId) updateTask(a.taskId, { status: !a.done ? 'done' : 'todo' })
  }

  const convertToTask = (a: MeetingActionItem) => {
    if (a.taskId) return
    const taskId = addTask({
      projectId: pid, title: a.title, assigneeId: a.assigneeId,
      status: a.done ? 'done' : 'todo', priority: 'medium',
    })
    patchItem(a.id, { taskId })
  }

  const addAgenda = () => {
    const t = agendaText.trim()
    if (!t) return
    onChange({ agenda: [...m.agenda, { id: generateId(), text: t }] })
    setAgendaText('')
  }

  const toggleAttendee = (id: string) =>
    onChange({ attendees: m.attendees.includes(id) ? m.attendees.filter((a) => a !== id) : [...m.attendees, id] })

  // ── Export minutes ──
  const exportMinutes = () => {
    const html = buildMinutesHTML({
      project, meeting: m, members, memberName,
      prevMeeting: prev,
      snapshot: {
        progress: incProgress ? { progress: project.progress, doneTasks, activeTasks, totalTasks: tasks.length } : undefined,
        initiatives: incInitiatives ? initiatives : undefined,
        finance: incFinance && finance.length > 0 ? { income, expense, currency } : undefined,
      },
    })
    const w = window.open('', '_blank', 'width=900,height=800,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  const SectionCard = ({ icon, title, children, extra }: { icon: React.ReactNode; title: string; children: React.ReactNode; extra?: React.ReactNode }) => (
    <div className="axis-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <span style={{ color: 'var(--iris-500)' }}>{icon}</span> {title}
        </h3>
        {extra}
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="axis-card p-4 md:p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-white/5"
            style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
            aria-label="عودة لقائمة الاجتماعات"
          >
            <ArrowRight size={15} />
          </button>
          <div className="flex-1 min-w-[220px]">
            <input
              className="w-full bg-transparent outline-none text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
              value={m.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {formatDateAr(m.date + 'T00:00:00Z')}
              {m.startTime && <> · <span className="axis-num">{m.startTime}{m.endTime ? `–${m.endTime}` : ''}</span></>}
              {m.kind && <> · {KIND_LABEL[m.kind]}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportMinutes}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold"
              style={{ background: 'var(--iris-500)', color: '#fff' }}
            >
              <Printer size={13} /> تصدير المحضر
            </button>
          </div>
        </div>

        {/* Schedule + status row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
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
        <div className="mt-4">
          <label className="axis-label mb-1.5 block">الحضور — يظهرون في المحضر المُصدَّر</label>
          <div className="flex flex-wrap gap-1.5">
            {members.map((mem) => {
              const on = m.attendees.includes(mem.id)
              return (
                <button
                  key={mem.id}
                  onClick={() => toggleAttendee(mem.id)}
                  className="flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: on ? 'color-mix(in oklch, var(--iris-500) 14%, transparent)' : 'var(--color-surface-muted)',
                    color: on ? 'var(--iris-500)' : 'var(--color-text-muted)',
                    border: `1px solid ${on ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
                  }}
                >
                  {on && <Check size={11} />} {mem.name}
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
          {prev && prev.actionItems.length > 0 && (
            <SectionCard
              icon={<History size={15} />}
              title={`متابعة بنود الاجتماع السابق — ${formatDateShort(prev.date + 'T00:00:00Z')}`}
              extra={prevPending.length > 0 && (
                <button
                  onClick={carryOver}
                  className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors"
                  style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                  title="نسخ البنود غير المنجزة إلى بنود هذا الاجتماع"
                >
                  <CornerDownLeft size={11} /> ترحيل غير المنجز ({prevPending.length})
                </button>
              )}
            >
              <div className="space-y-1">
                {prev.actionItems.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-muted)' }}>
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: a.done ? 'var(--success-500)' : 'transparent', border: a.done ? 'none' : '1.5px solid var(--color-surface-border)' }}
                    >
                      {a.done && <Check size={11} color="#fff" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--color-text-primary)', opacity: a.done ? 0.55 : 1, textDecoration: a.done ? 'line-through' : 'none' }}>
                      {a.title}
                    </span>
                    {a.assigneeId && memberName[a.assigneeId] && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{memberName[a.assigneeId]}</span>
                    )}
                    <span className="shrink-0 px-1.5 h-5 rounded text-[10px] font-semibold flex items-center" style={{ background: `color-mix(in oklch, ${a.done ? 'var(--success-500)' : 'var(--warning-500)'} 14%, transparent)`, color: a.done ? 'var(--success-500)' : 'var(--warning-500)' }}>
                      {a.done ? 'منجز' : 'معلق'}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Agenda */}
          <SectionCard icon={<ClipboardList size={15} />} title="الأجندة">
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
            <div className="flex items-center gap-2 mt-2">
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
          </SectionCard>

          {/* Minutes */}
          <SectionCard icon={<ListTodo size={15} />} title="محضر الاجتماع">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div>
                <label className="axis-label mb-1 block">التوصيات والمخرجات</label>
                <textarea rows={4} className={areaCls} style={inputStyle} value={m.recommendations ?? ''} onChange={(e) => onChange({ recommendations: e.target.value || undefined })} placeholder="توصيات الجلسة ومخرجاتها النهائية" />
              </div>
            </div>
          </SectionCard>

          {/* Action items */}
          <SectionCard icon={<ListTodo size={15} />} title="بنود العمل">
            <div className="space-y-1">
              {m.actionItems.map((a) => (
                <div key={a.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-muted)' }}>
                  <button
                    onClick={() => toggleItem(a)}
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: a.done ? 'var(--success-500)' : 'transparent', border: a.done ? 'none' : '1.5px solid var(--color-surface-border)' }}
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
            <div className="flex items-center gap-2 mt-2">
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
              extra={<IncludeToggle on={incInitiatives} onToggle={() => setIncInitiatives((v) => !v)} />}
            >
              <div className="space-y-2.5">
                {initiatives.map(({ sp, pct, clDone, clTotal, spDone, spTotal }) => (
                  <div key={sp.id}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{sp.name}</span>
                      <span className="axis-num shrink-0" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: project.color }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {SPRINT_STATUS_LABEL[sp.status]}
                      {clTotal > 0 && <> · معالم <span className="axis-num">{clDone}/{clTotal}</span></>}
                      {spTotal > 0 && <> · مهام <span className="axis-num">{spDone}/{spTotal}</span></>}
                    </p>
                  </div>
                ))}
              </div>
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
            فعّل «تضمين» على أي بطاقة لإدراجها في المحضر المُصدَّر وإرساله للفريق
          </p>
        </div>
      </div>
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

// ════════════════════ Minutes export (HTML → window.print) ════════════════════
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function nl2li(s: string): string {
  return s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join('')
}

interface MinutesSnapshot {
  progress?: { progress: number; doneTasks: number; activeTasks: number; totalTasks: number }
  initiatives?: { sp: Sprint; pct: number; clDone: number; clTotal: number; spDone: number; spTotal: number }[]
  finance?: { income: number; expense: number; currency: string }
}

function buildMinutesHTML({ project, meeting: m, members, memberName, prevMeeting, snapshot }: {
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

  const attendeesHtml = m.attendees
    .filter((id) => memberName[id])
    .map((id) => `<span class="att"><b>${esc(memberName[id])}</b>${memberRole[id] ? ` — ${esc(memberRole[id])}` : ''}</span>`)
    .join('')

  const agendaHtml = m.agenda.length
    ? `<div class="sec"><h2>الأجندة</h2><ol>${m.agenda.map((a) => `<li>${esc(a.text)}</li>`).join('')}</ol></div>`
    : ''

  const prevHtml = prevMeeting && prevMeeting.actionItems.length
    ? `<div class="sec"><h2>متابعة بنود الاجتماع السابق</h2>
       <table><thead><tr><th>البند</th><th>المسؤول</th><th>الحالة</th></tr></thead><tbody>
       ${prevMeeting.actionItems.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.assigneeId && memberName[a.assigneeId] ? esc(memberName[a.assigneeId]) : '—'}</td><td><span class="pill ${a.done ? 'ok' : 'wait'}">${a.done ? 'منجز' : 'معلق'}</span></td></tr>`).join('')}
       </tbody></table></div>`
    : ''

  const minuteSec = (title: string, body?: string) =>
    body ? `<div class="sec"><h2>${title}</h2><ul>${nl2li(body)}</ul></div>` : ''

  const itemsHtml = m.actionItems.length
    ? `<div class="sec"><h2>بنود العمل</h2>
       <table><thead><tr><th>البند</th><th>المسؤول</th><th>الحالة</th></tr></thead><tbody>
       ${m.actionItems.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.assigneeId && memberName[a.assigneeId] ? esc(memberName[a.assigneeId]) : '—'}</td><td><span class="pill ${a.done ? 'ok' : 'wait'}">${a.done ? 'منجز' : 'قيد المتابعة'}</span></td></tr>`).join('')}
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

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>محضر اجتماع — ${esc(m.title)}</title>
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
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<div class="head">
  <p class="proj">${esc(project.name)} — محضر اجتماع</p>
  <h1>${esc(m.title)}</h1>
  <p class="meta">${dateLabel}${m.startTime ? ` · <span class="num">${m.startTime}${m.endTime ? `–${m.endTime}` : ''}</span>` : ''}${m.kind ? ` · ${KIND_LABEL[m.kind]}` : ''} · الحالة: ${STATUS_LABEL[m.status]}</p>
</div>
${attendeesHtml ? `<div class="sec"><h2>الحضور</h2>${attendeesHtml}</div>` : ''}
${agendaHtml}
${prevHtml}
${minuteSec('المنجزات', m.achievements)}
${minuteSec('التحديات والمعالجات', m.challenges)}
${minuteSec('القرارات', m.decisions)}
${minuteSec('التوصيات والمخرجات', m.recommendations)}
${itemsHtml}
${snapHtml}
<div class="footer"><span>أُعدّ هذا المحضر عبر منصة محور</span><span class="num">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</span></div>
</body>
</html>`
}
