'use client'
import type { Task } from '@/types'
import { TASK_STATUS_VAR, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'

interface Props {
  task: Task
  color: string            // project color (side accent)
  projectName?: string
  assigneeInitial?: string
  onClick: () => void
  inline?: boolean
}

/** Draggable task chip shared by all calendar views and the backlog box. */
export default function TaskChip({ task, color, projectName, assigneeInitial, onClick, inline }: Props) {
  return (
    <button
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onClick}
      title={`${task.title}${projectName ? ` — ${projectName}` : ''} · ${TASK_STATUS_LABELS[task.status]} · ${PRIORITY_LABELS[task.priority]}`}
      className="group/chip flex items-center gap-1 rounded-md px-1.5 py-1 text-start transition-colors hover:bg-white/5"
      style={{
        background: 'var(--color-surface-muted)',
        border: '1px solid var(--color-surface-border)',
        borderInlineStart: `2px solid ${color}`,
        cursor: 'grab',
        maxWidth: inline ? 220 : '100%',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: TASK_STATUS_VAR[task.status] }}
      />
      <span
        className="text-xs truncate flex-1"
        style={{ color: 'var(--color-text-primary)', textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.6 : 1 }}
      >
        {task.title}
      </span>
      {assigneeInitial && (
        <span
          className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0"
          style={{ background: 'var(--iris-500)', color: 'white' }}
        >
          {assigneeInitial}
        </span>
      )}
    </button>
  )
}
