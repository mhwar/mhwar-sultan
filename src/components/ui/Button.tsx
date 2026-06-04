import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'iris-soft'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  full = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn('axis-btn', `axis-btn--${variant}`, `axis-btn--${size}`, full && 'axis-btn--full', className)}
      {...props}
    >
      {children}
    </button>
  )
}
