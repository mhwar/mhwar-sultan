import { STATUS_LABELS } from '@/lib/utils'
import type { ProjectStatus } from '@/types'
import Pill from '@/components/ui/Pill'

type PillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const STATUS_PILL: Record<ProjectStatus, PillVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
  planning: 'neutral',
}

interface StatusBadgeProps {
  status: ProjectStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Pill variant={STATUS_PILL[status]} dot>
      {STATUS_LABELS[status]}
    </Pill>
  )
}
