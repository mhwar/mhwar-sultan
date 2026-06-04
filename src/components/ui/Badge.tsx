import { cn } from '@/lib/utils'

type Variant = 'iris' | 'neutral'

interface BadgeProps {
  variant?: Variant
  className?: string
  children: React.ReactNode
}

export default function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return <span className={cn('axis-badge', `axis-badge--${variant}`, className)}>{children}</span>
}
