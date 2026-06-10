'use client'
import { useMemo, useRef, useState } from 'react'
import {
  Plus, Trash2, Check, CalendarClock, ListTodo, ArrowUpRight, ClipboardList,
  Sparkles, ArrowRight, Printer, History, Gauge, Target, Wallet, CornerDownLeft,
  FileText, Gavel, Lightbulb, Calendar, Save, RefreshCw, ExternalLink, Archive,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type {
  Project, Meeting, MeetingStatus, MeetingKind, MeetingActionItem,
  MeetingAgendaItem, MeetingDecision, MeetingRecommendation, TeamMember, Sprint,
} from '@/types'
import { useMeetingStore, useTeamStore, useTaskStore, useSprintStore, useFinanceStore, useNavStore } from '@/store/store'
import { formatDateShort, formatDateAr, generateId } from '@/lib/utils'
import { Avatar } from '@/lib/avatar'

const STATUS_LABEL: Record<MeetingStatus, string> = {
  preparation: 'إعداد', active: 'منعقد', minuted: 'محضّر', cancelled: 'ملغي',
}
const STATUS_VAR: Record<MeetingStatus, string> = {
  preparation: 'var(--warning-500)',
  active:      'var(--info-500)',
  minuted:     'var(--success-500)',
  cancelled:   'var(--danger-500)',
}
const KIND_LABEL: Record<MeetingKind, string> = {
  weekly: 'متابعة أسبوعية', review: 'مراجعة', external: 'اجتماع خارجي', other: 'نوع آخر',
}
const INTERVAL_LABEL: Record<NonNullable<Meeting['recurringInterval']>, string> = {
  weekly: 'أسبوعي', biweekly: 'كل أسبوعين', monthly: 'شهري',
}
const INTERVAL_DAYS: Record<NonNullable<Meeting['recurringInterval']>, number> = {
  weekly: 7, biweekly: 14, monthly: 30,
}
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

function nextMonday(): string {
  const d = new Date()
  const ahead = (1 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + ahead)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
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
  const [view, setView] = useState<'list' | 'log'>('list')

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])
  const memberName = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members])

  const upcoming = meetings.filter((m) => m.status === 'preparation' || m.status === 'active').sort((a, b) => a.date.localeCompare(b.date))
  const past = meetings.filter((m) => m.status === 'minuted' || m.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date))

  const createBlank = () => {
    const id = addMeeting({
      projectId: pid, title: 'اجتماع جديد', date: nextMonday(),
      attendees: [], agenda: [], actionItems: [], status: 'preparation',
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
      recurring: true,
      recurringInterval: 'weekly',
      status: 'preparation',
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
        onOpenMeeting={setOpenId}
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--color-surface-muted)' }}>
          {(['list', 'log'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold transition-colors"
              style={view === v
                ? { background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-xs)' }
                : { color: 'var(--color-text-muted)' }}
            >
              {v === 'list' ? <><CalendarClock size={13} /> الاجتماعات</> : <><Archive size={13} /> السجل</>}
            </button>
          ))}
        </div>
        {view === 'list' && (
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
        )}
      </div>

      {view === 'log' ? (
        <LogView meetings={meetings} memberName={memberName} onOpenMeeting={setOpenId} />
      ) : meetings.length === 0 ? (
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

// ── Archive / log view ──
function LogView({ meetings, memberName, onOpenMeeting }: {
  meetings: Meeting[]
  memberName: Record<string, string>
  onOpenMeeting: (id: string) => void
}) {
  const minuted = meetings.filter((m) => m.status === 'minuted').sort((a, b) => b.date.localeCompare(a.date))
  const allDecisions = minuted.flatMap((m) => (m.decisions ?? []).map((d) => ({ ...d, meeting: m })))
  const allRecs = minuted.flatMap((m) => (m.recommendations ?? []).map((r) => ({ ...r, meeting: m })))

  const tdStyle = { padding: '6px 10px', borderBottom: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)', fontSize: 13 }
  const thStyle = { ...tdStyle, fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, letterSpacing: '0.05em' }

  const pill = (done: boolean) => (
    <span
      className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-semibold"
      style={{ background: done ? 'color-mix(in oklch, var(--success-500) 14%, transparent)' : 'color-mix(in oklch, var(--warning-500) 14%, transparent)', color: done ? 'var(--success-500)' : 'var(--warning-500)' }}
    >
      {done ? 'منجز' : 'معلق'}
    </span>
  )

  return (
    <div className="space-y-6">
      {/* Decisions */}
      <div>
        <p className="axis-label mb-3 flex items-center gap-2"><Gavel size={13} /> القرارات</p>
        {allDecisions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا قرارات مسجّلة في المحاضر</p>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-surface-border)' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-muted)' }}>
                  <th style={thStyle}>التاريخ</th>
                  <th style={thStyle}>الاجتماع</th>
                  <th style={thStyle}>القرار</th>
                  <th style={thStyle}>المسؤول</th>
                  <th style={thStyle}>الموعد</th>
                </tr>
              </thead>
              <tbody>
                {allDecisions.map((d) => (
                  <tr key={d.id} style={{ background: 'var(--color-surface-raised)' }}>
                    <td style={tdStyle} className="axis-num text-xs whitespace-nowrap">{formatDateShort(d.meeting.date + 'T00:00:00Z')}</td>
                    <td style={tdStyle} className="text-xs">{d.meeting.title}</td>
                    <td style={tdStyle}>{d.text}</td>
                    <td style={tdStyle} className="text-xs whitespace-nowrap">{d.ownerId ? memberName[d.ownerId] ?? '—' : '—'}</td>
                    <td style={tdStyle} className="axis-num text-xs whitespace-nowrap">{d.dueDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <p className="axis-label mb-3 flex items-center gap-2"><Lightbulb size={13} /> التوصيات</p>
        {allRecs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توصيات مسجّلة في المحاضر</p>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-surface-border)' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-muted)' }}>
                  <th style={thStyle}>التاريخ</th>
                  <th style={thStyle}>الاجتماع</th>
                  <th style={thStyle}>التوصية</th>
                  <th style={thStyle}>المسؤول</th>
                  <th style={thStyle}>الموعد</th>
                  <th style={thStyle}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {allRecs.map((r) => (
                  <tr key={r.id} style={{ background: 'var(--color-surface-raised)' }}>
                    <td style={tdStyle} className="axis-num text-xs whitespace-nowrap">{formatDateShort(r.meeting.date + 'T00:00:00Z')}</td>
                    <td style={tdStyle} className="text-xs">{r.meeting.title}</td>
                    <td style={{ ...tdStyle, textDecoration: r.done ? 'line-through' : 'none', opacity: r.done ? 0.6 : 1 }}>{r.text}</td>
                    <td style={tdStyle} className="text-xs whitespace-nowrap">{r.assigneeId ? memberName[r.assigneeId] ?? '—' : '—'}</td>
                    <td style={tdStyle} className="axis-num text-xs whitespace-nowrap">{r.dueDate ?? '—'}</td>
                    <td style={tdStyle}>{pill(r.done)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Minutes list */}
      <div>
        <p className="axis-label mb-3 flex items-center gap-2"><FileText size={13} /> المحاضر</p>
        {minuted.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا محاضر مسجّلة بعد</p>
        ) : (
          <div className="space-y-2">
            {minuted.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
              >
                <span className="axis-num text-xs shrink-0" style={{ color: 'var(--color-text-muted)', minWidth: 72 }}>{formatDateShort(m.date + 'T00:00:00Z')}</span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{m.title}</span>
                {m.decisions?.length ? <span className="axis-num text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{m.decisions.length} قرار</span> : null}
                {m.recommendations?.length ? <span className="axis-num text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{m.recommendations.length} توصية</span> : null}
                <button
                  onClick={() => onOpenMeeting(m.id)}
                  className="shrink-0 flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors"
                  style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                >
                  <ExternalLink size={11} /> عرض المحضر
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{m.title}</p>
          {m.recurring && <RefreshCw size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
        </div>
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

// ── Decisions ──
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

// ── Recommendations ──
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

// ── Action items ──
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
function MeetingPage({ project, meeting: m, meetings, members, memberById, memberName, onChange, onDelete, onBack, onOpenMeeting }: {
  project: Project
  meeting: Meeting
  meetings: Meeting[]
  members: TeamMember[]
  memberById: Record<string, TeamMember>
  memberName: Record<string, string>
  onChange: (d: Partial<Meeting>) => void
  onDelete: () => void
  onBack: () => void
  onOpenMeeting: (id: string) => void
}) {
  const pid = project.id
  const { addTask, updateTask } = useTaskStore()
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === pid)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === pid).sort((a, b) => a.order - b.order)))
  const finance = useFinanceStore(useShallow((s) => s.entries.filter((e) => e.projectId === pid)))
  const storeMeetingAdd = useMeetingStore((s) => s.addMeeting)
  const { navigate } = useNavStore()

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
  const [incInitiativesOn, setIncInitiativesOn] = useState(true)
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string> | null>(null)
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

  // ── Recurring: create next meeting ──
  const createNextMeeting = () => {
    const interval = m.recurringInterval ?? 'weekly'
    const days = INTERVAL_DAYS[interval]
    const nextDate = addDays(m.date, days)
    const newId = storeMeetingAdd({
      projectId: m.projectId,
      title: m.title,
      date: nextDate,
      startTime: m.startTime,
      endTime: m.endTime,
      kind: m.kind,
      kindLabel: m.kindLabel,
      attendees: m.attendees,
      agenda: m.agenda.map((a) => ({ ...a, id: generateId() })),
      actionItems: [],
      recurring: m.recurring,
      recurringInterval: m.recurringInterval,
      status: 'preparation',
    })
    onChange({ nextMeetingId: newId })
    return newId
  }

  const handleStatusChange = (newStatus: MeetingStatus) => {
    trackSave({ status: newStatus })
    if (newStatus === 'minuted' && m.recurring && !m.nextMeetingId) {
      createNextMeeting()
    }
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
    const checklistItems = cl.map((c) => ({ text: c.title, done: c.done }))
    const taskItems = spTasks.map((t) => ({
      title: t.title,
      assignee: t.assigneeId ? memberName[t.assigneeId] : undefined,
      status: t.status === 'done' ? 'منجزة' : t.status === 'in-progress' ? 'جارية' : 'مخطط',
    }))
    return { sp, pct, clDone, clTotal: cl.length, spDone, spTotal: spTasks.length, checklistItems, taskItems }
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

  const exportInitiatives = incInitiativesOn
    ? (selectedInitiatives === null ? initiatives : initiatives.filter((i) => selectedInitiatives.has(i.sp.id)))
    : undefined

  const exportDoc = (mode: 'agenda' | 'minutes') => {
    const html = buildMeetingHTML({
      mode, project, meeting: m, members, memberName,
      prevMeeting: prev,
      snapshot: {
        progress: mode === 'minutes' && incProgress ? { progress: project.progress, doneTasks, activeTasks, totalTasks: tasks.length } : undefined,
        initiatives: exportInitiatives,
        finance: mode === 'minutes' && incFinance && finance.length > 0 ? { income, expense, currency } : undefined,
      },
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
            <select className={inputCls} style={inputStyle} value={m.status} onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}>
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

        {/* Recurring settings */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--color-text-secondary)' }}>
            <button
              role="checkbox"
              aria-checked={m.recurring ?? false}
              onClick={() => trackSave({ recurring: !m.recurring })}
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{ background: m.recurring ? 'var(--iris-500)' : 'transparent', border: m.recurring ? 'none' : '1.5px solid var(--color-surface-border)' }}
            >
              {m.recurring && <Check size={11} color="#fff" strokeWidth={3} />}
            </button>
            <RefreshCw size={13} /> دوري
          </label>
          {m.recurring && (
            <select
              className="h-8 rounded-md px-2 text-sm outline-none"
              style={{ ...inputStyle, width: 'auto' }}
              value={m.recurringInterval ?? 'weekly'}
              onChange={(e) => trackSave({ recurringInterval: e.target.value as Meeting['recurringInterval'] })}
            >
              {(Object.keys(INTERVAL_LABEL) as NonNullable<Meeting['recurringInterval']>[]).map((k) => (
                <option key={k} value={k}>{INTERVAL_LABEL[k]}</option>
              ))}
            </select>
          )}
          {/* Next meeting controls */}
          {m.recurring && !m.nextMeetingId && (
            <button
              onClick={createNextMeeting}
              className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-semibold transition-colors"
              style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
              title="إنشاء الاجتماع التالي يدوياً"
            >
              <Plus size={13} /> إنشاء الاجتماع التالي
            </button>
          )}
          {m.recurring && m.nextMeetingId && (
            <button
              onClick={() => onOpenMeeting(m.nextMeetingId!)}
              className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-semibold transition-colors"
              style={{ background: 'color-mix(in oklch, var(--iris-500) 14%, transparent)', color: 'var(--iris-500)', border: '1px solid color-mix(in oklch, var(--iris-500) 40%, transparent)' }}
            >
              <ExternalLink size={13} /> الانتقال للاجتماع التالي
            </button>
          )}
        </div>

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

          <SectionCard icon={<ClipboardList size={15} />} title="الأجندة">
            <AgendaEditor items={m.agenda} onChange={(agenda) => trackSave({ agenda })} />
          </SectionCard>

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

          <SectionCard icon={<Gavel size={15} />} title="القرارات">
            <DecisionEditor items={decisions} onChange={(v) => trackSave({ decisions: v })} members={members} />
          </SectionCard>

          <SectionCard icon={<Lightbulb size={15} />} title="التوصيات والمخرجات">
            <RecommendationEditor items={recommendations} onChange={(v) => trackSave({ recommendations: v })} members={members} />
          </SectionCard>

          <SectionCard icon={<ListTodo size={15} />} title="بنود العمل">
            <ActionItemEditor
              items={m.actionItems}
              onChange={(v) => trackSave({ actionItems: v })}
              members={members}
              onToggle={toggleItem}
              onConvert={convertToTask}
            />
          </SectionCard>

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
                            title={isSelected ? 'إلغاء التضمين في التصدير' : 'تضمين في التصدير'}
                          >
                            {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                          </button>
                        )}
                        {/* Initiative name — click to navigate to ExecutionTab and open sprint drawer */}
                        <button
                          onClick={() => { navigate('execution', sp.id); onBack() }}
                          className="flex-1 truncate text-xs font-medium text-start hover:underline"
                          style={{ color: 'var(--color-text-primary)' }}
                          title="فتح المبادرة في تبويب التنفيذ"
                        >
                          {sp.name}
                        </button>
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
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>انقر على اسم المبادرة للانتقال لتبويب التنفيذ</p>
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

interface InitiativeSnap {
  sp: Sprint
  pct: number
  clDone: number
  clTotal: number
  spDone: number
  spTotal: number
  checklistItems: { text: string; done: boolean }[]
  taskItems: { title: string; assignee?: string; status: string }[]
}

interface MinutesSnapshot {
  progress?: { progress: number; doneTasks: number; activeTasks: number; totalTasks: number }
  initiatives?: InitiativeSnap[]
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

  if (isAgenda) {
    const agendaAttendees = m.attendees.filter((id) => memberName[id])
    const attendeeLineHtml = agendaAttendees.length
      ? `<div class="sec"><h2>الحضور</h2><p class="att-line">${agendaAttendees.map((id) => esc(memberName[id])).join(' · ')}</p></div>`
      : ''
    let agendaInitHtml = ''
    if (snapshot.initiatives?.length) {
      agendaInitHtml = `<div class="sec"><h2>مسارات العمل</h2><div class="init-list">`
      for (const it of snapshot.initiatives) {
        agendaInitHtml += `<div class="init-card"><div class="init-row"><b class="init-name">${esc(it.sp.name)}</b><span class="pill ${it.sp.status === 'active' ? 'pill-active' : it.sp.status === 'completed' ? 'ok' : 'wait'}">${SPRINT_STATUS_LABEL[it.sp.status]}</span><span class="bar-grp"><span class="bar"><span class="fill" style="width:${it.pct}%"></span></span><span class="num pct">${it.pct}%</span></span></div>${it.checklistItems.length ? `<ul class="cl">${it.checklistItems.map((c) => `<li class="${c.done ? 'done' : ''}">${c.done ? '✓' : '○'} ${esc(c.text)}</li>`).join('')}</ul>` : ''}</div>`
      }
      agendaInitHtml += `</div></div>`
    }
    const body = `
${attendeeLineHtml}
${agendaHtml || '<div class="sec"><p style="color:#64748b">لم تُضف بنود للأجندة بعد.</p></div>'}
${prevHtml}
${agendaInitHtml}
<div class="note">هذه أجندة للاطلاع والتحضير قبل انعقاد الاجتماع.</div>`
    return wrapDoc({ color, title: `${docKind} — ${m.title}`, isAgenda, project, m, dateLabel, meetKind, body })
  }

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

  const attendeeNames = m.attendees.filter((id) => memberName[id])
  const minutesAttendeeHtml = attendeeNames.length
    ? `<div class="sec"><h2>الحضور</h2><p class="att-line">${attendeeNames.map((id) => esc(memberName[id])).join(' · ')}</p></div>`
    : ''

  let snapHtml = ''
  if (snapshot.progress || snapshot.initiatives?.length || snapshot.finance) {
    snapHtml += `<div class="sec"><h2>ملخص حالة المشروع</h2>`
    if (snapshot.progress) {
      const p = snapshot.progress
      snapHtml += `<div class="snap"><b>الإنجاز الكلي:</b> <span class="num">${p.progress}%</span> · المهام: <span class="num">${p.doneTasks}</span> منجزة، <span class="num">${p.activeTasks}</span> جارية من أصل <span class="num">${p.totalTasks}</span></div>`
    }
    if (snapshot.initiatives?.length) {
      snapHtml += `<div class="init-list">`
      for (const it of snapshot.initiatives) {
        snapHtml += `<div class="init-card"><div class="init-row"><b class="init-name">${esc(it.sp.name)}</b><span class="pill ${it.sp.status === 'active' ? 'pill-active' : it.sp.status === 'completed' ? 'ok' : 'wait'}">${SPRINT_STATUS_LABEL[it.sp.status]}</span><span class="bar-grp"><span class="bar"><span class="fill" style="width:${it.pct}%"></span></span><span class="num pct">${it.pct}%</span></span>${it.clTotal ? `<span class="num dim">معالم ${it.clDone}/${it.clTotal}</span>` : ''}${it.spTotal ? `<span class="num dim">مهام ${it.spDone}/${it.spTotal}</span>` : ''}</div>${it.checklistItems.length ? `<ul class="cl">${it.checklistItems.map((c) => `<li class="${c.done ? 'done' : ''}">${c.done ? '✓' : '○'} ${esc(c.text)}</li>`).join('')}</ul>` : ''}${it.taskItems.length ? `<table class="inner"><thead><tr><th>المهمة</th><th>المسؤول</th><th>الحالة</th></tr></thead><tbody>${it.taskItems.map((t) => `<tr><td>${esc(t.title)}</td><td>${esc(t.assignee ?? '—')}</td><td>${esc(t.status)}</td></tr>`).join('')}</tbody></table>` : ''}</div>`
      }
      snapHtml += `</div>`
    }
    if (snapshot.finance) {
      const f = snapshot.finance
      snapHtml += `<div class="snap"><b>المالية:</b> إيرادات <span class="num good">${f.income.toLocaleString('en-US')}</span> · مصروفات <span class="num bad">${f.expense.toLocaleString('en-US')}</span> · الصافي <span class="num">${(f.income - f.expense).toLocaleString('en-US')} ${esc(f.currency)}</span></div>`
    }
    snapHtml += `</div>`
  }

  const body = `
${minutesAttendeeHtml}
${agendaHtml}
${prevHtml}
${minuteSec('المنجزات', m.achievements)}
${minuteSec('التحديات والمعالجات', m.challenges)}
${decisionsHtml}
${recsHtml}
${itemsHtml}
${snapHtml}`
  return wrapDoc({ color, title: `${docKind} — ${m.title}`, isAgenda, project, m, dateLabel, meetKind, body })
}

function wrapDoc({ color, title, isAgenda, project, m, dateLabel, meetKind, body }: {
  color: string; title: string; isAgenda: boolean; project: Project; m: Meeting; dateLabel: string; meetKind?: string; body: string
}): string {
  const logoBlock = project.logo
    ? `<img src="${project.logo}" alt="${esc(project.name)}" class="lh-logo">`
    : `<span class="lh-icon" style="background:color-mix(in srgb,${color} 15%,#fff);color:${color}">${esc(project.name.slice(0, 2))}</span>`
  const docBadgeStyle = isAgenda
    ? 'background:#eff6ff;color:#1e40af'
    : 'background:#f0fdf4;color:#15803d'
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:28px 36px;direction:rtl;font-size:13px;line-height:1.7}
.print-btn{padding:8px 20px;background:${color};color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:16px}
@media print{.print-btn{display:none}}
/* ── Letterhead ── */
.lh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.lh-brand{display:flex;align-items:center;gap:10px}
.lh-logo{height:40px;width:auto;object-fit:contain}
.lh-icon{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;font-size:15px;font-weight:700}
.lh-meta{display:flex;flex-direction:column;gap:1px}
.lh-name{font-size:14px;font-weight:700;color:#0f172a}
.lh-sub{font-size:10px;color:#94a3b8;font-weight:400}
.lh-badge{font-size:11px;font-weight:700;padding:3px 12px;border-radius:99px;${docBadgeStyle}}
.lh-rule{border:none;border-top:2px solid ${color};margin:10px 0 14px}
/* ── Doc title ── */
.doc-head{margin-bottom:18px}
.doc-head h1{font-size:18px;font-weight:700;margin-bottom:3px}
.doc-head .meta{font-size:12px;color:#475569}
/* ── Sections ── */
.sec{margin-bottom:16px}
h2{font-size:13px;font-weight:700;color:${color};margin-bottom:7px;padding-bottom:3px;border-bottom:1px solid #e2e8f0}
ul,ol{padding-inline-start:20px}
li{margin-bottom:3px}
.att-line{font-size:12px;color:#334155}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f8fafc;text-align:right;padding:5px 10px;font-weight:700;border:1px solid #e2e8f0;font-size:11px}
td{padding:5px 10px;border:1px solid #e2e8f0;vertical-align:middle}
.inner{margin-top:6px;font-size:11px}
.inner th{font-size:10px;padding:3px 7px;background:#f1f5f9}
.inner td{padding:3px 7px}
.cl{padding-inline-start:4px;font-size:11px;list-style:none;margin-top:5px}
.cl li{margin-bottom:2px;color:#334155}
.cl li.done{color:#9ca3af;text-decoration:line-through}
.pill{display:inline-block;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:700}
.pill.ok{background:#dcfce7;color:#15803d}
.pill.wait{background:#fef3c7;color:#b45309}
.pill.pill-active{background:#dbeafe;color:#1d4ed8}
.num{font-variant-numeric:tabular-nums}
.dim{font-size:10px;color:#94a3b8}
.good{color:#15803d}.bad{color:#b91c1c}
.snap{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:7px 11px;margin-bottom:7px;font-size:12px}
/* ── Initiative cards ── */
.init-list{display:flex;flex-direction:column;gap:8px}
.init-card{border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;background:#fafafa}
.init-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
.init-name{font-size:12px;flex:1;min-width:0}
.bar-grp{display:inline-flex;align-items:center;gap:4px}
.bar{display:inline-block;width:56px;height:5px;background:#e2e8f0;border-radius:99px;overflow:hidden;vertical-align:middle}
.fill{display:block;height:100%;background:${color};border-radius:99px}
.pct{font-size:10px;color:#64748b}
/* ── Footer ── */
.note{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:7px;padding:7px 11px;font-size:11px;color:#64748b;margin-top:4px}
.footer{margin-top:22px;padding-top:9px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<div class="lh">
  <div class="lh-brand">
    ${logoBlock}
    <div class="lh-meta">
      <span class="lh-name">${esc(project.name)}</span>
      <span class="lh-sub">منصة محور</span>
    </div>
  </div>
  <span class="lh-badge">${isAgenda ? 'أجندة اجتماع' : 'محضر اجتماع'}</span>
</div>
<hr class="lh-rule">
<div class="doc-head">
  <h1>${esc(m.title)}</h1>
  <p class="meta">${dateLabel}${m.startTime ? ` · <span class="num">${m.startTime}${m.endTime ? `–${m.endTime}` : ''}</span>` : ''}${meetKind ? ` · ${esc(meetKind)}` : ''} · ${STATUS_LABEL[m.status]}</p>
</div>
${body}
<div class="footer"><span>أُعدّ عبر منصة محور</span><span class="num">${new Date().toLocaleDateString('ar-SA')}</span></div>
</body>
</html>`
}
