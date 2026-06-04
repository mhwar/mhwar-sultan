import { cn } from '@/lib/utils'

type Variant = 'ghost' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export default function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn('axis-iconbtn', `axis-iconbtn--${size}`, `axis-iconbtn--${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  )
}
