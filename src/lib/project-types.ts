/**
 * Project type registry. Each type maps to a default set of tools (tabs) that
 * get enabled when a project of that type is created, plus an optional starter
 * plan template id (from PLAN_TEMPLATES) for smart setup.
 */
export interface ProjectType {
  id: string
  label: string
  /** lucide key resolved via ProjectIcon */
  icon: string
  description: string
  defaultToolIds: string[]
  suggestedCategory: string
  /** PLAN_TEMPLATES id applied on creation for smart setup (optional). */
  starterTemplateId?: string
}

export const DEFAULT_PROJECT_TYPE = 'technical'

/** Legacy default — projects created before the modular-tools change. */
export const FALLBACK_TOOL_IDS = ['overview', 'product', 'growth', 'execution', 'notes']

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'technical',
    label: 'تقني / منصة',
    icon: 'hexagon',
    description: 'منتج أو منصة أو تطبيق — منتج وخارطة طريق ونمو وتنفيذ',
    defaultToolIds: ['overview', 'product', 'growth', 'execution', 'notes'],
    suggestedCategory: 'منصة',
    starterTemplateId: 'roadmap',
  },
  {
    id: 'event',
    label: 'مناسبة / ملتقى',
    icon: 'flag',
    description: 'إدارة فعالية أو ملتقى جماهيري — أجندة وفريق وتنفيذ ومالية',
    defaultToolIds: ['overview', 'schedule', 'team', 'execution', 'finance', 'notes'],
    suggestedCategory: 'مناسبة',
  },
  {
    id: 'content',
    label: 'محتوى / إعلام',
    icon: 'palette',
    description: 'إنتاج محتوى ونشر — تنفيذ ومؤشرات وملاحظات',
    defaultToolIds: ['overview', 'execution', 'kpis', 'notes'],
    suggestedCategory: 'محتوى',
  },
  {
    id: 'general',
    label: 'عام / أخرى',
    icon: 'folder',
    description: 'مشروع بسيط بالأدوات الأساسية فقط',
    defaultToolIds: ['overview', 'execution', 'notes'],
    suggestedCategory: '',
  },
]

export const PROJECT_TYPES_BY_ID: Record<string, ProjectType> = Object.fromEntries(
  PROJECT_TYPES.map((t) => [t.id, t])
)

export function getProjectType(id: string | undefined): ProjectType {
  return (id && PROJECT_TYPES_BY_ID[id]) || PROJECT_TYPES_BY_ID[DEFAULT_PROJECT_TYPE]
}
