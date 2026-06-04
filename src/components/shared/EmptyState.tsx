import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
      >
        <Icon size={28} style={{ color: 'var(--fg-3)' }} strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold mb-1" style={{ color: 'var(--fg-1)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-4 max-w-xs" style={{ color: 'var(--fg-3)' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
