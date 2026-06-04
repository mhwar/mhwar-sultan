'use client'
import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useTaskStore } from '@/store/store'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import Segmented from '@/components/ui/Segmented'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, formatDateAr } from '@/lib/utils'

const STATUS_OPTS = (['todo', 'in-progress', 'done'] as TaskStatus[]).map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))
const PRIORITY_OPTS = (['low', 'medium', 'high'] as TaskPriority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (v: string) => (v ? `${v}T00:00:00Z` : undefined)

interface TaskDrawerProps {
  task: Task | null
  onClose: () => void
}

export default function TaskDrawer({ task, onClose }: TaskDrawerProps) {
  const { updateTask, deleteTask } = useTaskStore()
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

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer">
        <div className="axis-drawer__head">
          <input
            value={task.title}
            onChange={(e) => set({ title: e.target.value })}
            className="axis-drawer__title flex-1 bg-transparent outline-none"
          />
          <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost" onClick={close} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        <div className="axis-drawer__body space-y-5">
          <div>
            <label className="axis-label block mb-1.5">الحالة</label>
            <Segmented value={task.status} onChange={(v) => set({ status: v })} options={STATUS_OPTS} />
          </div>

          <div>
            <label className="axis-label block mb-1.5">الأولوية</label>
            <Segmented value={task.priority} onChange={(v) => set({ priority: v })} options={PRIORITY_OPTS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="تاريخ البدء" type="date" dir="ltr" value={toDateInput(task.startDate)} onChange={(v) => set({ startDate: fromDateInput(v) })} />
            <Field label="تاريخ الاستحقاق" type="date" dir="ltr" value={toDateInput(task.dueDate)} onChange={(v) => set({ dueDate: fromDateInput(v) })} />
          </div>

          <div>
            <label className="axis-label block mb-1.5">الوصف</label>
            <textarea
              rows={4}
              placeholder="أضف وصفاً"
              value={task.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              className="w-full text-sm p-3 outline-none resize-y"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            />
          </div>

          <div className="detail-row">
            <span className="detail-row__label">أُنشئت</span>
            <span className="detail-row__value">{formatDateAr(task.createdAt)}</span>
          </div>
        </div>

        <div className="axis-drawer__foot" style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="danger" size="sm" onClick={() => { deleteTask(task.id); close() }}>
            <Trash2 size={13} />
            حذف المهمة
          </Button>
        </div>
      </div>
    </div>
  )
}
