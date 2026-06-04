interface Segment {
  label: string
  value: number
  color: string
}

interface DonutProps {
  segments: Segment[]
}

/** SVG donut chart with a legend. */
export default function Donut({ segments }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = 60
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="report-donut">
      <svg className="report-donut__svg" viewBox="0 0 160 160">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="18" />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * c
            const dash = `${len} ${c - len}`
            const el = (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="axis-num" style={{ fontSize: '26px', fontWeight: 700, fill: 'var(--fg-1)' }}>
          {total}
        </text>
        <text x="80" y="96" textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--fg-3)' }}>مهمة</text>
      </svg>
      <ul className="report-donut__legend">
        {segments.map((seg, i) => (
          <li key={i}>
            <span className="dot" style={{ background: seg.color }} />
            <span className="report-donut__label">{seg.label}</span>
            <span className="report-donut__value">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
