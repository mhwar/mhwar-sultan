import {
  Hexagon, Tag, Compass, Rocket, Lightbulb, Wrench, Smartphone, Globe,
  Folder, Zap, Target, Sparkles, Layers, Box, Flag, Palette,
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
