'use client'
import { useEffect } from 'react'
import { useProjectStore, useTaskStore, usePlanStore, useNoteStore, useSprintStore, useDocumentStore, bootstrapSprints } from '@/store/store'
import { useThemeStore } from '@/store/themeStore'

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
    // After every store is hydrated (synchronous, localStorage-backed), run the
    // one-time legacy `agile` plan → sprint migration. Guarded internally.
    bootstrapSprints()
  }, [])

  return null
}
