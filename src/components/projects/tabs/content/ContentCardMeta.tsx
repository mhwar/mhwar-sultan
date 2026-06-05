'use client'
import { ListChecks, Maximize2 } from 'lucide-react'
import type { ContentItem } from '@/types'

/** Small dimensions badge shown on content cards & rows. */
export function DimBadge({ dimensions }: { dimensions?: string }) {
  if (!dimensions) return null
  return (
    <span className="inline-flex items-center gap-1 num-tabular" style={{ color: 'var(--color-text-muted)' }}>
      <Maximize2 size={10} /> {dimensions}
    </span>
  )
}

/** Checklist progress indicator (e.g. "3/5"), green when complete. */
export function ChecklistMeta({ item }: { item: ContentItem }) {
  const list = item.checklist
  if (!list || list.length === 0) return null
  const done = list.filter((c) => c.done).length
  const complete = done === list.length
  return (
    <span
      className="inline-flex items-center gap-1 num-tabular"
      style={{ color: complete ? 'var(--success-500)' : 'var(--color-text-muted)' }}
    >
      <ListChecks size={10} /> {done}/{list.length}
    </span>
  )
}
