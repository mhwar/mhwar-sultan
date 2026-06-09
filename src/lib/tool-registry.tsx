import {
  LayoutDashboard, Package, TrendingUp, Zap, FileText,
  Users2, CalendarDays, CalendarClock, Wallet, Gauge, Building2, Layers, type LucideIcon,
} from 'lucide-react'
import type { Project } from '@/types'
import OverviewTab from '@/components/projects/tabs/OverviewTab'
import ProductTab from '@/components/projects/tabs/ProductTab'
import GrowthTab from '@/components/projects/tabs/GrowthTab'
import ExecutionTab from '@/components/projects/tabs/ExecutionTab'
import NotesTab from '@/components/projects/tabs/NotesTab'
import TeamTab from '@/components/projects/tabs/TeamTab'
import ScheduleTab from '@/components/projects/tabs/ScheduleTab'
import FinanceTab from '@/components/projects/tabs/FinanceTab'
import KpisTab from '@/components/projects/tabs/KpisTab'
import ClientsTab from '@/components/projects/tabs/ClientsTab'
import ContentTab from '@/components/projects/tabs/ContentTab'
import MeetingsTab from '@/components/projects/tabs/MeetingsTab'

/**
 * A tool = a tab = a page within a project. The registry is the single source
 * of truth: ProjectDetailClient renders `project.tools` mapped through here, and
 * the tools library offers everything in `TOOLS` that isn't already enabled.
 *
 * To add a new tool: build a `({ project })` tab component (self-fetching from
 * its own store), then add one entry below. Optionally list its id in a
 * ProjectType.defaultToolIds.
 */
export interface ToolDef {
  id: string
  label: string
  icon: LucideIcon
  description: string
  render: (project: Project) => React.ReactNode
  /** Core tools can't be removed from a project. */
  core?: boolean
  /** If set, the library only suggests this tool for these project types. */
  allowedTypes?: string[]
  /** Grouping label in the tools library. */
  group?: string
}

export const TOOLS: ToolDef[] = [
  {
    id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, group: 'أساسية', core: true,
    description: 'ملخص المشروع والتقدم والروابط',
    render: (p) => <OverviewTab project={p} />,
  },
  {
    id: 'execution', label: 'التنفيذ', icon: Zap, group: 'أساسية', core: true,
    description: 'سبرنتات ومهام وكانبان',
    render: (p) => <ExecutionTab project={p} />,
  },
  {
    id: 'notes', label: 'الملاحظات', icon: FileText, group: 'أساسية', core: true,
    description: 'ملاحظات وأفكار المشروع',
    render: (p) => <NotesTab project={p} />,
  },
  {
    id: 'product', label: 'المنتج', icon: Package, group: 'تقنية', allowedTypes: ['technical'],
    description: 'مواصفات ومستندات وخارطة طريق ومميزات',
    render: (p) => <ProductTab project={p} />,
  },
  {
    id: 'growth', label: 'النمو', icon: TrendingUp, group: 'تقنية', allowedTypes: ['technical'],
    description: 'مقاييس AARRR وتجارب وقنوات نمو',
    render: (p) => <GrowthTab project={p} />,
  },
  {
    id: 'schedule', label: 'الأجندة', icon: CalendarDays, group: 'التشغيل',
    description: 'برنامج زمني وفقرات الفعالية',
    render: (p) => <ScheduleTab project={p} />,
  },
  {
    id: 'meetings', label: 'الاجتماعات', icon: CalendarClock, group: 'التشغيل',
    description: 'اجتماعات دورية: أجندة ومنجزات وتحديات وقرارات وبنود عمل',
    render: (p) => <MeetingsTab project={p} />,
  },
  {
    id: 'team', label: 'الفريق', icon: Users2, group: 'التشغيل',
    description: 'أعضاء الفريق وأدوارهم وجهات التواصل',
    render: (p) => <TeamTab project={p} />,
  },
  {
    id: 'finance', label: 'المالية', icon: Wallet, group: 'التشغيل',
    description: 'ميزانية ومصروفات وإيرادات',
    render: (p) => <FinanceTab project={p} />,
  },
  {
    id: 'kpis', label: 'المؤشرات', icon: Gauge, group: 'التشغيل',
    description: 'لوحة مؤشرات عامة قابلة للتخصيص',
    render: (p) => <KpisTab project={p} />,
  },
  {
    id: 'clients', label: 'العملاء', icon: Building2, group: 'إدارة العملاء',
    description: 'عملاؤك وتفاصيل عقودهم الشهرية',
    render: (p) => <ClientsTab project={p} />,
  },
  {
    id: 'content', label: 'المحتوى', icon: Layers, group: 'إدارة العملاء',
    description: 'منشورات وتصاميم وتسليمات المحتوى لكل عميل',
    render: (p) => <ContentTab project={p} />,
  },
]

export const TOOLS_BY_ID: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

export function getTool(id: string): ToolDef | undefined {
  return TOOLS_BY_ID[id]
}

export function isCoreTool(id: string): boolean {
  return !!TOOLS_BY_ID[id]?.core
}
