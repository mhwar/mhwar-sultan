import {
  Hexagon, Tag, Compass, Rocket, Lightbulb, Wrench, Smartphone, Globe,
  Folder, Zap, Target, Sparkles, Layers, Box, Flag, Palette,
  Route, Megaphone, TrendingUp, FileText, FlaskConical, Users, Code, ListChecks, BookOpen,
  type LucideIcon,
} from 'lucide-react'

/** Project icon registry — keys persisted in Project.icon (lucide names). */
export const PROJECT_ICONS: Record<string, LucideIcon> = {
  hexagon: Hexagon,
  tag: Tag,
  compass: Compass,
  rocket: Rocket,
  lightbulb: Lightbulb,
  wrench: Wrench,
  smartphone: Smartphone,
  globe: Globe,
  folder: Folder,
  zap: Zap,
  target: Target,
  sparkles: Sparkles,
  layers: Layers,
  box: Box,
  flag: Flag,
  palette: Palette,
}

export const PROJECT_ICON_KEYS = Object.keys(PROJECT_ICONS)

export const DEFAULT_PROJECT_ICON = 'hexagon'

/** Resolve a stored icon value (key) to a lucide component, with a safe
    fallback for legacy/emoji values that are no longer valid keys. */
export function resolveProjectIcon(name: string | undefined): LucideIcon {
  if (name && PROJECT_ICONS[name]) return PROJECT_ICONS[name]
  return PROJECT_ICONS[DEFAULT_PROJECT_ICON]
}

interface ProjectIconProps {
  name: string | undefined
  size?: number
  className?: string
  style?: React.CSSProperties
}

/** Renders a project's icon as a lucide glyph (never an emoji). */
export default function ProjectIcon({ name, size = 20, className, style }: ProjectIconProps) {
  const Icon = resolveProjectIcon(name)
  return <Icon size={size} className={className} style={style} strokeWidth={1.5} />
}

/* ── Plan icons ── */
export const PLAN_ICONS: Record<string, LucideIcon> = {
  route: Route,
  megaphone: Megaphone,
  'trending-up': TrendingUp,
  'file-text': FileText,
  rocket: Rocket,
  layers: Layers,
  flask: FlaskConical,
  users: Users,
  palette: Palette,
  code: Code,
  'list-checks': ListChecks,
  target: Target,
  zap: Zap,
  book: BookOpen,
}

export const PLAN_ICON_KEYS = Object.keys(PLAN_ICONS)
export const DEFAULT_PLAN_ICON = 'route'

export function resolvePlanIcon(name: string | undefined): LucideIcon {
  return (name && PLAN_ICONS[name]) || PLAN_ICONS[DEFAULT_PLAN_ICON]
}

export function PlanIcon({ name, size = 14, className, style }: { name?: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = resolvePlanIcon(name)
  return <Icon size={size} className={className} style={style} strokeWidth={1.5} />
}
