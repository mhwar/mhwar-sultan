'use client'
import { useEffect } from 'react'
import { useProjectStore, useTaskStore, usePlanStore, useNoteStore, useSprintStore, useDocumentStore, useGrowthStore, useTeamStore, useScheduleStore, useMeetingStore, useFinanceStore, usePackageStore, useKpiStore, useClientStore, useContentStore, usePortfolioStore, useProfileStore, useTaskFilterStore, bootstrapSprints } from '@/store/store'
import { useThemeStore } from '@/store/themeStore'
import { SEED_PROJECTS, SEED_CLIENTS, SEED_CONTENT, SEED_PROFILES } from '@/lib/seed-data'

/**
 * Merge any seed records whose IDs are missing from the live stores.
 * Called only when the API is unreachable (local-only mode) so cloud users
 * never see a flash of deleted seed items on page refresh.
 */
export function syncMissingSeeds() {
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

  // Product profiles
  const liveProfiles = useProfileStore.getState().profiles
  const liveProfileIds = new Set(liveProfiles.map((p) => p.id))
  for (const profile of SEED_PROFILES) {
    if (!liveProfileIds.has(profile.id)) {
      useProfileStore.setState((s) => ({ profiles: [...s.profiles, profile] }))
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
    useMeetingStore.persist.rehydrate()
    useFinanceStore.persist.rehydrate()
    usePackageStore.persist.rehydrate()
    useKpiStore.persist.rehydrate()
    useClientStore.persist.rehydrate()
    useContentStore.persist.rehydrate()
    usePortfolioStore.persist.rehydrate()
    useProfileStore.persist.rehydrate()
    useTaskFilterStore.persist.rehydrate()
    // After every store is hydrated (synchronous, localStorage-backed), run the
    // one-time legacy `agile` plan → sprint migration. Guarded internally.
    bootstrapSprints()
  }, [])

  return null
}
