import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label?: string
  icon?: React.ReactNode
  title?: string
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Axis view-switcher / segmented control. */
export default function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn('axis-view-switcher', className)} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          title={opt.title ?? opt.label}
          onClick={() => onChange(opt.value)}
          className={cn('axis-view-switcher__btn', value === opt.value && 'is-on')}
        >
          {opt.icon}
          {opt.label && <span>{opt.label}</span>}
        </button>
      ))}
    </div>
  )
}
