import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Sparkline from './Sparkline'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  series?: number[]
  color?: string
}

export default function MetricCard({ label, value, delta, series, color = 'var(--iris-500)' }: MetricCardProps) {
  const hasDelta = typeof delta === 'number' && delta !== 0
  const positive = (delta ?? 0) >= 0

  return (
    <div className="axis-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="axis-label">{label}</span>
        {hasDelta && (
          <span
            className="axis-num inline-flex items-center gap-1 px-1.5 rounded-full"
            style={{
              fontSize: '11px', fontWeight: 500,
              background: positive ? 'var(--feedback-success-bg)' : 'var(--feedback-danger-bg)',
              color: positive ? 'var(--success-600)' : 'var(--danger-600)',
            }}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta!)}%
          </span>
        )}
      </div>
      <div className="axis-num text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>{value}</div>
      {series && series.length > 1 && <Sparkline data={series} color={color} />}
    </div>
  )
}
