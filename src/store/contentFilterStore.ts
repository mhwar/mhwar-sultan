import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContentPlatform, ContentSource } from '@/types'
import type { ContentStage } from '@/components/projects/tabs/content/contentMeta'
import { generateId } from '@/lib/utils'

/** A reusable snapshot of the content filters, scoped to one project. */
export interface ContentFilterPreset {
  id: string
  projectId: string
  name: string
  client: string                       // client id or 'all'
  stage: ContentStage | 'all'
  source: ContentSource | 'all'
  platform: ContentPlatform | 'all'
  createdAt: string
}

export type PresetValues = Omit<ContentFilterPreset, 'id' | 'projectId' | 'name' | 'createdAt'>

interface ContentFilterStore {
  presets: ContentFilterPreset[]
  addPreset: (projectId: string, name: string, values: PresetValues) => string
  deletePreset: (id: string) => void
}

/** Persisted separately from the main store so saved filters survive reloads.
 *  Uses skipHydration + an explicit rehydrate() (called from the consuming
 *  component) to match the project's SSR-safe hydration pattern. */
export const useContentFilterStore = create<ContentFilterStore>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (projectId, name, values) => {
        const id = generateId()
        set((s) => ({
          presets: [...s.presets, { ...values, id, projectId, name, createdAt: new Date().toISOString() }],
        }))
        return id
      },
      deletePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: 'mhwar-content-filters', version: 1, skipHydration: true }
  )
)
