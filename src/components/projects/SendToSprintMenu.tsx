'use client'
import { useState } from 'react'
import { Send, Plus, Zap } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore } from '@/store/store'
import { sendToSprint, SPRINT_STATUS_VAR } from '@/lib/sprint-utils'

interface SendToSprintMenuProps {
  projectId: string
  title: string
  phaseId?: string
  milestoneId?: string
  done?: boolean
  className?: string
}

/** A "send to sprint" affordance: opens a menu of the project's sprints plus a
 *  "new sprint" option. Adds the item as a task to the chosen sprint, or spins
 *  up a new sprint whose goal is the item. */
export default function SendToSprintMenu({ projectId, title, phaseId, milestoneId, done, className }: SendToSprintMenuProps) {
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === projectId).sort((a, b) => a.order - b.order)))
  const [open, setOpen] = useState(false)

  const go = (sprintId?: string) => {
    sendToSprint({ projectId, title, sprintId, phaseId, milestoneId, done })
    setOpen(false)
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost"
        title="أرسل إلى سبرنت"
        aria-label="أرسل إلى سبرنت"
      >
        <Send size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div className="absolute end-0 top-8 z-20 axis-menu" style={{ minWidth: 180 }} onClick={(e) => e.stopPropagation()}>
            <div className="axis-label px-2 pt-1 pb-1.5" style={{ color: 'var(--fg-3)' }}>أرسل إلى سبرنت</div>
            {sprints.map((sp) => (
              <button key={sp.id} className="axis-menu__item" onClick={() => go(sp.id)}>
                <span className="w-2 h-2 rounded-full" style={{ background: SPRINT_STATUS_VAR[sp.status] }} />
                <span className="truncate">{sp.name}</span>
              </button>
            ))}
            <button className="axis-menu__item" onClick={() => go(undefined)} style={{ borderTop: sprints.length ? '1px solid var(--border-subtle)' : undefined }}>
              <Plus size={13} /><span>سبرنت جديد</span>
              <Zap size={12} style={{ marginInlineStart: 'auto', color: 'var(--color-brand)' }} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
