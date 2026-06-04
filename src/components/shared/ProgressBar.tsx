'use client'
import { useEffect, useState } from 'react'

interface ProgressBarProps {
  value: number
  color?: string
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const heights = { xs: 3, sm: 5, md: 8 }

export default function ProgressBar({
  value,
  color = '#6366F1',
  size = 'sm',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const [width, setWidth] = useState(0)
  const height = heights[size]

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {value}%
        </span>
      )}
    </div>
  )
}
