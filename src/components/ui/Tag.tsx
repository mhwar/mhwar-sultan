import { cn } from '@/lib/utils'

type Variant = 'iris' | 'neutral' | 'success' | 'danger'

interface TagProps {
  variant?: Variant
  className?: string
  children: React.ReactNode
}

export default function Tag({ variant = 'neutral', className, children }: TagProps) {
  return <span className={cn('axis-tag', `axis-tag--${variant}`, className)}>{children}</span>
}
