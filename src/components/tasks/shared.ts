import type { Task } from '@/types'

/** Props shared by every Tasks calendar view (month/week/day) and the backlog. */
export interface TaskViewProps {
  tasks: Task[]
  projectColorMap: Record<string, string>
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
  onOpenItem: (task: Task) => void
  onAddOnDay: (key: string) => void
  /** Move a task to a day (key) or to the unscheduled bucket (null). */
  onReschedule: (id: string, key: string | null) => void
}

/** Derive a TaskChip's visual props (project accent, name, assignee initial). */
export function chipPropsFor(
  task: Task,
  p: TaskViewProps,
): { color: string; projectName?: string; assigneeInitial?: string } {
  return {
    color: task.projectId ? (p.projectColorMap[task.projectId] ?? 'var(--fg-3)') : 'var(--color-surface-border)',
    projectName: task.projectId ? p.projectNameMap[task.projectId] : undefined,
    assigneeInitial: task.assigneeId ? p.assigneeNameMap[task.assigneeId]?.[0] : undefined,
  }
}
