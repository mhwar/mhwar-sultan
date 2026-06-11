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

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'
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

export function localSnapshot(): Partial<SyncSnapshot> {
  return {
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
}

export default function ApiSync() {
  const signedInEmail   = usePermissionStore((s) => s.signedInEmail)
  const hydrating       = useRef(false)
  const watchersStarted = useRef(false)
  const migratedRef     = useRef(false)

  // Pull D1 and reconcile local stores. D1 is authoritative: on success we
  // replace local data with it. We only ever push the full local snapshot once,
  // when D1 is genuinely empty and the caller may seed it — never on a failed
  // pull, which previously resurrected deleted records.
  const pullAndHydrate = useCallback(async (): Promise<void> => {
    const snap = await apiSyncPull()
    if (!snap) return // pull failed/unauthorised — keep local, never push

    if (!snap.seeded) {
      // D1 holds no projects yet. Seed it once from local data — but only the
      // owner/admin may, so a member's browser never repopulates a shared DB.
      if (migratedRef.current) return
      const me = usePermissionStore.getState().getSignedInUser()
      const mayMigrate = !me || me.systemRole === 'admin'
      if (!mayMigrate) return
      migratedRef.current = true
      hydrating.current = true
      await apiSyncPush(localSnapshot())
      hydrating.current = false
      return
    }

    // Authoritative replace. Guarded so the watchers treat it as a baseline
    // update, not a user mutation to push back.
    hydrating.current = true
    hydrateStores(snap)
    hydrating.current = false
  }, [])

  useEffect(() => {
    if (!signedInEmail) return
    let cancelled = false

    ;(async () => {
      const available = await apiAvailable()
      if (!available || cancelled) return

      await pullAndHydrate()
      if (cancelled) return

      if (!watchersStarted.current) {
        watchersStarted.current = true
        startWatchers(hydrating)
      }
    })()

    return () => { cancelled = true }
  }, [signedInEmail, pullAndHydrate])

  // Refresh when the tab regains focus, so a browser left open converges on the
  // latest shared state (deletes/edits made elsewhere) without a manual reload.
  useEffect(() => {
    if (!signedInEmail) return
    const refresh = () => {
      if (document.visibilityState === 'visible' && !hydrating.current) {
        pullAndHydrate().catch(() => {})
      }
    }
    window.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [signedInEmail, pullAndHydrate])

  return null
}

// ── Store hydration ───────────────────────────────────────

function hydrateStores(snap: SyncSnapshot): void {
  // Replace data tables unconditionally (even when empty) so the server-side
  // permission filtering is respected: a member who lacks finance/content/project
  // access gets those arrays cleared from their browser, never seeing stale local
  // data they no longer have permission for.
  useProjectStore.setState({ projects:  snap.projects })
  useTaskStore.setState({ tasks:        snap.tasks })
  usePlanStore.setState({ plans:        snap.plans, phases: snap.phases })
  useSprintStore.setState({ sprints:    snap.sprints })
  useNoteStore.setState({ notes:        snap.notes })
  useDocumentStore.setState({ docs:     snap.docs })
  useTeamStore.setState({ members:      snap.team })
  useScheduleStore.setState({ events:   snap.schedule })
  useMeetingStore.setState({ meetings:  snap.meetings })
  useFinanceStore.setState({ entries:   snap.finance })
  usePackageStore.setState({ packages:  snap.packages })
  useKpiStore.setState({ kpis:          snap.kpis })
  useClientStore.setState({ clients:    snap.clients })
  useGrowthStore.setState({ metrics: snap.metrics, experiments: snap.experiments, channels: snap.channels })
  useContentStore.setState({ items:     snap.content })
  usePortfolioStore.setState({ portfolios: snap.portfolios })
  // Users & permissions drive the client-side permission UI and are admin-only in
  // the snapshot. Only hydrate when present so a member keeps their own identity
  // context (their matched user) rather than having it wiped to an empty list.
  if (snap.users.length)       usePermissionStore.setState({ users:       snap.users })
  if (snap.permissions.length) usePermissionStore.setState({ permissions: snap.permissions })
}

// ── Mutation watchers ─────────────────────────────────────

function startWatchers(hydrating: MutableRefObject<boolean>): void {
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

  // Wrap diff+sync with hydration guard. During an authoritative hydrate we only
  // advance the baseline to the incoming state — never push it back — so a pull
  // that replaced local data is not mistaken for user edits (which previously
  // resurrected records deleted elsewhere).
  function watch<T extends HasId>(
    current: T[],
    prev: T[],
    api: ApiMethods<T>,
    setPrev: (v: T[]) => void
  ): void {
    if (hydrating.current) { setPrev(current.slice()); return }
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
    const current = s.permissions
    if (!hydrating.current) {
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
    }
    // Always advance the baseline (even during hydration) so a replaced list is
    // not later diffed as user edits.
    prevPermissions = current.slice()
  })
}
