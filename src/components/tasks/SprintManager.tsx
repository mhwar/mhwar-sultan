'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  X, Plus, Rocket, Trash2, ChevronDown, ChevronUp, Calendar, CheckCircle2, Circle, Target,
  User, ListChecks, MessageSquare, Send, Zap,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore, useProjectStore, useTaskStore, useTeamStore } from '@/store/store'
import type { SprintStatus, Sprint, SprintChecklistItem, SprintUpdate } from '@/types'
import { formatDateAr, timeAgoAr } from '@/lib/utils'

const uid = () => Math.random().toString(36).slice(2, 10)

const STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'مخططة',
  active: 'نشطة',
  completed: 'مكتملة',
}
const STATUS_BG: Record<SprintStatus, string> = {
  planned: 'var(--info-500)',
  active: 'var(--success-500)',
  completed: 'var(--color-text-muted)',
}
const StatusIcon = ({ s }: { s: SprintStatus }) =>
  s === 'completed' ? <CheckCircle2 size={14} /> : s === 'active' ? <Zap size={14} /> : <Circle size={14} />

interface Props { onClose: () => void }

export default function SprintManager({ onClose }: Props) {
  const sprints = useSprintStore(useShallow((s) => s.sprints))
  const { addSprint, updateSprint, deleteSprint } = useSprintStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const tasks = useTaskStore(useShallow((s) => s.tasks))
  const members = useTeamStore(useShallow((s) => s.members))
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  const projName = (pid: string) =>
    pid === 'free' ? 'بلا مشروع' : (projects.find((p) => p.id === pid)?.name ?? pid)
  const projColor = (pid: string) =>
    projects.find((p) => p.id === pid)?.color ?? 'var(--iris-500)'
  const memberName = (id?: string) => (id ? members.find((m) => m.id === id)?.name : undefined)

  const taskStats = useMemo(() => {
    const m = new Map<string, { total: number; done: number; inprog: number }>()
    for (const t of tasks) {
      if (!t.sprintId) continue
      const s = m.get(t.sprintId) ?? { total: 0, done: 0, inprog: 0 }
      s.total++
      if (t.status === 'done') s.done++
      else if (t.status === 'in-progress') s.inprog++
      m.set(t.sprintId, s)
    }
    return m
  }, [tasks])

  const sorted = useMemo(() =>
    [...sprints].sort((a, b) => {
      const order: Record<SprintStatus, number> = { active: 0, planned: 1, completed: 2 }
      return order[a.status] - order[b.status] || a.order - b.order
    }),
    [sprints]
  )

  const totals = useMemo(() => {
    let total = 0, done = 0
    taskStats.forEach((s) => { total += s.total; done += s.done })
    return { total, done }
  }, [taskStats])

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 600 }}>

        {/* ── Header ── */}
        <div className="axis-drawer__head">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in oklch, var(--iris-500) 15%, transparent)' }}
            >
              <Rocket size={17} style={{ color: 'var(--iris-500)' }} />
            </div>
            <div className="min-w-0">
              <p className="axis-drawer__title">إدارة المبادرات</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                جهود كبيرة كتنظيم ملتقى أو مشروع متكامل ·{' '}
                <span className="axis-num">{totals.done}</span>/<span className="axis-num">{totals.total}</span> مهمة منجزة
              </p>
            </div>
          </div>
          <button
            className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0"
            onClick={close}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="axis-drawer__body space-y-3">

          {/* Add button */}
          {!adding && (
            <button
              onClick={() => { setAdding(true); setExpandedId(null) }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'color-mix(in oklch, var(--iris-500) 10%, transparent)',
                color: 'var(--iris-500)',
                border: '1px dashed color-mix(in oklch, var(--iris-500) 40%, transparent)',
              }}
            >
              <Plus size={15} /> مبادرة جديدة
            </button>
          )}

          {/* Add form */}
          {adding && (
            <AddInitiativeForm
              projects={projects}
              onSave={(d) => {
                addSprint(d.projectId || 'free', d.name, {
                  startDate: d.startDate,
                  dueDate: d.dueDate,
                  goal: d.goal,
                  status: d.status,
                })
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {/* Empty state */}
          {sorted.length === 0 && !adding && (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--color-surface-overlay)' }}
              >
                <Rocket size={28} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>لا مبادرات بعد</p>
              <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                أنشئ مبادرة لإدارة جهد كبير — ملتقى أو مشروع متكامل — بمعالم ومسؤول وسجل متابعة
              </p>
            </div>
          )}

          {/* Initiative cards */}
          <div className="space-y-2">
            {sorted.map((sp) => {
              const stats = taskStats.get(sp.id) ?? { total: 0, done: 0, inprog: 0 }
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
              const color = projColor(sp.projectId)
              const isExpanded = expandedId === sp.id
              const checks = sp.checklist ?? []
              const checksDone = checks.filter((c) => c.done).length
              const lead = memberName(sp.lead)
              const lastUpdate = sp.updates?.[0]

              return (
                <div
                  key={sp.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-muted)' }}
                >
                  {/* Project color top bar */}
                  <div style={{ height: 3, background: sp.projectId === 'free' ? 'var(--color-surface-border)' : color }} />

                  <div className="p-3 space-y-2">
                    {/* Top row */}
                    <div className="flex items-start gap-2">
                      <span style={{ color: STATUS_BG[sp.status], marginTop: 2, flexShrink: 0 }}>
                        <StatusIcon s={sp.status} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                          {sp.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {projName(sp.projectId)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_BG[sp.status] + '22', color: STATUS_BG[sp.status] }}
                        >
                          {STATUS_LABELS[sp.status]}
                        </span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sp.id)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: 'var(--color-text-muted)' }}
                          aria-label={isExpanded ? 'طي' : 'إدارة'}
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button
                          onClick={() => { if (confirm(`حذف مبادرة "${sp.name}"؟`)) deleteSprint(sp.id) }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: 'var(--danger-500)' }}
                          aria-label="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Goal (collapsed) */}
                    {sp.goal && !isExpanded && (
                      <p className="text-xs ps-5 pe-8 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {sp.goal}
                      </p>
                    )}

                    {/* Meta chips: lead / dates / checklist (collapsed) */}
                    {!isExpanded && (
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 ps-5">
                        {lead && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <User size={11} /> {lead}
                          </span>
                        )}
                        {(sp.startDate || sp.dueDate) && (
                          <span className="flex items-center gap-1 text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>
                            <Calendar size={11} />
                            {sp.startDate && formatDateAr(sp.startDate)}
                            {sp.startDate && sp.dueDate && ' ← '}
                            {sp.dueDate && formatDateAr(sp.dueDate)}
                          </span>
                        )}
                        {checks.length > 0 && (
                          <span className="flex items-center gap-1 text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>
                            <ListChecks size={11} /> {checksDone}/{checks.length} معلم
                          </span>
                        )}
                        {stats.total > 0 && (
                          <span className="text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>
                            {stats.done}/{stats.total} مهمة
                          </span>
                        )}
                      </div>
                    )}

                    {/* Task progress bar */}
                    {stats.total > 0 && !isExpanded && (
                      <div className="ps-5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-overlay)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    )}

                    {/* Last update preview (collapsed) */}
                    {lastUpdate && !isExpanded && (
                      <div className="ps-5 flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <MessageSquare size={11} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{lastUpdate.text}</span>
                      </div>
                    )}

                    {/* ── Expanded manager ── */}
                    {isExpanded && (
                      <ExpandedEditor
                        sp={sp}
                        color={color}
                        projects={projects}
                        members={members}
                        stats={stats}
                        pct={pct}
                        updateSprint={updateSprint}
                        onDone={() => setExpandedId(null)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════ Expanded editor ════════════════════ */
function ExpandedEditor({
  sp, color, projects, members, stats, pct, updateSprint, onDone,
}: {
  sp: Sprint
  color: string
  projects: { id: string; name: string }[]
  members: { id: string; name: string; projectId: string }[]
  stats: { total: number; done: number; inprog: number }
  pct: number
  updateSprint: (id: string, data: Partial<Sprint>) => void
  onDone: () => void
}) {
  const [newCheck, setNewCheck] = useState('')
  const [newUpdate, setNewUpdate] = useState('')

  const checks = sp.checklist ?? []
  const updates = sp.updates ?? []
  const checksDone = checks.filter((c) => c.done).length
  const checkPct = checks.length > 0 ? Math.round((checksDone / checks.length) * 100) : 0

  // Lead options: same-project members first, then the rest
  const leadOptions = useMemo(() => {
    const same = members.filter((m) => m.projectId === sp.projectId)
    const others = members.filter((m) => m.projectId !== sp.projectId)
    return [...same, ...others]
  }, [members, sp.projectId])

  const setCheck = (list: SprintChecklistItem[]) => updateSprint(sp.id, { checklist: list })
  const addCheck = () => {
    const t = newCheck.trim(); if (!t) return
    setCheck([...checks, { id: uid(), title: t, done: false }]); setNewCheck('')
  }
  const toggleCheck = (id: string) => setCheck(checks.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  const delCheck = (id: string) => setCheck(checks.filter((c) => c.id !== id))

  const setUpdates = (list: SprintUpdate[]) => updateSprint(sp.id, { updates: list })
  const addUpdate = () => {
    const t = newUpdate.trim(); if (!t) return
    setUpdates([{ id: uid(), text: t, createdAt: new Date().toISOString() }, ...updates]); setNewUpdate('')
  }
  const delUpdate = (id: string) => setUpdates(updates.filter((u) => u.id !== id))

  const inputStyle = { background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as const
  const labelCls = 'text-xs font-semibold'
  const labelStyle = { color: 'var(--color-text-muted)' } as const

  return (
    <div className="mt-2 pt-3 border-t space-y-4" style={{ borderColor: 'var(--color-surface-border)' }}>

      {/* Core fields */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls} style={labelStyle}>اسم المبادرة</label>
          <input
            key={sp.id + '-name'} defaultValue={sp.name}
            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== sp.name) updateSprint(sp.id, { name: v }) }}
            className="h-8 rounded-md px-2 text-sm outline-none" style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>الحالة</label>
            <select
              value={sp.status}
              onChange={(e) => updateSprint(sp.id, { status: e.target.value as SprintStatus })}
              className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
            >
              {(Object.entries(STATUS_LABELS) as [SprintStatus, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>المشروع</label>
            <select
              value={sp.projectId === 'free' ? '' : sp.projectId}
              onChange={(e) => updateSprint(sp.id, { projectId: e.target.value || 'free' })}
              className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
            >
              <option value="">بلا مشروع</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Lead */}
        <div className="flex flex-col gap-1">
          <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
            <User size={11} /> المسؤول عن المبادرة
          </label>
          <select
            value={sp.lead ?? ''}
            onChange={(e) => updateSprint(sp.id, { lead: e.target.value || undefined })}
            className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
          >
            <option value="">بلا مسؤول</option>
            {leadOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>تاريخ البداية</label>
            <input
              key={sp.id + '-start'} type="date" dir="ltr"
              defaultValue={sp.startDate ? sp.startDate.slice(0, 10) : ''}
              onBlur={(e) => updateSprint(sp.id, { startDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
              className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>تاريخ الانتهاء</label>
            <input
              key={sp.id + '-due'} type="date" dir="ltr"
              defaultValue={sp.dueDate ? sp.dueDate.slice(0, 10) : ''}
              onBlur={(e) => updateSprint(sp.id, { dueDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
              className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
            <Target size={11} /> الهدف
          </label>
          <input
            key={sp.id + '-goal'} defaultValue={sp.goal ?? ''}
            onBlur={(e) => updateSprint(sp.id, { goal: e.target.value.trim() || undefined })}
            placeholder="ما الذي تحققه هذه المبادرة؟"
            className="h-8 rounded-md px-2 text-sm outline-none" style={inputStyle}
          />
        </div>
      </div>

      {/* Task progress */}
      {stats.total > 0 && (
        <div className="rounded-lg p-2.5 space-y-1.5" style={{ background: 'var(--color-surface-overlay)' }}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>تقدّم المهام المرتبطة</span>
            <span className="axis-num" style={{ color: 'var(--color-text-muted)' }}>{stats.done}/{stats.total} · {pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      )}

      {/* Checklist / milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
            <ListChecks size={12} /> المعالم
          </label>
          {checks.length > 0 && (
            <span className="text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>{checksDone}/{checks.length} · {checkPct}%</span>
          )}
        </div>

        {checks.length > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-overlay)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${checkPct}%`, background: 'var(--success-500)' }} />
          </div>
        )}

        <div className="space-y-1">
          {checks.map((c) => (
            <div key={c.id} className="group/check flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: 'var(--color-surface-overlay)' }}>
              <button onClick={() => toggleCheck(c.id)} className="shrink-0" aria-label={c.done ? 'إلغاء' : 'إنجاز'}>
                {c.done
                  ? <CheckCircle2 size={15} style={{ color: 'var(--success-500)' }} />
                  : <Circle size={15} style={{ color: 'var(--color-text-muted)' }} />}
              </button>
              <span className="flex-1 text-xs" style={{ color: c.done ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: c.done ? 'line-through' : 'none' }}>
                {c.title}
              </span>
              <button onClick={() => delCheck(c.id)} className="opacity-0 group-hover/check:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'var(--danger-500)' }} aria-label="حذف">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={newCheck} onChange={(e) => setNewCheck(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCheck() }}
            placeholder="أضف معلمًا…"
            className="flex-1 h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}
          />
          <button onClick={addCheck} disabled={!newCheck.trim()} className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--iris-500)', color: '#fff' }} aria-label="إضافة معلم">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Follow-up / communication log */}
      <div className="space-y-2">
        <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
          <MessageSquare size={12} /> سجل المتابعة والتواصل
        </label>

        <div className="flex items-start gap-2">
          <textarea
            value={newUpdate} onChange={(e) => setNewUpdate(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addUpdate() }}
            placeholder="سجّل تحديثًا أو ملاحظة متابعة…" rows={2}
            className="flex-1 rounded-md px-2 py-1.5 text-xs outline-none resize-none" style={inputStyle}
          />
          <button onClick={addUpdate} disabled={!newUpdate.trim()} className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--iris-500)', color: '#fff' }} aria-label="إضافة تحديث">
            <Send size={14} />
          </button>
        </div>

        {updates.length > 0 && (
          <div className="space-y-1.5">
            {updates.map((u) => (
              <div key={u.id} className="group/up rounded-md p-2 flex items-start gap-2" style={{ background: 'var(--color-surface-overlay)' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{u.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{timeAgoAr(u.createdAt)}</p>
                </div>
                <button onClick={() => delUpdate(u.id)} className="opacity-0 group-hover/up:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'var(--danger-500)' }} aria-label="حذف">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onDone}
        className="text-xs font-medium px-3 h-7 rounded-md transition-colors hover:bg-white/5"
        style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
      >
        تم
      </button>
    </div>
  )
}

/* ════════════════════ Add form ════════════════════ */
interface FormData {
  name: string
  projectId: string
  startDate: string
  dueDate: string
  goal: string
  status: SprintStatus
}

function AddInitiativeForm({
  projects, onSave, onCancel,
}: {
  projects: { id: string; name: string }[]
  onSave: (d: FormData) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormData>({ name: '', projectId: '', startDate: '', dueDate: '', goal: '', status: 'planned' })
  const set = (v: Partial<FormData>) => setF((p) => ({ ...p, ...v }))
  const toISO = (d: string) => (d ? `${d}T00:00:00Z` : '')
  const inputStyle = { background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as const

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--iris-500)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--iris-500) 12%, transparent)' }}
    >
      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>مبادرة جديدة</p>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>اسم المبادرة *</label>
        <input
          autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })}
          placeholder="مثال: تنظيم ملتقى محور السنوي"
          className="h-9 rounded-lg px-3 text-sm outline-none w-full" style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>المشروع</label>
          <select value={f.projectId} onChange={(e) => set({ projectId: e.target.value })} className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}>
            <option value="">بلا مشروع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الحالة</label>
          <select value={f.status} onChange={(e) => set({ status: e.target.value as SprintStatus })} className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle}>
            <option value="planned">مخططة</option>
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ البداية</label>
          <input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} dir="ltr" className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ الانتهاء</label>
          <input type="date" value={f.dueDate} onChange={(e) => set({ dueDate: e.target.value })} dir="ltr" className="h-8 rounded-md px-2 text-xs outline-none" style={inputStyle} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الهدف (اختياري)</label>
        <input value={f.goal} onChange={(e) => set({ goal: e.target.value })} placeholder="ما الذي تحققه هذه المبادرة؟" className="h-8 rounded-md px-2 text-sm outline-none w-full" style={inputStyle} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          إلغاء
        </button>
        <button
          onClick={() => f.name.trim() && onSave({ ...f, startDate: toISO(f.startDate), dueDate: toISO(f.dueDate) })}
          disabled={!f.name.trim()}
          className="px-4 h-8 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--iris-500)', color: 'white' }}
        >
          إضافة المبادرة
        </button>
      </div>
    </div>
  )
}
