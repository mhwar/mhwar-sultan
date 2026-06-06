'use client'
import { useEffect, useState } from 'react'
import { X, Trash2, Calendar, Clock, Hash, Flag, CheckCircle2, CircleDashed, Loader, Map, Zap, User, Briefcase, Download } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTaskStore, usePlanStore, useSprintStore, useTeamStore, useProjectStore } from '@/store/store'
import type { Task, Project, TaskStatus, TaskPriority } from '@/types'
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

function printSingleTask(task: Task, projectName: string, assigneeName: string) {
  const w = window.open('', '_blank', 'width=560,height=540,resizable=yes')
  if (!w) return
  const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const statusCls = task.status === 'done' ? 'done-badge' : task.status === 'in-progress' ? 'inprog-badge' : 'todo-badge'
  const priorityCls = task.priority === 'high' ? 'high-badge' : task.priority === 'medium' ? 'med-badge' : 'low-badge'
  w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${e(task.title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;background:#fff;color:#111;padding:24px;direction:rtl}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:20px}
.proj{font-size:12px;color:#6366f1;font-weight:700;margin-bottom:8px}
.title{font-size:20px;font-weight:700;margin-bottom:14px;line-height:1.3}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
.done-badge{background:#d1fae5;color:#065f46}.inprog-badge{background:#fef3c7;color:#92400e}.todo-badge{background:#f3f4f6;color:#374151}
.high-badge{background:#fee2e2;color:#991b1b}.med-badge{background:#fef3c7;color:#92400e}.low-badge{background:#f0fdf4;color:#166534}
.row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
.lbl{color:#888;min-width:72px;flex-shrink:0}.val{font-weight:600}
.desc{margin-top:14px;padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;line-height:1.7;color:#333;white-space:pre-wrap}
.print-btn{display:block;width:100%;margin-top:20px;padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:'Cairo',sans-serif}
@media print{.print-btn{display:none}}
</style></head><body>
<div class="card">
<div class="proj">${e(projectName)}</div>
<div class="title">${e(task.title)}</div>
<div class="badges"><span class="badge ${statusCls}">${e(TASK_STATUS_LABELS[task.status])}</span><span class="badge ${priorityCls}">${e(PRIORITY_LABELS[task.priority])}</span></div>
${assigneeName ? `<div class="row"><span class="lbl">المسؤول</span><span class="val">${e(assigneeName)}</span></div>` : ''}
${task.startDate ? `<div class="row"><span class="lbl">البدء</span><span class="val" dir="ltr">${task.startDate.slice(0, 10)}</span></div>` : ''}
${task.dueDate ? `<div class="row"><span class="lbl">الاستحقاق</span><span class="val" dir="ltr">${task.dueDate.slice(0, 10)}</span></div>` : ''}
${task.description ? `<div class="desc">${e(task.description)}</div>` : ''}
</div>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
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

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 440 }}>
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
            <div className="flex items-center gap-2 mt-1">
              <Pill variant={STATUS_PILL[task.status]} dot>{TASK_STATUS_LABELS[task.status]}</Pill>
              <Pill variant={PRIORITY_PILL[task.priority]}><Flag size={11} />{PRIORITY_LABELS[task.priority]}</Pill>
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

          {/* Dates */}
          <section>
            <div className="drawer-section__title">التواريخ</div>
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
          </section>

          {/* Sprint */}
          {sprints.length > 0 && (
            <section>
              <div className="drawer-section__title"><span className="inline-flex items-center gap-1.5"><Zap size={11} />السبرنت</span></div>
              <select
                value={task.sprintId ?? ''}
                onChange={(e) => set({ sprintId: e.target.value || undefined })}
                className="w-full text-sm px-3 py-2.5 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              >
                <option value="">الباكلوج (بدون سبرنت)</option>
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
              onClick={() => printSingleTask(task, project?.name ?? 'مهمة حرة', members.find((m) => m.id === task.assigneeId)?.name ?? '')}
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
