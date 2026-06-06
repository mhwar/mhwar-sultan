'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Trash2, Calendar, Clock, Hash, Flag, CheckCircle2, CircleDashed, Loader, Map, Zap, User, Briefcase, Download, Plus, Tag, Check } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTaskStore, usePlanStore, useSprintStore, useTeamStore, useProjectStore } from '@/store/store'
import type { Task, Project, TaskStatus, TaskPriority, TaskSubtask } from '@/types'
import Segmented from '@/components/ui/Segmented'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import Pill from '@/components/ui/Pill'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_PILL, formatDateAr, hexToRgba } from '@/lib/utils'

const STATUS_OPTS = (['todo', 'in-progress', 'done'] as TaskStatus[]).map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))
const PRIORITY_OPTS = (['low', 'medium', 'high'] as TaskPriority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))

const STATUS_PILL: Record<TaskStatus, 'success' | 'warning' | 'neutral'> = { done: 'success', 'in-progress': 'warning', todo: 'neutral' }
const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  done: <CheckCircle2 size={13} />,
  'in-progress': <Loader size={13} />,
  todo: <CircleDashed size={13} />,
}

const DAY = 24 * 3600 * 1000
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (v: string) => (v ? `${v}T00:00:00Z` : undefined)
const uid = () => Math.random().toString(36).slice(2, 10)

function printSingleTask(task: Task, projectName: string, assigneeName: string, projectColor: string) {
  const w = window.open('', '_blank', 'width=620,height=700,resizable=yes')
  if (!w) return
  const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const statusCls = task.status === 'done' ? 'done-badge' : task.status === 'in-progress' ? 'inprog-badge' : 'todo-badge'
  const priorityCls = task.priority === 'high' ? 'high-badge' : task.priority === 'medium' ? 'med-badge' : 'low-badge'
  const color = projectColor.startsWith('#') ? projectColor : '#6366f1'
  const subtasks = task.subtasks ?? []
  const doneSubs = subtasks.filter((s) => s.done).length
  const pct = subtasks.length > 0 ? Math.round((doneSubs / subtasks.length) * 100) : null

  const subtaskHtml = subtasks.length > 0 ? `
    <div class="section">
      <div class="sec-head">
        <span class="sec-icon">☑</span> المهام الفرعية
        <span class="sub-prog">${doneSubs}/${subtasks.length}</span>
      </div>
      ${pct !== null ? `<div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${color}"></div></div>` : ''}
      <div class="subtask-list">
        ${subtasks.map((s) => `<div class="subtask-item ${s.done ? 'done' : ''}">
          <span class="sub-check" style="${s.done ? `background:${color};border-color:${color}` : ''}">${s.done ? '✓' : ''}</span>
          <span>${e(s.title)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''

  const tagsHtml = task.tags && task.tags.length > 0 ? `
    <div class="tags">
      ${task.tags.map((t) => `<span class="tag" style="background:${color}18;color:${color};border:1px solid ${color}30">${e(t)}</span>`).join('')}
    </div>` : ''

  const linksHtml = ''

  w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${e(task.title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;background:#f8fafc;color:#111;direction:rtl;min-height:100vh}
.header{background:${color};padding:24px 28px;color:white}
.proj-label{font-size:11px;font-weight:600;opacity:.75;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
.task-title{font-size:22px;font-weight:700;line-height:1.3;margin-bottom:12px}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.done-badge{background:rgba(255,255,255,0.25);color:white}
.inprog-badge{background:rgba(255,255,255,0.2);color:white}
.todo-badge{background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.85)}
.high-badge{background:rgba(254,226,226,0.9);color:#991b1b}
.med-badge{background:rgba(254,243,199,0.9);color:#92400e}
.low-badge{background:rgba(240,253,244,0.9);color:#166534}
.body{padding:20px 28px;space-y:0}
.section{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f0f0f0}
.section:last-of-type{border-bottom:none}
.sec-head{font-size:11px;font-weight:700;color:#888;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.sec-icon{font-size:13px}
.sub-prog{margin-inline-start:auto;font-size:12px;color:#555;font-weight:600}
.row{display:flex;align-items:center;gap:12px;padding:5px 0;font-size:13px}
.lbl{color:#888;min-width:90px;flex-shrink:0;font-size:12px}
.val{font-weight:600;color:#111}
.desc{background:#f8fafc;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.75;color:#333;white-space:pre-wrap;border:1px solid #eee}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.tag{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600}
.prog-bar{height:5px;background:#f0f0f0;border-radius:3px;margin-bottom:10px;overflow:hidden}
.prog-fill{height:100%;border-radius:3px;transition:width .3s}
.subtask-list{display:flex;flex-direction:column;gap:6px}
.subtask-item{display:flex;align-items:center;gap:8px;font-size:13px;color:#333}
.subtask-item.done{color:#999;text-decoration:line-through}
.sub-check{width:16px;height:16px;border-radius:4px;border:2px solid #ccc;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:white;flex-shrink:0}
.time-chip{display:inline-flex;align-items:center;gap:4px;background:#f0f0f0;border-radius:20px;padding:2px 10px;font-size:12px;color:#555;font-weight:600}
.footer{padding:14px 28px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
.task-id{font-size:10px;color:#bbb;font-family:monospace;direction:ltr}
.export-date{font-size:11px;color:#bbb}
.print-btn{padding:9px 22px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:600}
@media print{.print-btn{display:none}body{background:#fff}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div class="proj-label">${e(projectName)}</div>
  <div class="task-title">${e(task.title)}</div>
  <div class="badges">
    <span class="badge ${statusCls}">${e(TASK_STATUS_LABELS[task.status])}</span>
    <span class="badge ${priorityCls}">${e(PRIORITY_LABELS[task.priority])}</span>
    ${task.timeEstimate ? `<span class="badge" style="background:rgba(255,255,255,0.15);color:white">⏱ ${task.timeEstimate} ساعة</span>` : ''}
  </div>
  ${tagsHtml}
</div>
<div class="body">
  <div class="section">
    <div class="sec-head"><span class="sec-icon">📋</span> التفاصيل</div>
    ${assigneeName ? `<div class="row"><span class="lbl">المسؤول</span><span class="val">${e(assigneeName)}</span></div>` : ''}
    ${task.startDate ? `<div class="row"><span class="lbl">تاريخ البدء</span><span class="val" dir="ltr">${task.startDate.slice(0, 10)}</span></div>` : ''}
    ${task.dueDate ? `<div class="row"><span class="lbl">الاستحقاق</span><span class="val" dir="ltr">${task.dueDate.slice(0, 10)}</span></div>` : ''}
    ${task.timeEstimate ? `<div class="row"><span class="lbl">التقدير</span><span class="val">${task.timeEstimate} ساعة</span></div>` : ''}
  </div>
  ${subtaskHtml}
  ${task.description ? `<div class="section"><div class="sec-head"><span class="sec-icon">📝</span> الوصف</div><div class="desc">${e(task.description)}</div></div>` : ''}
</div>
<div class="footer">
  <span class="task-id">#${task.id}</span>
  <button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
  <span class="export-date">${new Date().toLocaleDateString('ar-SA')}</span>
</div>
</body></html>`)
  w.document.close()
}

interface TaskDrawerProps {
  task: Task | null
  project?: Project
  onClose: () => void
}

export default function TaskDrawer({ task, project, onClose }: TaskDrawerProps) {
  const { updateTask, deleteTask } = useTaskStore()
  const allProjects = useProjectStore(useShallow((s) => s.projects))
  const plans = usePlanStore(useShallow((s) => s.plans.filter((p) => p.projectId === project?.id).sort((a, b) => a.order - b.order)))
  const projectPhases = usePlanStore(useShallow((s) => s.phases.filter((p) => p.projectId === project?.id).sort((a, b) => a.order - b.order)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === project?.id).sort((a, b) => a.order - b.order)))
  const members = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === project?.id && m.status === 'active').sort((a, b) => a.order - b.order)))
  const [open, setOpen] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')
  const subtaskInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) requestAnimationFrame(() => setOpen(true))
  }, [task])

  const close = () => {
    setOpen(false)
    setTimeout(onClose, 320)
  }

  if (!task) return null

  const set = (data: Partial<Task>) => updateTask(task.id, data)
  const accent = project?.color ?? 'var(--iris-500)'
  const selectedPhase = task.phaseId ? projectPhases.find((p) => p.id === task.phaseId) : undefined

  const duration = task.startDate && task.dueDate
    ? Math.max(1, Math.round((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / DAY) + 1)
    : null

  // Subtask helpers
  const subtasks = task.subtasks ?? []
  const doneSubs = subtasks.filter((s) => s.done).length
  const subPct = subtasks.length > 0 ? Math.round((doneSubs / subtasks.length) * 100) : null

  const addSubtask = () => {
    const title = newSubtask.trim()
    if (!title) return
    set({ subtasks: [...subtasks, { id: uid(), title, done: false }] })
    setNewSubtask('')
    subtaskInputRef.current?.focus()
  }

  const toggleSubtask = (id: string) =>
    set({ subtasks: subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s) })

  const editSubtask = (id: string, title: string) =>
    set({ subtasks: subtasks.map((s) => s.id === id ? { ...s, title } : s) })

  const deleteSubtask = (id: string) =>
    set({ subtasks: subtasks.filter((s) => s.id !== id) })

  // Tag helpers
  const tags = task.tags ?? []
  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || tags.includes(tag)) return
    set({ tags: [...tags, tag] })
    setNewTag('')
    tagInputRef.current?.focus()
  }
  const removeTag = (tag: string) => set({ tags: tags.filter((t) => t !== tag) })

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 460 }}>
        {/* Accent header */}
        <div className="relative" style={{ background: `linear-gradient(135deg, ${hexToRgba(typeof accent === 'string' && accent.startsWith('#') ? accent : '#6366F1', 0.16)}, transparent)` }}>
          <div style={{ height: 3, background: accent }} />
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                  <span className="axis-label" style={{ letterSpacing: '0.06em' }}>{project?.name ?? 'مهمة حرة'}</span>
                </div>
                <textarea
                  value={task.title}
                  onChange={(e) => set({ title: e.target.value })}
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none font-bold leading-snug"
                  style={{ color: 'var(--fg-1)', fontSize: '18px' }}
                />
              </div>
              <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Pill variant={STATUS_PILL[task.status]} dot>{TASK_STATUS_LABELS[task.status]}</Pill>
              <Pill variant={PRIORITY_PILL[task.priority]}><Flag size={11} />{PRIORITY_LABELS[task.priority]}</Pill>
              {task.timeEstimate && (
                <Pill variant="neutral"><Clock size={11} />{task.timeEstimate} ساعة</Pill>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-6" style={{ paddingTop: 20 }}>
          {/* Status + priority */}
          <section className="space-y-3">
            <div>
              <div className="drawer-section__title">الحالة</div>
              <Segmented value={task.status} onChange={(v) => set({ status: v })} options={STATUS_OPTS} />
            </div>
            <div>
              <div className="drawer-section__title">الأولوية</div>
              <Segmented value={task.priority} onChange={(v) => set({ priority: v })} options={PRIORITY_OPTS} />
            </div>
          </section>

          {/* Subtasks */}
          <section>
            <div className="drawer-section__title flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5"><Check size={11} />المهام الفرعية</span>
              {subtasks.length > 0 && (
                <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {doneSubs}/{subtasks.length}
                  {subPct !== null && ` · ${subPct}%`}
                </span>
              )}
            </div>
            {subtasks.length > 0 && subPct !== null && (
              <div className="mb-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${subPct}%`, background: accent }} />
              </div>
            )}
            <div className="space-y-1 mb-2">
              {subtasks.map((s) => (
                <div key={s.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => toggleSubtask(s.id)}
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      background: s.done ? accent : 'transparent',
                      border: `2px solid ${s.done ? accent : 'var(--color-surface-border)'}`,
                    }}
                  >
                    {s.done && <Check size={9} color="white" />}
                  </button>
                  <input
                    value={s.title}
                    onChange={(ev) => editSubtask(s.id, ev.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{
                      color: s.done ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      textDecoration: s.done ? 'line-through' : 'none',
                    }}
                  />
                  <button
                    onClick={() => deleteSubtask(s.id)}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-all"
                    style={{ color: 'var(--danger-500)' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={subtaskInputRef}
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="إضافة مهمة فرعية…"
                className="flex-1 h-7 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
              <button
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: 'var(--iris-500)', color: 'white' }}
              >
                <Plus size={12} />
              </button>
            </div>
          </section>

          {/* Tags */}
          <section>
            <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><Tag size={11} />الوسوم</span></div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium"
                  style={{ background: `${typeof accent === 'string' && accent.startsWith('#') ? hexToRgba(accent, 0.12) : 'var(--color-surface-muted)'}`, color: accent, border: `1px solid ${typeof accent === 'string' && accent.startsWith('#') ? hexToRgba(accent, 0.3) : 'var(--color-surface-border)'}` }}
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:opacity-60 transition-opacity" aria-label="إزالة">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={tagInputRef}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="وسم جديد…"
                className="flex-1 h-7 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: 'var(--iris-500)', color: 'white' }}
              >
                <Plus size={12} />
              </button>
            </div>
          </section>

          {/* Dates + time estimate */}
          <section>
            <div className="drawer-section__title">التواريخ والتقدير</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="تاريخ البدء" type="date" dir="ltr" value={toDateInput(task.startDate)} onChange={(v) => set({ startDate: fromDateInput(v) })} />
              <Field label="تاريخ الاستحقاق" type="date" dir="ltr" value={toDateInput(task.dueDate)} onChange={(v) => set({ dueDate: fromDateInput(v) })} />
            </div>
            {duration && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--fg-3)' }}>
                <Clock size={12} />
                <span className="axis-num">المدة: {duration} يوم</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>التقدير (ساعات):</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.timeEstimate ?? ''}
                onChange={(e) => set({ timeEstimate: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="w-16 h-6 rounded px-2 text-xs outline-none axis-num"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ساعة</span>
            </div>
          </section>

          {/* Sprint */}
          {sprints.length > 0 && (
            <section>
              <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><Zap size={11} />المرحلة</span></div>
              <select
                value={task.sprintId ?? ''}
                onChange={(e) => set({ sprintId: e.target.value || undefined })}
                className="w-full text-sm px-3 py-2.5 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              >
                <option value="">الباكلوج (بدون مرحلة)</option>
                {sprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </section>
          )}

          {/* Assignee */}
          {members.length > 0 && (
            <section>
              <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><User size={11} />المسؤول</span></div>
              <select
                value={task.assigneeId ?? ''}
                onChange={(e) => set({ assigneeId: e.target.value || undefined })}
                className="w-full text-sm px-3 py-2.5 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              >
                <option value="">بدون مسؤول</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
                ))}
              </select>
            </section>
          )}

          {/* Project assignment */}
          <section>
            <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><Briefcase size={11} />المشروع</span></div>
            <select
              value={task.projectId ?? ''}
              onChange={(e) => set({ projectId: e.target.value || undefined, phaseId: undefined, milestoneId: undefined, sprintId: undefined })}
              className="w-full text-sm px-3 py-2.5 outline-none"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            >
              <option value="">بلا مشروع</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </section>

          {/* Linked phase + milestone */}
          {projectPhases.length > 0 && (
            <section className="space-y-3">
              <div>
                <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><Map size={11} />المرحلة المرتبطة</span></div>
                <select
                  value={task.phaseId ?? ''}
                  onChange={(e) => set({ phaseId: e.target.value || undefined, milestoneId: undefined })}
                  className="w-full text-sm px-3 py-2.5 outline-none"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
                >
                  <option value="">بدون مرحلة</option>
                  {plans.map((pl) => (
                    <optgroup key={pl.id} label={pl.name}>
                      {projectPhases.filter((ph) => ph.planId === pl.id).map((ph) => (
                        <option key={ph.id} value={ph.id}>{ph.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {selectedPhase && selectedPhase.milestones.length > 0 && (
                <div>
                  <div className="drawer-section__title">الإنجاز المرتبط</div>
                  <select
                    value={task.milestoneId ?? ''}
                    onChange={(e) => set({ milestoneId: e.target.value || undefined })}
                    className="w-full text-sm px-3 py-2.5 outline-none"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
                  >
                    <option value="">بدون إنجاز</option>
                    {selectedPhase.milestones.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>
          )}

          {/* Description */}
          <section>
            <div className="drawer-section__title">الوصف</div>
            <textarea
              rows={4}
              placeholder="أضف وصفاً"
              value={task.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              className="w-full text-sm p-3 outline-none resize-y leading-relaxed"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            />
          </section>

          {/* Meta */}
          <section>
            <div className="detail-row">
              <span className="detail-row__label"><span className="inline-flex items-center gap-1.5"><Calendar size={12} />أُنشئت</span></span>
              <span className="detail-row__value axis-num">{formatDateAr(task.createdAt)}</span>
            </div>
            {task.startDate && (
              <div className="detail-row">
                <span className="detail-row__label">البدء</span>
                <span className="detail-row__value axis-num">{formatDateAr(task.startDate)}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="detail-row">
                <span className="detail-row__label">الاستحقاق</span>
                <span className="detail-row__value axis-num">{formatDateAr(task.dueDate)}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-row__label"><span className="inline-flex items-center gap-1.5"><Hash size={12} />المعرّف</span></span>
              <span className="detail-row__value axis-num" style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{task.id}</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant={task.status === 'done' ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => set({ status: task.status === 'done' ? 'todo' : 'done' })}
          >
            {STATUS_ICON[task.status === 'done' ? 'todo' : 'done']}
            {task.status === 'done' ? 'إعادة فتح' : 'وضع كمنجزة'}
          </Button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printSingleTask(
                task,
                project?.name ?? 'مهمة حرة',
                members.find((m) => m.id === task.assigneeId)?.name ?? '',
                project?.color ?? '#6366f1',
              )}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
              title="تنزيل بطاقة المهمة"
              aria-label="تنزيل"
            >
              <Download size={13} />
            </button>
            <Button variant="danger" size="sm" onClick={() => { deleteTask(task.id); close() }}>
              <Trash2 size={13} />
              حذف
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
