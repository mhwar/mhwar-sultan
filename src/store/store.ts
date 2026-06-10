import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, Plan, PlanPhase, Note, TaskStatus, TaskPriority, Feature, Sprint, SprintStatus, ProductDoc, GrowthMetric, GrowthExperiment, GrowthChannel, TeamMember, ScheduleEvent, FinanceEntry, Kpi, Client, ContentItem, Portfolio, Meeting } from '@/types'
import { SEED_PROJECTS, SEED_TASKS, SEED_PLANS, SEED_PHASES, SEED_NOTES, SEED_SPRINTS, SEED_DOCS, SEED_METRICS, SEED_EXPERIMENTS, SEED_CHANNELS, SEED_TEAM, SEED_SCHEDULE, SEED_FINANCE, SEED_KPIS, SEED_CLIENTS, SEED_CONTENT, SEED_PORTFOLIOS, SEED_MEETINGS } from '@/lib/seed-data'
import { domainForKind } from '@/lib/plan-kinds'
import { FALLBACK_TOOL_IDS, DEFAULT_PROJECT_TYPE } from '@/lib/project-types'
import { generateId, now } from '@/lib/utils'

// ── Project Store ─────────────────────────────────────────
interface ProjectStore {
  projects: Project[]
  /** Returns the new project's id so callers can navigate to it. */
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProject: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,

      addProject: (data) => {
        const id = generateId()
        set((s) => ({
          projects: [
            ...s.projects,
            { ...data, id, createdAt: now(), updatedAt: now() },
          ],
        }))
        return id
      },

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
    {
      name: 'mhwar-projects',
      version: 5,
      skipHydration: true,
      // v1 → v2: backfill the modular-tools fields on existing projects.
      // Older projects predate `type`/`tools`; treat them as technical with the
      // legacy 5-tool layout so nothing disappears after the upgrade.
      // v2 → v3: مشروع ملصق — refresh the placeholder seed record with the real
      // product identity (data platform, GS1/SFDA), keeping any user-added tools.
      // v3 → v4: مشروع ملصق — enable the finance tab (salaries/infrastructure demo).
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { projects?: Project[] } | undefined
        if (!state) return state as never
        if (version < 2) {
          state.projects = (state.projects ?? []).map((p) => ({
            ...p,
            type: p.type ?? DEFAULT_PROJECT_TYPE,
            tools: p.tools?.length ? p.tools : FALLBACK_TOOL_IDS,
          }))
        }
        if (version < 3) {
          const seed = SEED_PROJECTS.find((p) => p.id === 'mellasaq')
          if (seed) {
            state.projects = (state.projects ?? []).map((p) =>
              p.id === 'mellasaq'
                ? {
                    ...p,
                    nameEn: seed.nameEn,
                    description: seed.description,
                    status: seed.status,
                    progress: seed.progress,
                    color: seed.color,
                    icon: seed.icon,
                    logo: p.logo ?? seed.logo,
                    category: seed.category,
                    tags: seed.tags,
                    links: p.links?.length ? p.links : seed.links,
                    tools: [...seed.tools, ...(p.tools ?? []).filter((t) => !seed.tools.includes(t))],
                    updatedAt: seed.updatedAt,
                  }
                : p
            )
          }
        }
        if (version < 4) {
          state.projects = (state.projects ?? []).map((p) =>
            p.id === 'mellasaq' && !p.tools.includes('finance')
              ? { ...p, tools: [...p.tools.filter((t) => t !== 'notes'), 'finance', ...(p.tools.includes('notes') ? ['notes'] : [])] }
              : p
          )
        }
        // v4 → v5: بوصلة الأعمال — transform from technical navigation app to a
        // content/social-media agency (in-place, non-destructive for user edits).
        if (version < 5) {
          const seed = SEED_PROJECTS.find((p) => p.id === 'bawsala')
          if (seed) {
            state.projects = (state.projects ?? []).map((p) =>
              p.id === 'bawsala'
                ? {
                    ...p,
                    name: seed.name,
                    nameEn: seed.nameEn,
                    description: seed.description,
                    progress: seed.progress,
                    color: seed.color,
                    icon: seed.icon,
                    logo: p.logo ?? seed.logo,
                    category: seed.category,
                    type: seed.type,
                    tags: seed.tags,
                    tools: [...seed.tools, ...(p.tools ?? []).filter((t) => !seed.tools.includes(t))],
                    updatedAt: seed.updatedAt,
                  }
                : p
            )
          }
        }
        return state as never
      },
    }
  )
)

// ── Task Store ────────────────────────────────────────────
interface TaskStore {
  tasks: Task[]
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => string
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  getProjectTasks: (projectId: string) => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,

      addTask: (data) => {
        const id = generateId()
        set((s) => ({
          tasks: [...s.tasks, { ...data, id, createdAt: now() }],
        }))
        return id
      },

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
    {
      name: 'mhwar-tasks',
      version: 4,
      skipHydration: true,
      // v1→v2: backfill demo assignees onto seed tasks that have none (non-destructive).
      // v2→v3: مشروع ملصق — replace the two placeholder tasks (t9/t10) with the real
      // enablement-phase ones (only when the titles are still untouched) and merge
      // the new seeded phase tasks by id.
      // v3→v4: بوصلة الأعمال — drop the old navigation-app tasks (t11–t14, only when
      // untouched) and merge the new agency tasks by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { tasks?: Task[] } | undefined
        if (!state?.tasks) return state
        if (version < 2) {
          const seedAssignee: Record<string, string> = Object.fromEntries(
            SEED_TASKS.filter((t) => t.assigneeId).map((t) => [t.id, t.assigneeId as string])
          )
          state.tasks = state.tasks.map((t) =>
            !t.assigneeId && seedAssignee[t.id] ? { ...t, assigneeId: seedAssignee[t.id] } : t
          )
        }
        if (version < 3) {
          const seedById: Record<string, Task> = Object.fromEntries(SEED_TASKS.map((t) => [t.id, t]))
          const legacyTitles: Record<string, string> = {
            t9: 'تصميم نماذج الملصقات',
            t10: 'محرر الملصقات التفاعلي',
          }
          state.tasks = state.tasks.map((t) =>
            legacyTitles[t.id] && t.title === legacyTitles[t.id] && seedById[t.id] ? seedById[t.id] : t
          )
          const have = new Set(state.tasks.map((t) => t.id))
          for (const seed of SEED_TASKS) {
            if (seed.id.startsWith('tk-mlsq-') && !have.has(seed.id)) state.tasks.push(seed)
          }
        }
        if (version < 4) {
          const bawsalaLegacy: Record<string, string> = {
            t11: 'بحث مزودي الخرائط',
            t12: 'واجهة الخريطة الأساسية',
            t13: 'نظام البحث عن الأماكن',
            t14: 'حفظ المفضلات',
          }
          state.tasks = state.tasks.filter((t) => !(bawsalaLegacy[t.id] && t.title === bawsalaLegacy[t.id]))
          const have = new Set(state.tasks.map((t) => t.id))
          for (const seed of SEED_TASKS) {
            if (seed.id.startsWith('tk-bsl-') && !have.has(seed.id)) state.tasks.push(seed)
          }
        }
        return state
      },
    }
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
      version: 6,
      skipHydration: true,
      // Cumulative migrations (each `version < N` branch runs in order):
      //   v1 → v2: introduce named plans; assign each legacy phase to a default plan
      //   v2 → v3: tag each plan with a workspace domain; re-home any orphan phase
      //   v3 → v4: مشروع ملصق — replace the placeholder roadmap phases with the real
      //            enablement-phase roadmap (only untouched phases) and merge new ones
      //   v4 → v5: ensure all mellasaq phases exist (guard for stores already at v4)
      //   v5 → v6: بوصلة الأعمال — replace the navigation-app phases (ph6/ph7, only
      //            untouched) with the agency growth roadmap
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
        if (version < 4) {
          const phases = state.phases ?? []
          const seedById: Record<string, PlanPhase> = Object.fromEntries(SEED_PHASES.map((p) => [p.id, p]))
          // Replace the two placeholder ملصق phases only if their titles are unedited
          const legacyTitles: Record<string, string> = {
            ph4: 'مرحلة الاستكشاف والتخطيط',
            ph5: 'مرحلة التطوير',
          }
          state.phases = phases.map((ph) =>
            legacyTitles[ph.id] && ph.title === legacyTitles[ph.id] && seedById[ph.id] ? seedById[ph.id] : ph
          )
          const have = new Set(state.phases.map((p) => p.id))
          for (const seed of SEED_PHASES) {
            if (seed.id.startsWith('ph-mlsq-') && !have.has(seed.id)) state.phases.push(seed)
          }
        }
        if (version < 5) {
          const phases = state.phases ?? []
          const haveIds = new Set(phases.map((p: PlanPhase) => p.id))
          for (const seed of SEED_PHASES.filter((p) => p.projectId === 'mellasaq')) {
            if (!haveIds.has(seed.id)) phases.push(seed)
          }
          state.phases = phases
        }
        if (version < 6) {
          const bawsalaLegacy: Record<string, string> = {
            ph6: 'مرحلة البحث والتأسيس',
            ph7: 'مرحلة التطوير الأساسي',
          }
          const phases = (state.phases ?? []).filter(
            (ph: PlanPhase) => !(bawsalaLegacy[ph.id] && ph.title === bawsalaLegacy[ph.id])
          )
          const haveIds = new Set(phases.map((p: PlanPhase) => p.id))
          for (const seed of SEED_PHASES.filter((p) => p.projectId === 'bawsala')) {
            if (!haveIds.has(seed.id)) phases.push(seed)
          }
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
    {
      name: 'mhwar-sprints',
      version: 3,
      skipHydration: true,
      // v1→v2: "sprints" became richer "initiatives" (مبادرات). Rename default-named
      // seed sprints, backfill the new lead/checklist/updates fields, and add any
      // missing seed initiatives — all without clobbering user edits.
      // v2→v3: مشروع ملصق — merge the five enablement-track initiatives.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { sprints?: Sprint[] } | undefined
        if (!state?.sprints) return state
        if (version < 2) {
          const seedById: Record<string, Sprint> = Object.fromEntries(SEED_SPRINTS.map((s) => [s.id, s]))
          state.sprints = state.sprints.map((sp) => {
            const seed = seedById[sp.id]
            if (!seed) return sp
            return {
              ...sp,
              name: sp.name.startsWith('سبرنت') ? seed.name : sp.name,
              goal: sp.goal ?? seed.goal,
              lead: sp.lead ?? seed.lead,
              checklist: sp.checklist ?? seed.checklist,
              updates: sp.updates ?? seed.updates,
            }
          })
          const have = new Set(state.sprints.map((s) => s.id))
          for (const seed of SEED_SPRINTS) if (!have.has(seed.id)) state.sprints.push(seed)
        }
        if (version < 3) {
          const have = new Set(state.sprints.map((s) => s.id))
          for (const seed of SEED_SPRINTS) {
            if (seed.id.startsWith('sp-mlsq-') && !have.has(seed.id)) state.sprints.push(seed)
          }
        }
        return state
      },
    }
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
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNote: (id: string, data: Partial<Note>) => void
  deleteNote: (id: string) => void
  getProjectNotes: (projectId: string) => Note[]
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: SEED_NOTES,

      addNote: (data) => {
        const id = generateId()
        set((s) => ({
          notes: [
            ...s.notes,
            { ...data, id, createdAt: now(), updatedAt: now() },
          ],
        }))
        return id
      },

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
    {
      name: 'mhwar-notes',
      version: 3,
      skipHydration: true,
      // v1→v2: merge the seeded ملصق profile/work-mechanism notes by id.
      // v2→v3: بوصلة الأعمال — drop the old maps note (n3, only untouched) and merge
      // the agency workflow note.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { notes?: Note[] } | undefined
        if (!state?.notes) return state
        if (version < 2) {
          const have = new Set(state.notes.map((n) => n.id))
          for (const seed of SEED_NOTES) {
            if (seed.id.startsWith('n-mlsq-') && !have.has(seed.id)) state.notes.push(seed)
          }
        }
        if (version < 3) {
          state.notes = state.notes.filter((n) => !(n.id === 'n3' && n.title === 'مصادر الخرائط'))
          const have = new Set(state.notes.map((n) => n.id))
          for (const seed of SEED_NOTES) {
            if (seed.id.startsWith('n-bsl-') && !have.has(seed.id)) state.notes.push(seed)
          }
        }
        return state
      },
    }
  )
)

// ── Document Store ────────────────────────────────────────
interface DocumentStore {
  docs: ProductDoc[]
  addDoc: (data: Omit<ProductDoc, 'id' | 'order' | 'createdAt'>) => string
  updateDoc: (id: string, data: Partial<ProductDoc>) => void
  deleteDoc: (id: string) => void
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      docs: SEED_DOCS,

      addDoc: (data) => {
        const id = generateId()
        set((s) => {
          const projectDocs = s.docs.filter((d) => d.projectId === data.projectId)
          const order = projectDocs.length > 0 ? Math.max(...projectDocs.map((d) => d.order)) + 1 : 0
          return { docs: [...s.docs, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateDoc: (id, data) =>
        set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...data } : d)) })),

      deleteDoc: (id) =>
        set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
    }),
    {
      name: 'mhwar-docs',
      version: 2,
      skipHydration: true,
      // v1→v2: merge mellasaq product docs (doc-mlsq-1 through doc-mlsq-4).
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { docs?: ProductDoc[] } | undefined
        if (!state?.docs) return state
        if (version < 2) {
          const seedIds = new Set(state.docs.map((d) => d.id))
          const mlsqDocs = SEED_DOCS.filter((d) => d.projectId === 'mellasaq')
          const toAdd = mlsqDocs.filter((d) => !seedIds.has(d.id))
          if (toAdd.length > 0) state.docs = [...state.docs, ...toAdd]
        }
        return state
      },
    }
  )
)

// ── Growth Store ──────────────────────────────────────────
interface GrowthStore {
  metrics: GrowthMetric[]
  experiments: GrowthExperiment[]
  channels: GrowthChannel[]
  addMetric: (data: Omit<GrowthMetric, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => string
  updateMetric: (id: string, data: Partial<GrowthMetric>) => void
  deleteMetric: (id: string) => void
  addExperiment: (data: Omit<GrowthExperiment, 'id' | 'order' | 'createdAt'>) => string
  updateExperiment: (id: string, data: Partial<GrowthExperiment>) => void
  deleteExperiment: (id: string) => void
  addChannel: (data: Omit<GrowthChannel, 'id' | 'order' | 'createdAt'>) => string
  updateChannel: (id: string, data: Partial<GrowthChannel>) => void
  deleteChannel: (id: string) => void
}

export const useGrowthStore = create<GrowthStore>()(
  persist(
    (set, get) => ({
      metrics: SEED_METRICS,
      experiments: SEED_EXPERIMENTS,
      channels: SEED_CHANNELS,

      addMetric: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.metrics.filter((m) => m.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0
          return { metrics: [...s.metrics, { ...data, id, order, createdAt: now(), updatedAt: now() }] }
        })
        return id
      },

      updateMetric: (id, data) =>
        set((s) => ({ metrics: s.metrics.map((m) => (m.id === id ? { ...m, ...data, updatedAt: now() } : m)) })),

      deleteMetric: (id) =>
        set((s) => ({ metrics: s.metrics.filter((m) => m.id !== id) })),

      addExperiment: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.experiments.filter((e) => e.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0
          return { experiments: [...s.experiments, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateExperiment: (id, data) =>
        set((s) => ({ experiments: s.experiments.map((e) => (e.id === id ? { ...e, ...data } : e)) })),

      deleteExperiment: (id) =>
        set((s) => ({ experiments: s.experiments.filter((e) => e.id !== id) })),

      addChannel: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.channels.filter((c) => c.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 0
          return { channels: [...s.channels, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateChannel: (id, data) =>
        set((s) => ({ channels: s.channels.map((c) => (c.id === id ? { ...c, ...data } : c)) })),

      deleteChannel: (id) =>
        set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),
    }),
    { name: 'mhwar-growth', version: 1, skipHydration: true }
  )
)

// ── Team Store ────────────────────────────────────────────
interface TeamStore {
  members: TeamMember[]
  addMember: (data: Omit<TeamMember, 'id' | 'order' | 'createdAt'>) => string
  updateMember: (id: string, data: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set) => ({
      members: SEED_TEAM,

      addMember: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.members.filter((m) => m.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0
          return { members: [...s.members, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateMember: (id, data) =>
        set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...data } : m)) })),

      deleteMember: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
    }),
    {
      name: 'mhwar-team',
      version: 4,
      skipHydration: true,
      // v1→v2: seed the demo team for users who never added members (non-destructive).
      // v2→v3: merge missing seed members by id (adds سفيان to مشروع ملصق).
      // v3→v4: بوصلة الأعمال — merge the agency team and repurpose فهد الدوسري's role
      // from data analyst to performance analyst (only if untouched).
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { members?: TeamMember[] } | undefined
        if (!state) return state
        if (version < 2 && (!state.members || state.members.length === 0)) {
          state.members = SEED_TEAM
        }
        if (version < 3) {
          const members = state.members ?? []
          const have = new Set(members.map((m) => m.id))
          for (const seed of SEED_TEAM) if (!have.has(seed.id)) members.push(seed)
          state.members = members
        }
        if (version < 4) {
          const members = (state.members ?? []).map((m) =>
            m.id === 'tm6' && m.role === 'محلل بيانات'
              ? { ...m, role: 'محلل أداء ومنصات', notes: m.notes ?? 'تقارير الأداء الشهرية للعملاء وتحليل نمو الحسابات' }
              : m
          )
          const have = new Set(members.map((m) => m.id))
          for (const seed of SEED_TEAM) {
            if (seed.id.startsWith('tm-bsl-') && !have.has(seed.id)) members.push(seed)
          }
          state.members = members
        }
        return state
      },
    }
  )
)

// ── Schedule Store ────────────────────────────────────────
interface ScheduleStore {
  events: ScheduleEvent[]
  addEvent: (data: Omit<ScheduleEvent, 'id' | 'order' | 'createdAt'>) => string
  updateEvent: (id: string, data: Partial<ScheduleEvent>) => void
  deleteEvent: (id: string) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      events: SEED_SCHEDULE,

      addEvent: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.events.filter((e) => e.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0
          return { events: [...s.events, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateEvent: (id, data) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)) })),

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: 'mhwar-schedule', version: 1, skipHydration: true }
  )
)

// ── Meeting Store (recurring follow-up sessions with minutes) ──
interface MeetingStore {
  meetings: Meeting[]
  addMeeting: (data: Omit<Meeting, 'id' | 'createdAt'>) => string
  updateMeeting: (id: string, data: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void
  getProjectMeetings: (projectId: string) => Meeting[]
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: SEED_MEETINGS,

      addMeeting: (data) => {
        const id = generateId()
        set((s) => ({ meetings: [...s.meetings, { ...data, id, createdAt: now() }] }))
        return id
      },

      updateMeeting: (id, data) =>
        set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...data } : m)) })),

      deleteMeeting: (id) =>
        set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),

      getProjectMeetings: (projectId) =>
        get()
          .meetings.filter((m) => m.projectId === projectId)
          .sort((a, b) => b.date.localeCompare(a.date)),
    }),
    {
      name: 'mhwar-meetings',
      version: 7,
      skipHydration: true,
      // v1→v2: backfill recommendations field on seeded kickoff meeting.
      // v2→v3: decisions/recommendations from strings → structured lists.
      // v3→v4: add done:false to existing recommendations that lack it.
      // v4→v5: rename statuses: upcoming→preparation, done→minuted.
      // v5→v6: merge meet-mlsq-0 (first contracting meeting with Sufyan).
      // v6→v7: بوصلة الأعمال — merge the agency editorial/review meetings by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { meetings?: Meeting[] } | undefined
        if (!state?.meetings) return state
        if (version < 2) {
          const seedById: Record<string, Meeting> = Object.fromEntries(SEED_MEETINGS.map((m) => [m.id, m]))
          state.meetings = state.meetings.map((m) =>
            seedById[m.id] && m.recommendations === undefined
              ? { ...m, recommendations: seedById[m.id].recommendations }
              : m
          )
        }
        if (version < 3) {
          const toLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
          state.meetings = state.meetings.map((m) => {
            const out = { ...m } as Meeting & { decisions?: unknown; recommendations?: unknown }
            if (typeof out.decisions === 'string') {
              out.decisions = toLines(out.decisions).map((text) => ({ id: generateId(), text }))
            }
            if (typeof out.recommendations === 'string') {
              out.recommendations = toLines(out.recommendations).map((text) => ({ id: generateId(), text, done: false }))
            }
            return out as Meeting
          })
        }
        if (version < 4) {
          state.meetings = state.meetings.map((m) => ({
            ...m,
            recommendations: (m.recommendations ?? []).map((r) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (r as any).done === undefined ? { ...r, done: false } : r
            ),
          }))
        }
        if (version < 5) {
          state.meetings = state.meetings.map((m) => ({
            ...m,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (m.status as any) === 'upcoming' ? 'preparation'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  : (m.status as any) === 'done' ? 'minuted'
                  : m.status,
          }))
        }
        if (version < 6) {
          const seedMeet0 = SEED_MEETINGS.find((m) => m.id === 'meet-mlsq-0')
          if (seedMeet0 && !state.meetings.some((m) => m.id === 'meet-mlsq-0')) {
            state.meetings = [seedMeet0, ...state.meetings]
          }
        }
        if (version < 7) {
          const have = new Set(state.meetings.map((m) => m.id))
          for (const seed of SEED_MEETINGS) {
            if (seed.id.startsWith('meet-bsl-') && !have.has(seed.id)) state.meetings.push(seed)
          }
        }
        return state
      },
    }
  )
)

// ── Finance Store ─────────────────────────────────────────
interface FinanceStore {
  entries: FinanceEntry[]
  addEntry: (data: Omit<FinanceEntry, 'id' | 'order' | 'createdAt'>) => string
  updateEntry: (id: string, data: Partial<FinanceEntry>) => void
  deleteEntry: (id: string) => void
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      entries: SEED_FINANCE,

      addEntry: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.entries.filter((e) => e.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0
          return { entries: [...s.entries, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateEntry: (id, data) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...data } : e)) })),

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    {
      name: 'mhwar-finance',
      version: 3,
      skipHydration: true,
      // v1→v2: merge ملصق salaries/infrastructure demo entries by id.
      // v2→v3: بوصلة الأعمال — merge client subscriptions, salaries and tools by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { entries?: FinanceEntry[] } | undefined
        if (!state) return state
        if (version < 2) {
          const entries = state.entries ?? []
          const have = new Set(entries.map((e) => e.id))
          for (const seed of SEED_FINANCE) {
            if (seed.id.startsWith('fin-mlsq-') && !have.has(seed.id)) entries.push(seed)
          }
          state.entries = entries
        }
        if (version < 3) {
          const entries = state.entries ?? []
          const have = new Set(entries.map((e) => e.id))
          for (const seed of SEED_FINANCE) {
            if (seed.id.startsWith('fin-bsl-') && !have.has(seed.id)) entries.push(seed)
          }
          state.entries = entries
        }
        return state
      },
    }
  )
)

// ── KPI Store ─────────────────────────────────────────────
interface KpiStore {
  kpis: Kpi[]
  addKpi: (data: Omit<Kpi, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => string
  updateKpi: (id: string, data: Partial<Kpi>) => void
  deleteKpi: (id: string) => void
}

export const useKpiStore = create<KpiStore>()(
  persist(
    (set) => ({
      kpis: SEED_KPIS,

      addKpi: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.kpis.filter((k) => k.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((k) => k.order)) + 1 : 0
          return { kpis: [...s.kpis, { ...data, id, order, createdAt: now(), updatedAt: now() }] }
        })
        return id
      },

      updateKpi: (id, data) =>
        set((s) => ({ kpis: s.kpis.map((k) => (k.id === id ? { ...k, ...data, updatedAt: now() } : k)) })),

      deleteKpi: (id) =>
        set((s) => ({ kpis: s.kpis.filter((k) => k.id !== id) })),
    }),
    {
      name: 'mhwar-kpis',
      version: 3,
      skipHydration: true,
      // v1→v2: merge ملصق success-outcome KPIs by id.
      // v2→v3: بوصلة الأعمال — merge the agency operations KPIs by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { kpis?: Kpi[] } | undefined
        if (!state?.kpis) return state
        if (version < 2) {
          const have = new Set(state.kpis.map((k) => k.id))
          for (const seed of SEED_KPIS) {
            if (seed.id.startsWith('kpi-mlsq-') && !have.has(seed.id)) state.kpis.push(seed)
          }
        }
        if (version < 3) {
          const have = new Set(state.kpis.map((k) => k.id))
          for (const seed of SEED_KPIS) {
            if (seed.id.startsWith('kpi-bsl-') && !have.has(seed.id)) state.kpis.push(seed)
          }
        }
        return state
      },
    }
  )
)

// ── Client Store ──────────────────────────────────────────
interface ClientStore {
  clients: Client[]
  addClient: (data: Omit<Client, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => string
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      clients: SEED_CLIENTS,

      addClient: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.clients.filter((c) => c.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 0
          return { clients: [...s.clients, { ...data, id, order, createdAt: now(), updatedAt: now() }] }
        })
        return id
      },

      updateClient: (id, data) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now() } : c)) })),

      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
    }),
    {
      name: 'mhwar-clients',
      version: 2,
      skipHydration: true,
      // v1→v2: بوصلة الأعمال — merge the agency's monthly-contract clients by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { clients?: Client[] } | undefined
        if (!state) return state
        if (version < 2) {
          const clients = state.clients ?? []
          const have = new Set(clients.map((c) => c.id))
          for (const seed of SEED_CLIENTS) {
            if (seed.id.startsWith('cl-bsl-') && !have.has(seed.id)) clients.push(seed)
          }
          state.clients = clients
        }
        return state
      },
    }
  )
)

// ── Content Store ─────────────────────────────────────────
interface ContentStore {
  items: ContentItem[]
  addItem: (data: Omit<ContentItem, 'id' | 'order' | 'createdAt'>) => string
  updateItem: (id: string, data: Partial<ContentItem>) => void
  deleteItem: (id: string) => void
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      items: SEED_CONTENT,

      addItem: (data) => {
        const id = generateId()
        set((s) => {
          const existing = s.items.filter((i) => i.projectId === data.projectId)
          const order = existing.length > 0 ? Math.max(...existing.map((i) => i.order)) + 1 : 0
          return { items: [...s.items, { ...data, id, order, createdAt: now() }] }
        })
        return id
      },

      updateItem: (id, data) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)) })),

      deleteItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    {
      name: 'mhwar-content',
      version: 2,
      skipHydration: true,
      // v1→v2: بوصلة الأعمال — merge the agency's June content calendar by id.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { items?: ContentItem[] } | undefined
        if (!state) return state
        if (version < 2) {
          const items = state.items ?? []
          const have = new Set(items.map((i) => i.id))
          for (const seed of SEED_CONTENT) {
            if (seed.id.startsWith('ct-bsl-') && !have.has(seed.id)) items.push(seed)
          }
          state.items = items
        }
        return state
      },
    }
  )
)

// ── Portfolio Store ───────────────────────────────────────
interface PortfolioStore {
  portfolios: Portfolio[]
  addPortfolio: (data: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => string
  updatePortfolio: (id: string, data: Partial<Portfolio>) => void
  deletePortfolio: (id: string) => void
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      portfolios: SEED_PORTFOLIOS,

      addPortfolio: (data) => {
        const id = generateId()
        set((s) => ({ portfolios: [...s.portfolios, { ...data, id, createdAt: now(), updatedAt: now() }] }))
        return id
      },

      updatePortfolio: (id, data) =>
        set((s) => ({ portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, ...data, updatedAt: now() } : p)) })),

      deletePortfolio: (id) =>
        set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) })),
    }),
    { name: 'mhwar-portfolios', version: 1, skipHydration: true }
  )
)

// ── Task Filters Store (persisted active filters + named presets) ──
export interface TaskFilters {
  portfolio: string
  project: string
  assignee: string
  priority: TaskPriority | 'all'
  status: TaskStatus | 'all'
}
export interface TaskFilterPreset {
  id: string
  name: string
  filters: TaskFilters
}
export const EMPTY_TASK_FILTERS: TaskFilters = {
  portfolio: 'all', project: 'all', assignee: 'all', priority: 'all', status: 'all',
}
interface TaskFilterStore {
  filters: TaskFilters
  presets: TaskFilterPreset[]
  setFilters: (patch: Partial<TaskFilters>) => void
  resetFilters: () => void
  savePreset: (name: string) => string
  applyPreset: (id: string) => void
  deletePreset: (id: string) => void
}
export const useTaskFilterStore = create<TaskFilterStore>()(
  persist(
    (set, get) => ({
      filters: { ...EMPTY_TASK_FILTERS },
      presets: [],
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: { ...EMPTY_TASK_FILTERS } }),
      savePreset: (name) => {
        const id = generateId()
        set((s) => ({ presets: [...s.presets, { id, name, filters: { ...s.filters } }] }))
        return id
      },
      applyPreset: (id) => {
        const p = get().presets.find((x) => x.id === id)
        if (p) set({ filters: { ...p.filters } })
      },
      deletePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: 'mhwar-task-filters', version: 1, skipHydration: true }
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

// ── Navigation Signal Store (no persistence — transient cross-tab signals) ──
interface NavStore {
  targetTab?: string
  targetSprintId?: string
  navigate: (tab: string, sprintId?: string) => void
  clearTab: () => void
  clearSprintId: () => void
}

export const useNavStore = create<NavStore>()((set) => ({
  navigate: (tab, sprintId) => set({ targetTab: tab, targetSprintId: sprintId }),
  clearTab: () => set({ targetTab: undefined }),
  clearSprintId: () => set({ targetSprintId: undefined }),
}))
