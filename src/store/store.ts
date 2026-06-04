import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, Plan, PlanPhase, Note, TaskStatus, Feature, Sprint, SprintStatus } from '@/types'
import { SEED_PROJECTS, SEED_TASKS, SEED_PLANS, SEED_PHASES, SEED_NOTES, SEED_SPRINTS } from '@/lib/seed-data'
import { domainForKind } from '@/lib/plan-kinds'
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

      updateTask: (id, data) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }))
        // Two-way sync: a linked task reaching/leaving "done" ticks its milestone
        if (data.status !== undefined) {
          const t = get().tasks.find((x) => x.id === id)
          if (t?.phaseId && t.milestoneId) {
            usePlanStore.getState().setMilestoneDone(t.phaseId, t.milestoneId, t.status === 'done')
          }
        }
      },

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
  addPlan: (projectId: string, name: string, icon?: string, view?: 'timeline' | 'board', kind?: Plan['kind'], domain?: Plan['domain']) => string
  renamePlan: (id: string, name: string) => void
  updatePlan: (id: string, data: Partial<Plan>) => void
  deletePlan: (id: string) => void
  reorderPlans: (orderedIds: string[]) => void
  getProjectPlans: (projectId: string) => Plan[]
  addPhase: (data: Omit<PlanPhase, 'id'>) => void
  reorderPhases: (orderedIds: string[]) => void
  updatePhase: (id: string, data: Partial<PlanPhase>) => void
  deletePhase: (id: string) => void
  toggleMilestone: (phaseId: string, milestoneId: string) => void
  setMilestoneDone: (phaseId: string, milestoneId: string, done: boolean) => void
  addMilestone: (phaseId: string, title: string) => void
  getProjectPhases: (projectId: string) => PlanPhase[]
  addFeature: (phaseId: string, title: string) => void
  toggleFeature: (phaseId: string, featureId: string) => void
  deleteFeature: (phaseId: string, featureId: string) => void
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plans: SEED_PLANS,
      phases: SEED_PHASES,

      addPlan: (projectId, name, icon, view, kind, domain) => {
        const id = generateId()
        set((s) => {
          const order = s.plans.filter((p) => p.projectId === projectId).length + 1
          return { plans: [...s.plans, { id, projectId, name, icon, view, kind, domain: domain ?? domainForKind(kind), order, createdAt: now() }] }
        })
        return id
      },

      renamePlan: (id, name) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, name } : p)) })),

      updatePlan: (id, data) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...data } : p)) })),

      deletePlan: (id) => {
        const removedPhaseIds = get().phases.filter((ph) => ph.planId === id).map((ph) => ph.id)
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          phases: s.phases.filter((ph) => ph.planId !== id),
        }))
        // Clear dangling links on tasks that pointed at the removed phases
        if (removedPhaseIds.length) {
          useTaskStore.setState((ts) => ({
            tasks: ts.tasks.map((t) =>
              t.phaseId && removedPhaseIds.includes(t.phaseId) ? { ...t, phaseId: undefined, milestoneId: undefined } : t
            ),
          }))
        }
      },

      reorderPlans: (orderedIds) =>
        set((s) => {
          const map: Record<string, number> = Object.fromEntries(orderedIds.map((id, i) => [id, i + 1]))
          return { plans: s.plans.map((p) => (map[p.id] ? { ...p, order: map[p.id] } : p)) }
        }),

      getProjectPlans: (projectId) =>
        get().plans.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order),

      reorderPhases: (orderedIds) =>
        set((s) => {
          const map: Record<string, number> = Object.fromEntries(orderedIds.map((id, i) => [id, i + 1]))
          return { phases: s.phases.map((ph) => (map[ph.id] ? { ...ph, order: map[ph.id] } : ph)) }
        }),

      addPhase: (data) =>
        set((s) => ({ phases: [...s.phases, { ...data, id: generateId() }] })),

      updatePhase: (id, data) =>
        set((s) => ({
          phases: s.phases.map((ph) => (ph.id === id ? { ...ph, ...data } : ph)),
        })),

      deletePhase: (id) => {
        set((s) => ({ phases: s.phases.filter((ph) => ph.id !== id) }))
        // Clear dangling links on tasks that pointed at the removed phase
        useTaskStore.setState((ts) => ({
          tasks: ts.tasks.map((t) => (t.phaseId === id ? { ...t, phaseId: undefined, milestoneId: undefined } : t)),
        }))
      },

      toggleMilestone: (phaseId, milestoneId) => {
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
        }))
        // Two-way sync: drive linked tasks' status from the milestone state
        const m = get().phases.find((p) => p.id === phaseId)?.milestones.find((x) => x.id === milestoneId)
        if (m) {
          const next: TaskStatus = m.done ? 'done' : 'todo'
          useTaskStore.setState((ts) => ({
            tasks: ts.tasks.map((t) => (t.milestoneId === milestoneId ? { ...t, status: next } : t)),
          }))
        }
      },

      setMilestoneDone: (phaseId, milestoneId, done) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? { ...ph, milestones: ph.milestones.map((m) => (m.id === milestoneId ? { ...m, done } : m)) }
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

      addFeature: (phaseId, title) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? { ...ph, features: [...(ph.features ?? []), { id: generateId(), title, done: false } as Feature] }
              : ph
          ),
        })),

      toggleFeature: (phaseId, featureId) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? { ...ph, features: (ph.features ?? []).map((f) => f.id === featureId ? { ...f, done: !f.done } : f) }
              : ph
          ),
        })),

      deleteFeature: (phaseId, featureId) =>
        set((s) => ({
          phases: s.phases.map((ph) =>
            ph.id === phaseId
              ? { ...ph, features: (ph.features ?? []).filter((f) => f.id !== featureId) }
              : ph
          ),
        })),
    }),
    {
      name: 'mhwar-plans',
      version: 3,
      skipHydration: true,
      // Cumulative migrations (each `version < N` branch runs in order):
      //   v1 → v2: introduce named plans; assign each legacy phase to a default plan
      //   v2 → v3: tag each plan with a workspace domain; re-home any orphan phase
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
                plans.push({ id, projectId: ph.projectId, name: 'خارطة الطريق', icon: 'route', kind: 'roadmap', view: 'timeline', order: 1, createdAt: new Date().toISOString() })
              }
            }
            if (!ph.planId) ph.planId = byProject[ph.projectId]
          }
          state.plans = plans
          state.phases = phases
        }
        if (version < 3) {
          const plans = state.plans ?? []
          const phases = state.phases ?? []
          // Tag domain by kind (agile plans get a fallback; they're removed by bootstrapSprints)
          for (const p of plans) {
            if (!p.domain) p.domain = domainForKind(p.kind)
          }
          // Re-home orphan phases to their project's first plan so they never
          // appear in two workspace tabs (or vanish) after domain filtering.
          const firstPlanByProject: Record<string, string> = {}
          for (const p of [...plans].sort((a, b) => a.order - b.order)) {
            if (p.projectId && !firstPlanByProject[p.projectId]) firstPlanByProject[p.projectId] = p.id
          }
          for (const ph of phases) {
            if (!ph.planId && ph.projectId && firstPlanByProject[ph.projectId]) {
              ph.planId = firstPlanByProject[ph.projectId]
            }
          }
          state.plans = plans
          state.phases = phases
        }
        return state as never
      },
    }
  )
)

// ── Sprint Store ──────────────────────────────────────────
interface SprintStore {
  sprints: Sprint[]
  /** One-time flag: have legacy `agile` plans been migrated into sprints? */
  migratedAgile: boolean
  addSprint: (projectId: string, name: string, data?: Partial<Omit<Sprint, 'id' | 'projectId' | 'name' | 'createdAt'>>) => string
  updateSprint: (id: string, data: Partial<Sprint>) => void
  deleteSprint: (id: string) => void
  reorderSprints: (orderedIds: string[]) => void
  getProjectSprints: (projectId: string) => Sprint[]
}

export const useSprintStore = create<SprintStore>()(
  persist(
    (set, get) => ({
      sprints: SEED_SPRINTS,
      // Starts false so bootstrapSprints runs once per browser. Fresh installs
      // (no agile plans) simply flip it to true with no other changes.
      migratedAgile: false,

      addSprint: (projectId, name, data) => {
        const id = generateId()
        set((s) => {
          const order = s.sprints.filter((sp) => sp.projectId === projectId).length + 1
          return { sprints: [...s.sprints, { id, projectId, name, status: 'planned', order, createdAt: now(), ...data }] }
        })
        return id
      },

      updateSprint: (id, data) =>
        set((s) => ({ sprints: s.sprints.map((sp) => (sp.id === id ? { ...sp, ...data } : sp)) })),

      deleteSprint: (id) => {
        set((s) => ({ sprints: s.sprints.filter((sp) => sp.id !== id) }))
        // Detach tasks rather than deleting them — they fall back to the Backlog
        useTaskStore.setState((ts) => ({
          tasks: ts.tasks.map((t) => (t.sprintId === id ? { ...t, sprintId: undefined } : t)),
        }))
      },

      reorderSprints: (orderedIds) =>
        set((s) => {
          const map: Record<string, number> = Object.fromEntries(orderedIds.map((id, i) => [id, i + 1]))
          return { sprints: s.sprints.map((sp) => (map[sp.id] ? { ...sp, order: map[sp.id] } : sp)) }
        }),

      getProjectSprints: (projectId) =>
        get()
          .sprints.filter((sp) => sp.projectId === projectId)
          .sort((a, b) => a.order - b.order),
    }),
    { name: 'mhwar-sprints', version: 1, skipHydration: true }
  )
)

const SPRINT_STATUS_FROM_PHASE: Record<PlanPhase['status'], SprintStatus> = {
  upcoming: 'planned',
  'in-progress': 'active',
  completed: 'completed',
}

/**
 * One-time, idempotent migration of legacy `kind:'agile'` plans into the new
 * first-class Sprint model. Runs after all stores have rehydrated (invoked from
 * StoreHydration). No-op when there are no agile plans or it has already run.
 */
export function bootstrapSprints() {
  if (useSprintStore.getState().migratedAgile) return

  const agilePlans = usePlanStore.getState().plans.filter((p) => p.kind === 'agile')
  if (agilePlans.length === 0) {
    useSprintStore.setState({ migratedAgile: true })
    return
  }

  const allPhases = usePlanStore.getState().phases
  const newSprints: Sprint[] = []
  const removedPhaseIds = new Set<string>()
  // taskId -> sprintId assignment; built up then applied in one pass
  const taskSprint: Record<string, string> = {}
  const tasksToCreate: Task[] = []

  const orderByProject: Record<string, number> = {}
  for (const plan of agilePlans) {
    const phases = allPhases.filter((ph) => ph.planId === plan.id).sort((a, b) => a.order - b.order)
    for (const ph of phases) {
      removedPhaseIds.add(ph.id)
      const sprintId = generateId()
      orderByProject[ph.projectId] = (orderByProject[ph.projectId] ?? 0) + 1
      newSprints.push({
        id: sprintId,
        projectId: ph.projectId,
        name: ph.title,
        goal: ph.objective,
        startDate: ph.startDate,
        dueDate: ph.dueDate,
        status: SPRINT_STATUS_FROM_PHASE[ph.status],
        order: orderByProject[ph.projectId],
        createdAt: now(),
      })

      const existingTasks = useTaskStore.getState().tasks
      for (const m of ph.milestones) {
        // Reuse an existing linked task if one was already sent to execution
        const linked = existingTasks.find((t) => t.milestoneId === m.id)
        if (linked) {
          taskSprint[linked.id] = sprintId
        } else {
          tasksToCreate.push({
            id: generateId(),
            projectId: ph.projectId,
            sprintId,
            title: m.title,
            status: m.done ? 'done' : 'todo',
            priority: 'medium',
            startDate: ph.startDate,
            dueDate: ph.dueDate,
            createdAt: now(),
          })
        }
      }
      // Any other task pointing at this phase joins the sprint too
      for (const t of existingTasks) {
        if (t.phaseId === ph.id) taskSprint[t.id] = sprintId
      }
    }
  }

  // Apply task changes: assign sprintId, clear now-dangling phase/milestone refs
  useTaskStore.setState((ts) => ({
    tasks: [
      ...ts.tasks.map((t) =>
        taskSprint[t.id]
          ? { ...t, sprintId: taskSprint[t.id], phaseId: undefined, milestoneId: undefined }
          : t
      ),
      ...tasksToCreate,
    ],
  }))

  // Remove the agile plans and their phases
  const agileIds = new Set(agilePlans.map((p) => p.id))
  usePlanStore.setState((ps) => ({
    plans: ps.plans.filter((p) => !agileIds.has(p.id)),
    phases: ps.phases.filter((ph) => !removedPhaseIds.has(ph.id)),
  }))

  useSprintStore.setState((s) => ({ sprints: [...s.sprints, ...newSprints], migratedAgile: true }))
}

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
