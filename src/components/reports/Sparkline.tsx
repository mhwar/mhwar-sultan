interface SparklineProps {
  data: number[]
  color?: string
  height?: number
}

/** Minimal SVG sparkline. Normalises the series into a 100×H viewBox. */
export default function Sparkline({ data, color = 'var(--iris-500)', height = 32 }: SparklineProps) {
  if (data.length === 0) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = data.length > 1 ? 100 / (data.length - 1) : 0
  const points = data.map((v, i) => {
    const x = i * step
    const y = 30 - ((v - min) / range) * 28 + 1
    return `${x},${y.toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: '100%', height, marginTop: 4 }}>
      <polyline points={points.join(' ')} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
