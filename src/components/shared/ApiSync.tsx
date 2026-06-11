'use client'
/**
 * ApiSync — bridges Cloudflare D1 with the local Zustand stores.
 *
 * Lifecycle:
 *  1. Waits for a verified Cloudflare Access identity (signedInEmail).
 *  2. Checks whether the Pages Function API is reachable (/api/health).
 *  3. Pulls the full dataset from D1 and hydrates every store.
 *     If D1 is empty (first sign-in), pushes the current localStorage
 *     data so the owner's existing work is seeded into the shared DB.
 *  4. Subscribes to every store to detect mutations (create/update/delete)
 *     and syncs them to D1 in the background.
 *
 * Outside Cloudflare (local dev, preview), /api/health 404s and the
 * component exits silently — stores keep using localStorage as before.
 */

import { useEffect, useRef } from 'react'
import { usePermissionStore } from '@/store/permissionStore'
import { useProjectStore }    from '@/store/store'
import { useTaskStore }       from '@/store/store'
import { usePlanStore }       from '@/store/store'
import { useSprintStore }     from '@/store/store'
import { useNoteStore }       from '@/store/store'
import { useDocumentStore }   from '@/store/store'
import { useGrowthStore }     from '@/store/store'
import { useTeamStore }       from '@/store/store'
import { useScheduleStore }   from '@/store/store'
import { useMeetingStore }    from '@/store/store'
import { useFinanceStore }    from '@/store/store'
import { useKpiStore }        from '@/store/store'
import { usePackageStore }    from '@/store/store'
import { useClientStore }     from '@/store/store'
import { useContentStore }    from '@/store/store'
import { usePortfolioStore }  from '@/store/store'
import {
  apiAvailable, apiSyncPull, apiSyncPush,
  apiProjects, apiTasks, apiPlans, apiPhases, apiSprints, apiNotes,
  apiDocs, apiTeam, apiSchedule, apiMeetings, apiFinance, apiPackages,
  apiKpis, apiClients, apiMetrics, apiExperiments, apiChannels,
  apiContent, apiPortfolios, apiUsers, apiPermissions,
  type SyncSnapshot,
} from '@/lib/api'
import type {
  Project, Task, Plan, PlanPhase, Sprint, Note, ProductDoc,
  TeamMember, ScheduleEvent, Meeting, FinanceEntry, FinancePackage,
  Kpi, Client, GrowthMetric, GrowthExperiment, GrowthChannel,
  ContentItem, Portfolio, AppUser, ProjectPermission,
} from '@/types'

// ── Generic array-diffing watcher ─────────────────────────

type HasId = { id: string }

interface ApiMethods<T> {
  create: (d: T) => Promise<unknown>
  update: (id: string, d: T) => Promise<unknown>
  delete: (id: string) => Promise<unknown>
}

function diffAndSync<T extends HasId>(
  current: T[],
  prev: T[],
  api: ApiMethods<T>
): void {
  // Detect new or changed items
  for (const item of current) {
    const old = prev.find((o) => o.id === item.id)
    if (!old) {
      api.create(item).catch(console.error)
    } else if (JSON.stringify(old) !== JSON.stringify(item)) {
      api.update(item.id, item).catch(console.error)
    }
  }
  // Detect deletions
  for (const old of prev) {
    if (!current.find((c) => c.id === old.id)) {
      api.delete(old.id).catch(console.error)
    }
  }
}

export default function ApiSync() {
  const signedInEmail   = usePermissionStore((s) => s.signedInEmail)
  const hydrating       = useRef(false)
  const watchersStarted = useRef(false)

  useEffect(() => {
    if (!signedInEmail) return

    let cancelled = false

    ;(async () => {
      const available = await apiAvailable()
      if (!available || cancelled) return

      // ── Pull all data from D1 ────────────────────────────
      hydrating.current = true
      const snap = await apiSyncPull()
      if (cancelled) { hydrating.current = false; return }

      const isEmpty = !snap || snap.projects.length === 0

      if (isEmpty) {
        // First time: push local data to D1 so all users can share it
        const localSnap: Partial<SyncSnapshot> = {
          projects:    useProjectStore.getState().projects,
          tasks:       useTaskStore.getState().tasks,
          plans:       usePlanStore.getState().plans,
          phases:      usePlanStore.getState().phases,
          sprints:     useSprintStore.getState().sprints,
          notes:       useNoteStore.getState().notes,
          docs:        useDocumentStore.getState().docs,
          team:        useTeamStore.getState().members,
          schedule:    useScheduleStore.getState().events,
          meetings:    useMeetingStore.getState().meetings,
          finance:     useFinanceStore.getState().entries,
          packages:    usePackageStore.getState().packages,
          kpis:        useKpiStore.getState().kpis,
          clients:     useClientStore.getState().clients,
          metrics:     useGrowthStore.getState().metrics,
          experiments: useGrowthStore.getState().experiments,
          channels:    useGrowthStore.getState().channels,
          content:     useContentStore.getState().items,
          portfolios:  usePortfolioStore.getState().portfolios,
          users:       usePermissionStore.getState().users,
          permissions: usePermissionStore.getState().permissions,
        }
        await apiSyncPush(localSnap)
      } else {
        // Hydrate stores from API data (overrides localStorage)
        hydrateStores(snap)
      }

      hydrating.current = false

      // ── Start mutation watchers (once per session) ───────
      if (!watchersStarted.current) {
        watchersStarted.current = true
        startWatchers()
      }
    })()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInEmail])

  return null
}

// ── Store hydration ───────────────────────────────────────

function hydrateStores(snap: SyncSnapshot): void {
  if (snap.projects.length)    useProjectStore.setState({ projects:  snap.projects })
  if (snap.tasks.length)       useTaskStore.setState({ tasks:        snap.tasks })
  if (snap.plans.length)       usePlanStore.setState({ plans:        snap.plans })
  if (snap.phases.length)      usePlanStore.setState({ phases:       snap.phases })
  if (snap.sprints.length)     useSprintStore.setState({ sprints:    snap.sprints })
  if (snap.notes.length)       useNoteStore.setState({ notes:        snap.notes })
  if (snap.docs.length)        useDocumentStore.setState({ docs:     snap.docs })
  if (snap.team.length)        useTeamStore.setState({ members:      snap.team })
  if (snap.schedule.length)    useScheduleStore.setState({ events:   snap.schedule })
  if (snap.meetings.length)    useMeetingStore.setState({ meetings:  snap.meetings })
  if (snap.finance.length)     useFinanceStore.setState({ entries:   snap.finance })
  if (snap.packages.length)    usePackageStore.setState({ packages:  snap.packages })
  if (snap.kpis.length)        useKpiStore.setState({ kpis:          snap.kpis })
  if (snap.clients.length)     useClientStore.setState({ clients:    snap.clients })
  if (snap.metrics.length)     useGrowthStore.setState({ metrics:    snap.metrics })
  if (snap.experiments.length) useGrowthStore.setState({ experiments: snap.experiments })
  if (snap.channels.length)    useGrowthStore.setState({ channels:   snap.channels })
  if (snap.content.length)     useContentStore.setState({ items:     snap.content })
  if (snap.portfolios.length)  usePortfolioStore.setState({ portfolios: snap.portfolios })
  // Users & permissions are admin-only; hydrate if present
  if (snap.users.length)       usePermissionStore.setState({ users:       snap.users })
  if (snap.permissions.length) usePermissionStore.setState({ permissions: snap.permissions })
}

// ── Mutation watchers ─────────────────────────────────────

function startWatchers(): void {
  const hydrating = { current: false } // local flag shared with watcher closures

  // Track baselines (current store state at the time watchers start)
  let prevProjects:    Project[]           = useProjectStore.getState().projects.slice()
  let prevTasks:       Task[]              = useTaskStore.getState().tasks.slice()
  let prevPlans:       Plan[]              = usePlanStore.getState().plans.slice()
  let prevPhases:      PlanPhase[]         = usePlanStore.getState().phases.slice()
  let prevSprints:     Sprint[]            = useSprintStore.getState().sprints.slice()
  let prevNotes:       Note[]              = useNoteStore.getState().notes.slice()
  let prevDocs:        ProductDoc[]        = useDocumentStore.getState().docs.slice()
  let prevTeam:        TeamMember[]        = useTeamStore.getState().members.slice()
  let prevSchedule:    ScheduleEvent[]     = useScheduleStore.getState().events.slice()
  let prevMeetings:    Meeting[]           = useMeetingStore.getState().meetings.slice()
  let prevFinance:     FinanceEntry[]      = useFinanceStore.getState().entries.slice()
  let prevPackages:    FinancePackage[]    = usePackageStore.getState().packages.slice()
  let prevKpis:        Kpi[]              = useKpiStore.getState().kpis.slice()
  let prevClients:     Client[]            = useClientStore.getState().clients.slice()
  let prevMetrics:     GrowthMetric[]      = useGrowthStore.getState().metrics.slice()
  let prevExperiments: GrowthExperiment[]  = useGrowthStore.getState().experiments.slice()
  let prevChannels:    GrowthChannel[]     = useGrowthStore.getState().channels.slice()
  let prevContent:     ContentItem[]       = useContentStore.getState().items.slice()
  let prevPortfolios:  Portfolio[]         = usePortfolioStore.getState().portfolios.slice()
  let prevUsers:       AppUser[]           = usePermissionStore.getState().users.slice()
  let prevPermissions: ProjectPermission[] = usePermissionStore.getState().permissions.slice()

  // Wrap diff+sync with hydration guard
  function watch<T extends HasId>(
    current: T[],
    prev: T[],
    api: ApiMethods<T>,
    setPrev: (v: T[]) => void
  ): void {
    if (hydrating.current) return
    diffAndSync(current, prev, api)
    setPrev(current.slice())
  }

  useProjectStore.subscribe((s) => {
    watch(s.projects, prevProjects, apiProjects as ApiMethods<Project>, (v) => { prevProjects = v })
  })

  useTaskStore.subscribe((s) => {
    watch(s.tasks, prevTasks, apiTasks as ApiMethods<Task>, (v) => { prevTasks = v })
  })

  usePlanStore.subscribe((s) => {
    watch(s.plans,  prevPlans,  apiPlans  as ApiMethods<Plan>,      (v) => { prevPlans  = v })
    watch(s.phases, prevPhases, apiPhases as ApiMethods<PlanPhase>, (v) => { prevPhases = v })
  })

  useSprintStore.subscribe((s) => {
    watch(s.sprints, prevSprints, apiSprints as ApiMethods<Sprint>, (v) => { prevSprints = v })
  })

  useNoteStore.subscribe((s) => {
    watch(s.notes, prevNotes, apiNotes as ApiMethods<Note>, (v) => { prevNotes = v })
  })

  useDocumentStore.subscribe((s) => {
    watch(s.docs, prevDocs, apiDocs as ApiMethods<ProductDoc>, (v) => { prevDocs = v })
  })

  useGrowthStore.subscribe((s) => {
    watch(s.metrics,     prevMetrics,     apiMetrics     as ApiMethods<GrowthMetric>,     (v) => { prevMetrics     = v })
    watch(s.experiments, prevExperiments, apiExperiments as ApiMethods<GrowthExperiment>, (v) => { prevExperiments = v })
    watch(s.channels,    prevChannels,    apiChannels    as ApiMethods<GrowthChannel>,    (v) => { prevChannels    = v })
  })

  useTeamStore.subscribe((s) => {
    watch(s.members, prevTeam, apiTeam as ApiMethods<TeamMember>, (v) => { prevTeam = v })
  })

  useScheduleStore.subscribe((s) => {
    watch(s.events, prevSchedule, apiSchedule as ApiMethods<ScheduleEvent>, (v) => { prevSchedule = v })
  })

  useMeetingStore.subscribe((s) => {
    watch(s.meetings, prevMeetings, apiMeetings as ApiMethods<Meeting>, (v) => { prevMeetings = v })
  })

  useFinanceStore.subscribe((s) => {
    watch(s.entries, prevFinance, apiFinance as ApiMethods<FinanceEntry>, (v) => { prevFinance = v })
  })

  usePackageStore.subscribe((s) => {
    watch(s.packages, prevPackages, apiPackages as ApiMethods<FinancePackage>, (v) => { prevPackages = v })
  })

  useKpiStore.subscribe((s) => {
    watch(s.kpis, prevKpis, apiKpis as ApiMethods<Kpi>, (v) => { prevKpis = v })
  })

  useClientStore.subscribe((s) => {
    watch(s.clients, prevClients, apiClients as ApiMethods<Client>, (v) => { prevClients = v })
  })

  useContentStore.subscribe((s) => {
    watch(s.items, prevContent, apiContent as ApiMethods<ContentItem>, (v) => { prevContent = v })
  })

  usePortfolioStore.subscribe((s) => {
    watch(s.portfolios, prevPortfolios, apiPortfolios as ApiMethods<Portfolio>, (v) => { prevPortfolios = v })
  })

  usePermissionStore.subscribe((s) => {
    watch(s.users, prevUsers, apiUsers as ApiMethods<AppUser>, (v) => { prevUsers = v })

    // ProjectPermission uses a composite key (userId+projectId), not a single id.
    // Sync by detecting added or removed entries via JSON comparison of the composite key.
    if (!hydrating.current) {
      const current = s.permissions
      for (const perm of current) {
        const key = `${perm.userId}:${perm.projectId}`
        const old = prevPermissions.find((p) => `${p.userId}:${p.projectId}` === key)
        if (!old) {
          apiPermissions.set(perm).catch(console.error)
        } else if (JSON.stringify(old) !== JSON.stringify(perm)) {
          apiPermissions.set(perm).catch(console.error)
        }
      }
      for (const old of prevPermissions) {
        const key = `${old.userId}:${old.projectId}`
        if (!current.find((p) => `${p.userId}:${p.projectId}` === key)) {
          apiPermissions.remove(old.userId, old.projectId).catch(console.error)
        }
      }
      prevPermissions = current.slice()
    }
  })
}
