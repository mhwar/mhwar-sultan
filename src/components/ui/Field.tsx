'use client'
import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  as?: 'input' | 'select'
  type?: string
  required?: boolean
  dir?: 'rtl' | 'ltr'
  min?: number
  max?: number
  icon?: React.ReactNode
  children?: React.ReactNode // <option>s when as="select"
  className?: string
}

/** Axis floating-label field for single-line input / select controls. */
export default function Field({
  label,
  value,
  onChange,
  as = 'input',
  type = 'text',
  required,
  dir,
  min,
  max,
  icon,
  children,
  className,
}: FieldProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const filled = value !== '' && value !== undefined && value !== null

  return (
    <div
      className={cn(
        'axis-field',
        focused && 'is-focused',
        (filled || as === 'select') && 'is-filled',
        icon && 'has-icon',
        className,
      )}
    >
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      {as === 'select' ? (
        <select
          id={id}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ appearance: 'none' }}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          dir={dir}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
      {icon && <span className="axis-field__icon">{icon}</span>}
    </div>
  )
}
