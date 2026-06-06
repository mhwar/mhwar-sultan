'use client'
import { useState } from 'react'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Bookmark, BookmarkPlus, Check } from 'lucide-react'
import type { Portfolio, Project, TaskPriority, TaskStatus } from '@/types'
import type { TeamMember } from '@/types'
import type { TaskFilterPreset } from '@/store/store'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, TASK_STATUS_VAR, PRIORITY_VAR } from '@/lib/utils'
import ProjectIcon from '@/lib/icons'

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done']
const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low']

interface Props {
  portfolios: Portfolio[]
  projects: Project[]
  assignees: TeamMember[]
  taskCounts: Map<string, number>
  filterPortfolio: string
  setFilterPortfolio: (v: string) => void
  filterProject: string
  setFilterProject: (v: string) => void
  filterAssignee: string
  setFilterAssignee: (v: string) => void
  filterPriority: TaskPriority | 'all'
  setFilterPriority: (v: TaskPriority | 'all') => void
  filterStatus: TaskStatus | 'all'
  setFilterStatus: (v: TaskStatus | 'all') => void
  presets: TaskFilterPreset[]
  onSavePreset: (name: string) => void
  onApplyPreset: (id: string) => void
  onDeletePreset: (id: string) => void
}

export default function TaskFilterBar({
  portfolios, projects, assignees, taskCounts,
  filterPortfolio, setFilterPortfolio,
  filterProject, setFilterProject,
  filterAssignee, setFilterAssignee,
  filterPriority, setFilterPriority,
  filterStatus, setFilterStatus,
  presets, onSavePreset, onApplyPreset, onDeletePreset,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [naming, setNaming] = useState(false)
  const [presetName, setPresetName] = useState('')

  const activeCount = [
    filterPortfolio !== 'all',
    filterProject !== 'all',
    filterAssignee !== 'all',
    filterPriority !== 'all',
    filterStatus !== 'all',
  ].filter(Boolean).length

  const clearAll = () => {
    setFilterPortfolio('all')
    setFilterProject('all')
    setFilterAssignee('all')
    setFilterPriority('all')
    setFilterStatus('all')
  }

  const doSave = () => {
    const n = presetName.trim()
    if (!n) return
    onSavePreset(n)
    setPresetName('')
    setNaming(false)
  }

  // Active filter chips for the collapsed summary
  const activeChips: { label: string; color: string; clear: () => void }[] = []
  if (filterPortfolio !== 'all') {
    const pf = portfolios.find((p) => p.id === filterPortfolio)
    if (pf) activeChips.push({ label: pf.name, color: pf.color, clear: () => setFilterPortfolio('all') })
  }
  if (filterProject !== 'all') {
    const pr = projects.find((p) => p.id === filterProject)
    if (pr) activeChips.push({ label: pr.name, color: pr.color, clear: () => setFilterProject('all') })
  }
  if (filterStatus !== 'all') {
    activeChips.push({ label: TASK_STATUS_LABELS[filterStatus], color: TASK_STATUS_VAR[filterStatus], clear: () => setFilterStatus('all') })
  }
  if (filterPriority !== 'all') {
    activeChips.push({ label: PRIORITY_LABELS[filterPriority], color: PRIORITY_VAR[filterPriority], clear: () => setFilterPriority('all') })
  }
  if (filterAssignee !== 'all') {
    const m = assignees.find((a) => a.id === filterAssignee)
    if (m) activeChips.push({ label: m.name, color: 'var(--iris-500)', clear: () => setFilterAssignee('all') })
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-overlay)' }}>
      {/* Summary bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 shrink-0 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors hover:bg-white/8"
          style={{
            color: activeCount > 0 ? 'var(--iris-500)' : 'var(--color-text-secondary)',
            background: activeCount > 0 ? 'color-mix(in oklch, var(--iris-500) 12%, transparent)' : 'transparent',
            border: `1px solid ${activeCount > 0 ? 'color-mix(in oklch, var(--iris-500) 30%, transparent)' : 'var(--color-surface-border)'}`,
          }}
        >
          <SlidersHorizontal size={13} />
          الفلاتر
          {activeCount > 0 && (
            <span className="axis-num flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: 'var(--iris-500)', color: 'white' }}>
              {activeCount}
            </span>
          )}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Active filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {activeChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium"
              style={{ background: `color-mix(in oklch, ${chip.color} 18%, transparent)`, color: chip.color, border: `1px solid color-mix(in oklch, ${chip.color} 30%, transparent)` }}
            >
              {chip.label}
              <button onClick={chip.clear} className="flex items-center hover:opacity-60 transition-opacity" aria-label="إزالة">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="shrink-0 text-xs px-2 h-6 rounded-md transition-colors hover:bg-white/8"
            style={{ color: 'var(--color-text-muted)' }}
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t px-3 pb-3 space-y-3 pt-3" style={{ borderColor: 'var(--color-surface-border)' }}>
          {/* Saved filter presets */}
          <FilterSection label="الفلاتر المحفوظة">
            {presets.map((preset) => (
              <span
                key={preset.id}
                className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-medium transition-colors"
                style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
              >
                <button onClick={() => onApplyPreset(preset.id)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <Bookmark size={11} style={{ color: 'var(--iris-500)' }} />
                  {preset.name}
                </button>
                <button onClick={() => onDeletePreset(preset.id)} className="flex items-center hover:opacity-60 transition-opacity" aria-label="حذف">
                  <X size={10} />
                </button>
              </span>
            ))}

            {naming ? (
              <span className="inline-flex items-center gap-1 h-7 rounded-full ps-2.5 pe-1" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--iris-500)' }}>
                <input
                  autoFocus
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') doSave(); if (e.key === 'Escape') { setNaming(false); setPresetName('') } }}
                  placeholder="اسم الفلتر…"
                  className="bg-transparent text-xs outline-none w-24"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <button onClick={doSave} disabled={!presetName.trim()} className="w-5 h-5 rounded-full flex items-center justify-center disabled:opacity-40" style={{ background: 'var(--iris-500)', color: '#fff' }} aria-label="حفظ">
                  <Check size={11} />
                </button>
              </span>
            ) : (
              <button
                onClick={() => setNaming(true)}
                disabled={activeCount === 0}
                className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-medium transition-colors disabled:opacity-40"
                style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)', border: '1px dashed color-mix(in oklch, var(--iris-500) 40%, transparent)' }}
              >
                <BookmarkPlus size={12} /> حفظ الفلاتر الحالية
              </button>
            )}
          </FilterSection>

          {/* Portfolio section */}
          {portfolios.length > 0 && (
            <FilterSection label="المحافظ">
              <FilterOption active={filterPortfolio === 'all'} color="var(--iris-500)" count={undefined} onClick={() => setFilterPortfolio('all')}>
                كل المحافظ
              </FilterOption>
              {portfolios.map((pf) => (
                <FilterOption key={pf.id} active={filterPortfolio === pf.id} color={pf.color} count={taskCounts.get(`pf:${pf.id}`)} onClick={() => setFilterPortfolio(filterPortfolio === pf.id ? 'all' : pf.id)}>
                  <ProjectIcon name={pf.icon} size={11} />
                  {pf.name}
                </FilterOption>
              ))}
            </FilterSection>
          )}

          {/* Projects */}
          <FilterSection label="المشاريع">
            <FilterOption active={filterProject === 'all'} color="var(--iris-500)" count={undefined} onClick={() => setFilterProject('all')}>
              كل المشاريع
            </FilterOption>
            {projects.map((p) => (
              <FilterOption key={p.id} active={filterProject === p.id} color={p.color} count={taskCounts.get(`pr:${p.id}`)} onClick={() => setFilterProject(filterProject === p.id ? 'all' : p.id)}>
                <ProjectIcon name={p.icon} size={11} />
                {p.name}
              </FilterOption>
            ))}
          </FilterSection>

          {/* Status + Priority side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FilterSection label="الحالة">
              <FilterOption active={filterStatus === 'all'} color="var(--iris-500)" count={undefined} onClick={() => setFilterStatus('all')}>كل الحالات</FilterOption>
              {STATUS_ORDER.map((s) => (
                <FilterOption key={s} active={filterStatus === s} color={TASK_STATUS_VAR[s]} count={taskCounts.get(`st:${s}`)} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
                  {TASK_STATUS_LABELS[s]}
                </FilterOption>
              ))}
            </FilterSection>

            <FilterSection label="الأولوية">
              <FilterOption active={filterPriority === 'all'} color="var(--iris-500)" count={undefined} onClick={() => setFilterPriority('all')}>كل الأولويات</FilterOption>
              {PRIORITY_ORDER.map((pr) => (
                <FilterOption key={pr} active={filterPriority === pr} color={PRIORITY_VAR[pr]} count={taskCounts.get(`pr2:${pr}`)} onClick={() => setFilterPriority(filterPriority === pr ? 'all' : pr)}>
                  {PRIORITY_LABELS[pr]}
                </FilterOption>
              ))}
            </FilterSection>
          </div>

          {/* Assignees */}
          {assignees.length > 0 && (
            <FilterSection label="المسؤول">
              <FilterOption active={filterAssignee === 'all'} color="var(--iris-500)" count={undefined} onClick={() => setFilterAssignee('all')}>الجميع</FilterOption>
              {assignees.map((m) => (
                <FilterOption key={m.id} active={filterAssignee === m.id} color="var(--iris-500)" count={taskCounts.get(`as:${m.id}`)} onClick={() => setFilterAssignee(filterAssignee === m.id ? 'all' : m.id)}>
                  <span className="axis-num w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: 'var(--iris-500)', color: 'white' }}>{m.name[0]}</span>
                  {m.name}
                </FilterOption>
              ))}
            </FilterSection>
          )}
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterOption({ active, color, count, onClick, children }: { active: boolean; color: string; count?: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
      style={{
        background: active ? color : 'var(--color-surface-muted)',
        color: active ? 'white' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'transparent' : 'var(--color-surface-border)'}`,
      }}
    >
      {!active && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
      {children}
      {count !== undefined && (
        <span className="axis-num text-[10px] px-1 rounded" style={{ background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-border)', color: active ? 'white' : 'var(--color-text-muted)' }}>
          {count}
        </span>
      )}
    </button>
  )
}
