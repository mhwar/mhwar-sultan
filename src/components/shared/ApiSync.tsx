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
import { syncMissingSeeds } from '@/components/shared/StoreHydration'
import {
  apiAvailable, apiSyncPull, apiSyncPush,
  type SyncSnapshot,
} from '@/lib/api'
import { enqueue, drain, pendingIds, hasPending } from '@/lib/syncQueue'
import type {
  Project, Task, Plan, PlanPhase, Sprint, Note, ProductDoc,
  TeamMember, ScheduleEvent, Meeting, FinanceEntry, FinancePackage,
  Kpi, Client, GrowthMetric, GrowthExperiment, GrowthChannel,
  ContentItem, Portfolio, AppUser, ProjectPermission,
} from '@/types'

// ── Generic array-diffing watcher ─────────────────────────
//
// Mutations are written to a durable, localStorage-backed queue (see syncQueue)
// rather than fired and forgotten. The queue survives refreshes and retries on
// failure, and pullAndHydrate drains it before pulling so local changes always
// reach D1 before the authoritative snapshot is applied.

type HasId = { id: string }

function diffAndSync<T extends HasId>(
  current: T[],
  prev: T[],
  resource: string
): void {
  for (const item of current) {
    const old = prev.find((o) => o.id === item.id)
    if (!old) {
      enqueue({ resource, kind: 'create', id: item.id, data: item })
    } else if (JSON.stringify(old) !== JSON.stringify(item)) {
      enqueue({ resource, kind: 'update', id: item.id, data: item })
    }
  }
  for (const old of prev) {
    if (!current.find((c) => c.id === old.id)) {
      enqueue({ resource, kind: 'delete', id: old.id })
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
    // Flush every queued local mutation to D1 before pulling authoritative data.
    // This guarantees local creates/edits/deletes are persisted server-side first,
    // so the snapshot we apply already reflects them — no resurrection of deletes,
    // no clobbering of un-synced creates.
    await drain()
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
      if (!available) {
        // No cloud API — apply demo seeds so the app has content to show.
        syncMissingSeeds()
        return
      }
      if (cancelled) return

      await pullAndHydrate()
      if (cancelled) return

      if (!watchersStarted.current) {
        watchersStarted.current = true
        startWatchers(hydrating)
      }
    })()

    return () => { cancelled = true }
  }, [signedInEmail, pullAndHydrate])

  // Converge on the latest shared state without a manual reload:
  //  • on tab focus / visibility regain (immediate),
  //  • every 15s while the tab is visible (so account B sees account A's changes),
  //  • flush the write queue when the tab is hidden or unloading (keepalive
  //    fetches finish even after the page starts closing).
  useEffect(() => {
    if (!signedInEmail) return

    const refresh = () => {
      if (document.visibilityState === 'visible' && !hydrating.current) {
        pullAndHydrate().catch(() => {})
      }
    }
    const flush = () => { if (hasPending()) drain().catch(() => {}) }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
      else refresh()
    }

    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    window.addEventListener('pagehide', flush)

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !hydrating.current && !hasPending()) {
        pullAndHydrate().catch(() => {})
      }
    }, 15_000)

    return () => {
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pagehide', flush)
      window.clearInterval(interval)
    }
  }, [signedInEmail, pullAndHydrate])

  return null
}

// ── Store hydration ───────────────────────────────────────

function hydrateStores(snap: SyncSnapshot): void {
  // Apply the server snapshot, but preserve any local record whose write hasn't
  // been confirmed by D1 yet (still in the queue and absent from the snapshot).
  // This keeps server-side permission filtering intact — blocked items are never
  // queued, so they're still cleared — while preventing a just-created record from
  // vanishing if the pull lands before its write is acknowledged.
  const pend = pendingIds()
  const merge = <T extends { id: string }>(server: T[], local: T[]): T[] => {
    if (pend.size === 0) return server
    const serverIds = new Set(server.map((r) => r.id))
    const survivors = local.filter((r) => pend.has(r.id) && !serverIds.has(r.id))
    return survivors.length ? [...server, ...survivors] : server
  }

  useProjectStore.setState((s) => ({ projects:  merge(snap.projects, s.projects) }))
  useTaskStore.setState((s) => ({ tasks:        merge(snap.tasks, s.tasks) }))
  usePlanStore.setState((s) => ({ plans: merge(snap.plans, s.plans), phases: merge(snap.phases, s.phases) }))
  useSprintStore.setState((s) => ({ sprints:    merge(snap.sprints, s.sprints) }))
  useNoteStore.setState((s) => ({ notes:        merge(snap.notes, s.notes) }))
  useDocumentStore.setState((s) => ({ docs:     merge(snap.docs, s.docs) }))
  useTeamStore.setState((s) => ({ members:      merge(snap.team, s.members) }))
  useScheduleStore.setState((s) => ({ events:   merge(snap.schedule, s.events) }))
  useMeetingStore.setState((s) => ({ meetings:  merge(snap.meetings, s.meetings) }))
  useFinanceStore.setState((s) => ({ entries:   merge(snap.finance, s.entries) }))
  usePackageStore.setState((s) => ({ packages:  merge(snap.packages, s.packages) }))
  useKpiStore.setState((s) => ({ kpis:          merge(snap.kpis, s.kpis) }))
  useClientStore.setState((s) => ({ clients:    merge(snap.clients, s.clients) }))
  useGrowthStore.setState((s) => ({
    metrics:     merge(snap.metrics, s.metrics),
    experiments: merge(snap.experiments, s.experiments),
    channels:    merge(snap.channels, s.channels),
  }))
  useContentStore.setState((s) => ({ items:     merge(snap.content, s.items) }))
  usePortfolioStore.setState((s) => ({ portfolios: merge(snap.portfolios, s.portfolios) }))
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
    resource: string,
    setPrev: (v: T[]) => void
  ): void {
    if (hydrating.current) { setPrev(current.slice()); return }
    diffAndSync(current, prev, resource)
    setPrev(current.slice())
  }

  useProjectStore.subscribe((s) => {
    watch(s.projects, prevProjects, 'projects', (v) => { prevProjects = v })
  })

  useTaskStore.subscribe((s) => {
    watch(s.tasks, prevTasks, 'tasks', (v) => { prevTasks = v })
  })

  usePlanStore.subscribe((s) => {
    watch(s.plans,  prevPlans,  'plans',  (v) => { prevPlans  = v })
    watch(s.phases, prevPhases, 'phases', (v) => { prevPhases = v })
  })

  useSprintStore.subscribe((s) => {
    watch(s.sprints, prevSprints, 'sprints', (v) => { prevSprints = v })
  })

  useNoteStore.subscribe((s) => {
    watch(s.notes, prevNotes, 'notes', (v) => { prevNotes = v })
  })

  useDocumentStore.subscribe((s) => {
    watch(s.docs, prevDocs, 'docs', (v) => { prevDocs = v })
  })

  useGrowthStore.subscribe((s) => {
    watch(s.metrics,     prevMetrics,     'metrics',     (v) => { prevMetrics     = v })
    watch(s.experiments, prevExperiments, 'experiments', (v) => { prevExperiments = v })
    watch(s.channels,    prevChannels,    'channels',    (v) => { prevChannels    = v })
  })

  useTeamStore.subscribe((s) => {
    watch(s.members, prevTeam, 'team', (v) => { prevTeam = v })
  })

  useScheduleStore.subscribe((s) => {
    watch(s.events, prevSchedule, 'schedule', (v) => { prevSchedule = v })
  })

  useMeetingStore.subscribe((s) => {
    watch(s.meetings, prevMeetings, 'meetings', (v) => { prevMeetings = v })
  })

  useFinanceStore.subscribe((s) => {
    watch(s.entries, prevFinance, 'finance', (v) => { prevFinance = v })
  })

  usePackageStore.subscribe((s) => {
    watch(s.packages, prevPackages, 'packages', (v) => { prevPackages = v })
  })

  useKpiStore.subscribe((s) => {
    watch(s.kpis, prevKpis, 'kpis', (v) => { prevKpis = v })
  })

  useClientStore.subscribe((s) => {
    watch(s.clients, prevClients, 'clients', (v) => { prevClients = v })
  })

  useContentStore.subscribe((s) => {
    watch(s.items, prevContent, 'content', (v) => { prevContent = v })
  })

  usePortfolioStore.subscribe((s) => {
    watch(s.portfolios, prevPortfolios, 'portfolios', (v) => { prevPortfolios = v })
  })

  usePermissionStore.subscribe((s) => {
    watch(s.users, prevUsers, 'users', (v) => { prevUsers = v })

    // ProjectPermission uses a composite key (userId+projectId), not a single id.
    // Queue added/changed/removed entries through the durable queue, keyed by the
    // composite id so the queue de-dups and persists them like every other write.
    const current = s.permissions
    if (!hydrating.current) {
      for (const perm of current) {
        const key = `${perm.userId}:${perm.projectId}`
        const old = prevPermissions.find((p) => `${p.userId}:${p.projectId}` === key)
        if (!old || JSON.stringify(old) !== JSON.stringify(perm)) {
          enqueue({ resource: 'permissions', kind: 'update', id: key, data: perm })
        }
      }
      for (const old of prevPermissions) {
        const key = `${old.userId}:${old.projectId}`
        if (!current.find((p) => `${p.userId}:${p.projectId}` === key)) {
          enqueue({ resource: 'permissions', kind: 'delete', id: key, data: { userId: old.userId, projectId: old.projectId } })
        }
      }
    }
    // Always advance the baseline (even during hydration) so a replaced list is
    // not later diffed as user edits.
    prevPermissions = current.slice()
  })
}
