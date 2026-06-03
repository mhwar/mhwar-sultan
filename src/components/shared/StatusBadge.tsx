import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

interface StatusBadgeProps {
  status: ProjectStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
        padding: size === 'sm' ? '0.2rem 0.6rem' : '0.25rem 0.75rem',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: colors.text }}
      />
      {label}
    </span>
  )
}
