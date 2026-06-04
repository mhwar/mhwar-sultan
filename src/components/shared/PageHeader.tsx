import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  sub?: string
  meta?: React.ReactNode
  actions?: React.ReactNode
  banner?: boolean
  children?: React.ReactNode
}

/** Axis page header — eyebrow / title / sub / meta + actions slot. */
export default function PageHeader({ eyebrow, title, sub, meta, actions, banner, children }: PageHeaderProps) {
  return (
    <div className={cn('axis-pageheader', banner && 'axis-pageheader--banner')}>
      {banner && <div className="axis-pageheader__bg" />}
      <div className="axis-pageheader__body">
        <div className="axis-pageheader__row">
          <div className="axis-pageheader__title-block">
            {eyebrow && <span className="axis-pageheader__eyebrow">{eyebrow}</span>}
            <div className="axis-pageheader__title-line">
              <h1 className="axis-pageheader__title">{title}</h1>
            </div>
            {sub && <p className="axis-pageheader__sub">{sub}</p>}
            {meta && <div className="axis-pageheader__meta">{meta}</div>}
          </div>
          {actions && <div className="axis-pageheader__actions">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
