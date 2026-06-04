import type { SprintStatus } from '@/types'
import { useSprintStore, useTaskStore } from '@/store/store'

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'مخطط',
  active: 'نشط',
  completed: 'مكتمل',
}

/** Sprint status → token CSS variable for dots/accents. */
export const SPRINT_STATUS_VAR: Record<SprintStatus, string> = {
  planned: 'var(--fg-4)',
  active: 'var(--warning-500)',
  completed: 'var(--success-500)',
}

export const SPRINT_STATUSES: SprintStatus[] = ['planned', 'active', 'completed']

interface SendToSprintOptions {
  projectId: string
  title: string
  /** Existing sprint to add to. Omit (with `newSprintName`) to create a new sprint. */
  sprintId?: string
  /** Name for the new sprint when `sprintId` is not provided. */
  newSprintName?: string
  /** Goal for the new sprint (defaults to the item title). */
  newSprintGoal?: string
  phaseId?: string
  milestoneId?: string
  /** When the source is a milestone, mirror its done state onto the new task. */
  done?: boolean
}

/**
 * Sends a planning item (a feature, milestone, or any titled detail) into the
 * execution layer as a Task — either into an existing sprint or a brand-new one
 * whose goal is the item itself. Returns the sprint id the task landed in.
 */
export function sendToSprint(opts: SendToSprintOptions): string {
  const { projectId, title, phaseId, milestoneId, done } = opts
  let sprintId = opts.sprintId
  if (!sprintId) {
    sprintId = useSprintStore.getState().addSprint(projectId, opts.newSprintName || title, {
      goal: opts.newSprintGoal ?? title,
      status: 'planned',
    })
  }
  useTaskStore.getState().addTask({
    projectId,
    sprintId,
    phaseId,
    milestoneId,
    title,
    status: done ? 'done' : 'todo',
    priority: 'medium',
  })
  return sprintId
}
