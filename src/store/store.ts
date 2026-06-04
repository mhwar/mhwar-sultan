import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, Plan, PlanPhase, Note, TaskStatus, ProjectStatus } from '@/types'
import { SEED_PROJECTS, SEED_TASKS, SEED_PLANS, SEED_PHASES, SEED_NOTES } from '@/lib/seed-data'
import { generateId, now } from '@/lib/utils'

// ── Project Store ─────────────────────────────────────────
interface ProjectStore {
  projects: Project[]
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProject: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,

      addProject: (data) =>
        set((s) => ({
          projects: [
            ...s.projects,
            { ...data, id: generateId(), createdAt: now(), updatedAt: now() },
          ],
        })),

      updateProject: (id, data) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    { name: 'mhwar-projects', version: 1, skipHydration: true }
  )
)

// ── Task Store ────────────────────────────────────────────
interface TaskStore {
  tasks: Task[]
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  getProjectTasks: (projectId: string) => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,

      addTask: (data) =>
        set((s) => ({
          tasks: [...s.tasks, { ...data, id: generateId(), createdAt: now() }],
        })),

      updateTask: (id, data) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      moveTask: (id, status) => get().updateTask(id, { status }),

      getProjectTasks: (projectId) =>
        get().tasks.filter((t) => t.projectId === projectId),
    }),
    { name: 'mhwar-tasks', version: 1, skipHydration: true }
  )
)

// ── Plan Store ────────────────────────────────────────────
interface PlanStore {
  plans: Plan[]
  phases: PlanPhase[]
  addPlan: (projectId: string, name: string) => string
  renamePlan: (id: string, name: string) => void
  deletePlan: (id: string) => void
  getProjectPlans: (projectId: string) => Plan[]
  addPhase: (data: Omit<PlanPhase, 'id'>) => void
  updatePhase: (id: string, data: Partial<PlanPhase>) => void
  deletePhase: (id: string) => void
  toggleMilestone: (phaseId: string, milestoneId: string) => void
  addMilestone: (phaseId: string, title: string) => void
  getProjectPhases: (projectId: string) => PlanPhase[]
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plans: SEED_PLANS,
      phases: SEED_PHASES,

      addPlan: (projectId, name) => {
        const id = generateId()
        set((s) => {
          const order = s.plans.filter((p) => p.projectId === projectId).length + 1
          return { plans: [...s.plans, { id, projectId, name, order, createdAt: now() }] }
        })
        return id
      },

      renamePlan: (id, name) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, name } : p)) })),

      deletePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          phases: s.phases.filter((ph) => ph.planId !== id),
        })),

      getProjectPlans: (projectId) =>
        get().plans.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order),

      addPhase: (data) =>
        set((s) => ({ phases: [...s.phases, { ...data, id: generateId() }] })),

      updatePhase: (id, data) =>
        set((s) => ({
          phases: s.phases.map((ph) => (ph.id === id ? { ...ph, ...data } : ph)),
        })),

      deletePhase: (id) =>
        set((s) => ({ phases: s.phases.filter((ph) => ph.id !== id) })),

      toggleMilestone: (phaseId, milestoneId) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? {
                  ...ph,
                  milestones: ph.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, done: !m.done } : m
                  ),
                }
              : ph
          ),
        })),

      addMilestone: (phaseId, title) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? {
                  ...ph,
                  milestones: [
                    ...ph.milestones,
                    { id: generateId(), title, done: false },
                  ],
                }
              : ph
          ),
        })),

      getProjectPhases: (projectId) =>
        get()
          .phases.filter((ph) => ph.projectId === projectId)
          .sort((a, b) => a.order - b.order),
    }),
    {
      name: 'mhwar-plans',
      version: 2,
      skipHydration: true,
      // v1 → v2: introduce named plans; assign each legacy phase to a default plan
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { plans?: Plan[]; phases?: PlanPhase[] } | undefined
        if (!state) return state as never
        if (version < 2) {
          const phases = state.phases ?? []
          const plans = state.plans ?? []
          const byProject: Record<string, string> = {}
          for (const ph of phases) {
            if (!ph.projectId) continue
            if (!byProject[ph.projectId]) {
              const existing = plans.find((p) => p.projectId === ph.projectId)
              if (existing) {
                byProject[ph.projectId] = existing.id
              } else {
                const id = `pl-${ph.projectId}-default`
                byProject[ph.projectId] = id
                plans.push({ id, projectId: ph.projectId, name: 'خطة المراحل', order: 1, createdAt: new Date().toISOString() })
              }
            }
            if (!ph.planId) ph.planId = byProject[ph.projectId]
          }
          state.plans = plans
          state.phases = phases
        }
        return state as never
      },
    }
  )
)

// ── Note Store ────────────────────────────────────────────
interface NoteStore {
  notes: Note[]
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, data: Partial<Note>) => void
  deleteNote: (id: string) => void
  getProjectNotes: (projectId: string) => Note[]
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: SEED_NOTES,

      addNote: (data) =>
        set((s) => ({
          notes: [
            ...s.notes,
            { ...data, id: generateId(), createdAt: now(), updatedAt: now() },
          ],
        })),

      updateNote: (id, data) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: now() } : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      getProjectNotes: (projectId) =>
        get()
          .notes.filter((n) => n.projectId === projectId)
          .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          }),
    }),
    { name: 'mhwar-notes', version: 1, skipHydration: true }
  )
)

// ── Stats helper (used in dashboard) ─────────────────────
export function computeStats(
  projects: Project[],
  tasks: Task[]
): {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  completedTasks: number
  avgProgress: number
} {
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: Project) => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: Task) => t.status === 'done').length,
    avgProgress: projects.length
      ? Math.round(
          projects.reduce((sum: number, p: Project) => sum + p.progress, 0) / projects.length
        )
      : 0,
  }
}
