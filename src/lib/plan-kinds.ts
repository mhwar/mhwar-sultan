import type { PlanKind, PlanDomain } from '@/types'

export interface PlanKindMeta {
  /** Singular noun for a section, e.g. "سبرنت". */
  unit: string
  /** Plural / collective label, e.g. "السبرنتات". */
  units: string
  /** Lucide icon key for a section. */
  icon: string
  /** Add-section button label, e.g. "إضافة سبرنت". */
  addLabel: string
}

export const PLAN_KINDS: Record<PlanKind, PlanKindMeta> = {
  roadmap: { unit: 'مرحلة', units: 'المراحل', icon: 'route', addLabel: 'إضافة مرحلة' },
  agile:   { unit: 'سبرنت', units: 'السبرنتات', icon: 'zap', addLabel: 'إضافة سبرنت' },
  launch:  { unit: 'مرحلة', units: 'مراحل الإطلاق', icon: 'rocket', addLabel: 'إضافة مرحلة' },
  course:  { unit: 'وحدة', units: 'الوحدات', icon: 'book', addLabel: 'إضافة وحدة' },
  content: { unit: 'قسم', units: 'الأقسام', icon: 'file-text', addLabel: 'إضافة قسم' },
  product: { unit: 'مرحلة', units: 'المراحل', icon: 'layers', addLabel: 'إضافة مرحلة' },
  custom:  { unit: 'قسم', units: 'الأقسام', icon: 'list-checks', addLabel: 'إضافة قسم' },
}

export function planKindMeta(kind?: PlanKind): PlanKindMeta {
  return PLAN_KINDS[kind ?? 'custom']
}

/** Which workspace tab a plan kind belongs to. `agile` is execution-only
 *  (migrated to sprints) — defaults to 'product' as a safe fallback. */
export function domainForKind(kind?: PlanKind): PlanDomain {
  switch (kind) {
    case 'content':
    case 'launch':
    case 'custom':
      return 'growth'
    default:
      // roadmap | product | course | agile (fallback) | undefined
      return 'product'
  }
}
