'use client'
import { useEffect } from 'react'
import { useProjectStore, useTaskStore, usePlanStore, useNoteStore, useSprintStore, useDocumentStore, useGrowthStore, useTeamStore, useScheduleStore, useFinanceStore, useKpiStore, useClientStore, useContentStore, usePortfolioStore, useTaskFilterStore, bootstrapSprints } from '@/store/store'
import { useThemeStore } from '@/store/themeStore'
import { SEED_PROJECTS, SEED_CLIENTS, SEED_CONTENT } from '@/lib/seed-data'

/**
 * After rehydrating all stores, merge any seed records whose IDs are missing
 * from the live stores. This is idempotent: items already present are untouched.
 * New seed items (e.g. a new demo project added in a release) appear automatically
 * without requiring the user to clear localStorage.
 */
function syncMissingSeeds() {
  // Projects
  const liveProjects = useProjectStore.getState().projects
  const liveProjectIds = new Set(liveProjects.map((p) => p.id))
  for (const p of SEED_PROJECTS) {
    if (!liveProjectIds.has(p.id)) {
      useProjectStore.setState((s) => ({ projects: [...s.projects, p] }))
    }
  }

  // Clients
  const liveClients = useClientStore.getState().clients
  const liveClientIds = new Set(liveClients.map((c) => c.id))
  for (const c of SEED_CLIENTS) {
    if (!liveClientIds.has(c.id)) {
      useClientStore.setState((s) => ({ clients: [...s.clients, c] }))
    }
  }

  // Content items
  const liveItems = useContentStore.getState().items
  const liveItemIds = new Set(liveItems.map((i) => i.id))
  for (const item of SEED_CONTENT) {
    if (!liveItemIds.has(item.id)) {
      useContentStore.setState((s) => ({ items: [...s.items, item] }))
    }
  }
}

// Rehydrates all Zustand persist stores from localStorage after the initial
// React hydration pass, preventing hydration mismatches caused by localStorage
// data differing from the seed data used at build time.
export default function StoreHydration() {
  useEffect(() => {
    useProjectStore.persist.rehydrate()
    useTaskStore.persist.rehydrate()
    usePlanStore.persist.rehydrate()
    useNoteStore.persist.rehydrate()
    useThemeStore.persist.rehydrate()
    useSprintStore.persist.rehydrate()
    useDocumentStore.persist.rehydrate()
    useGrowthStore.persist.rehydrate()
    useTeamStore.persist.rehydrate()
    useScheduleStore.persist.rehydrate()
    useFinanceStore.persist.rehydrate()
    useKpiStore.persist.rehydrate()
    useClientStore.persist.rehydrate()
    useContentStore.persist.rehydrate()
    usePortfolioStore.persist.rehydrate()
    useTaskFilterStore.persist.rehydrate()
    // After every store is hydrated (synchronous, localStorage-backed), run the
    // one-time legacy `agile` plan → sprint migration. Guarded internally.
    bootstrapSprints()
    // Merge any seed records missing from live stores (idempotent).
    syncMissingSeeds()
  }, [])

  return null
}
