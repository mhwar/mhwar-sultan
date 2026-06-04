import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface PillProps {
  variant?: Variant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export default function Pill({ variant = 'neutral', dot = false, className, children }: PillProps) {
  return (
    <span className={cn('axis-pill', `axis-pill--${variant}`, className)}>
      {dot && <span className="axis-pill__dot" />}
      {children}
    </span>
  )
}
