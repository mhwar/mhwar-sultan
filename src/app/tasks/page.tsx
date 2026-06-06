'use client'
import { useMemo, useState } from 'react'
import {
  Plus, CheckSquare, Calendar, CalendarRange, CalendarDays, Grid3x3,
  ChevronRight, ChevronLeft, Briefcase,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import Segmented from '@/components/ui/Segmented'
import Button from '@/components/ui/Button'
import { useTaskStore, useProjectStore, useTeamStore, usePortfolioStore } from '@/store/store'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import {
  monthLabel, dateToKey, todayKey, keyToISO, fmtDayMonth,
} from '@/components/projects/tabs/content/contentMeta'
import {
  TASK_STATUS_LABELS, PRIORITY_LABELS, TASK_STATUS_VAR, PRIORITY_VAR, formatDateAr,
} from '@/lib/utils'
import TaskDrawer from '@/components/projects/TaskDrawer'
import PortfolioManager from '@/components/tasks/PortfolioManager'
import TasksCalendarMonth from '@/components/tasks/TasksCalendarMonth'
import type { TaskViewProps } from '@/components/tasks/shared'
import TasksCalendarWeek from '@/components/tasks/TasksCalendarWeek'
import TasksCalendarDay from '@/components/tasks/TasksCalendarDay'
import TasksCalendarYear from '@/components/tasks/TasksCalendarYear'

type View = 'day' | 'week' | 'month' | 'year'

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done']
const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low']
const DAY_MS = 24 * 3600 * 1000

function shiftDay(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return dateToKey(d)
}
function weekBounds(key: string): [string, string] {
  const d = new Date(key + 'T00:00:00Z')
  const start = new Date(d); start.setUTCDate(d.getUTCDate() - d.getUTCDay())
  const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6)
  return [dateToKey(start), dateToKey(end)]
}

export default function TasksPage() {
  const tasks = useTaskStore(useShallow((s) => s.tasks))
  const { addTask, updateTask } = useTaskStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const members = useTeamStore(useShallow((s) => s.members))
  const portfolios = usePortfolioStore(useShallow((s) => s.portfolios))

  const today = new Date()
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [anchorDay, setAnchorDay] = useState<string>(todayKey())
  const [filterPortfolio, setFilterPortfolio] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showPortfolios, setShowPortfolios] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickProject, setQuickProject] = useState<string>('')

  const projectColorMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.color])), [projects])
  const projectNameMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])
  const assigneeNameMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members])

  // Projects allowed by the selected portfolio.
  const portfolioProjectIds = useMemo(() => {
    if (filterPortfolio === 'all') return null
    const pf = portfolios.find((p) => p.id === filterPortfolio)
    return pf ? new Set(pf.projectIds) : new Set<string>()
  }, [filterPortfolio, portfolios])

  // Tasks within portfolio + project scope (before assignee/priority/status).
  const scopeTasks = useMemo(() => tasks.filter((t) => {
    if (portfolioProjectIds && !portfolioProjectIds.has(t.projectId)) return false
    if (filterProject !== 'all' && t.projectId !== filterProject) return false
    return true
  }), [tasks, portfolioProjectIds, filterProject])

  const availableAssignees = useMemo(() => {
    const ids = new Set<string>()
    scopeTasks.forEach((t) => { if (t.assigneeId) ids.add(t.assigneeId) })
    return members.filter((m) => ids.has(m.id))
  }, [scopeTasks, members])

  const base = useMemo(() => scopeTasks.filter((t) => {
    if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  }), [scopeTasks, filterAssignee, filterPriority, filterStatus])

  const scheduledInRange = useMemo(() => {
    const scheduled = base.filter((t) => t.dueDate)
    const done = scheduled.filter((t) => t.status === 'done').length
    return { total: scheduled.length, done, unscheduled: base.filter((t) => !t.dueDate).length }
  }, [base])

  const { year, month } = cursor
  const reschedule = (id: string, key: string | null) =>
    updateTask(id, { dueDate: key ? keyToISO(key) : undefined })

  const chosenProject = filterProject !== 'all' ? filterProject : projects[0]?.id
  const addOnDay = (key: string) => {
    if (!chosenProject) return
    const id = addTask({ projectId: chosenProject, title: 'مهمة جديدة', status: 'todo', priority: 'medium', dueDate: keyToISO(key) })
    if (id) setOpenId(id)
  }

  const quickAdd = () => {
    const t = quickTitle.trim()
    const pid = quickProject || chosenProject
    if (!t || !pid) return
    addTask({ projectId: pid, title: t, status: 'todo', priority: 'medium' })
    setQuickTitle('')
  }

  const openItem = openId ? tasks.find((t) => t.id === openId) : undefined
  const openProject = openItem ? projects.find((p) => p.id === openItem.projectId) : undefined

  /* ── Time navigation ── */
  const stepTime = (dir: -1 | 1) => {
    if (view === 'month') {
      const d = new Date(Date.UTC(year, month + dir, 1))
      setCursor({ year: d.getUTCFullYear(), month: d.getUTCMonth() })
    } else if (view === 'year') {
      setCursor((c) => ({ ...c, year: c.year + dir }))
    } else if (view === 'week') {
      setAnchorDay((k) => shiftDay(k, dir * 7))
    } else {
      setAnchorDay((k) => shiftDay(k, dir))
    }
  }
  const goToday = () => {
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
    setAnchorDay(todayKey())
  }
  const timeLabel = () => {
    if (view === 'month') return monthLabel(year, month)
    if (view === 'year') return String(year)
    if (view === 'week') {
      const [s, e] = weekBounds(anchorDay)
      return `${fmtDayMonth(s)} – ${fmtDayMonth(e)}`
    }
    return formatDateAr(anchorDay + 'T00:00:00Z')
  }

  const viewProps: TaskViewProps = {
    tasks: base, projectColorMap, projectNameMap, assigneeNameMap,
    onOpenItem: (t) => setOpenId(t.id), onAddOnDay: addOnDay, onReschedule: reschedule,
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 animate-fade-up space-y-4">
        <PageHeader
          title="المهام"
          sub={`${base.length} مهمة ضمن النطاق`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowPortfolios(true)}>
                <Briefcase size={14} /> المحافظ
              </Button>
              <Segmented
                value={view}
                onChange={(v) => setView(v as View)}
                options={[
                  { value: 'day', icon: <Calendar size={15} />, label: 'يوم' },
                  { value: 'week', icon: <CalendarRange size={15} />, label: 'أسبوع' },
                  { value: 'month', icon: <CalendarDays size={15} />, label: 'شهر' },
                  { value: 'year', icon: <Grid3x3 size={15} />, label: 'سنة' },
                ]}
              />
            </div>
          }
        />

        {/* Time navigator + summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={() => stepTime(-1)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="السابق">
              <ChevronRight size={16} />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center" style={{ color: 'var(--color-text-primary)' }}>{timeLabel()}</span>
            <button onClick={() => stepTime(1)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="التالي">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToday} className="ms-1 px-2.5 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
              اليوم
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="axis-num">{scheduledInRange.done}</span>
            <span className="mx-0.5">/</span>
            <span className="axis-num">{scheduledInRange.total}</span> منجز ·
            <span className="axis-num ms-1">{scheduledInRange.unscheduled}</span> بلا موعد
          </span>
        </div>

        {/* Quick add */}
        <div className="flex items-center gap-2 rounded-xl p-2" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
          <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--iris-500)', color: 'white' }}>
            <Plus size={15} />
          </span>
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') quickAdd() }}
            placeholder="اكتب مهمة ثم اختر المشروع واضغط Enter…"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <select
            value={quickProject || chosenProject || ''}
            onChange={(e) => setQuickProject(e.target.value)}
            className="h-8 rounded-md px-2 text-xs outline-none shrink-0 max-w-[150px]"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={quickAdd} disabled={!quickTitle.trim()} className="px-3 h-8 rounded-md text-xs font-semibold shrink-0 transition-opacity disabled:opacity-40" style={{ background: 'var(--iris-500)', color: 'white' }}>
            إضافة
          </button>
        </div>

        {/* Filters */}
        {portfolios.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filterPortfolio === 'all'} onClick={() => setFilterPortfolio('all')} color="var(--iris-500)">كل المحافظ</Chip>
            {portfolios.map((pf) => (
              <Chip key={pf.id} active={filterPortfolio === pf.id} onClick={() => setFilterPortfolio(filterPortfolio === pf.id ? 'all' : pf.id)} color={pf.color}>{pf.name}</Chip>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Chip active={filterProject === 'all'} onClick={() => setFilterProject('all')} color="var(--iris-500)">كل المشاريع</Chip>
          {projects.map((p) => (
            <Chip key={p.id} active={filterProject === p.id} onClick={() => setFilterProject(filterProject === p.id ? 'all' : p.id)} color={p.color}>{p.name}</Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} color="var(--iris-500)">كل الحالات</Chip>
          {STATUS_ORDER.map((s) => (
            <Chip key={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)} color={TASK_STATUS_VAR[s]}>{TASK_STATUS_LABELS[s]}</Chip>
          ))}
          {PRIORITY_ORDER.map((pr) => (
            <Chip key={pr} active={filterPriority === pr} onClick={() => setFilterPriority(filterPriority === pr ? 'all' : pr)} color={PRIORITY_VAR[pr]}>{PRIORITY_LABELS[pr]}</Chip>
          ))}
        </div>

        {availableAssignees.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filterAssignee === 'all'} onClick={() => setFilterAssignee('all')} color="var(--iris-500)">كل المسؤولين</Chip>
            {availableAssignees.map((m) => (
              <Chip key={m.id} active={filterAssignee === m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? 'all' : m.id)} color="var(--iris-500)">{m.name}</Chip>
            ))}
          </div>
        )}

        {/* View body */}
        <div className="axis-card p-3 md:p-4">
          {projects.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>أنشئ مشروعاً أولاً لإضافة المهام</p>
          ) : view === 'month' ? (
            <TasksCalendarMonth year={year} month={month} {...viewProps} />
          ) : view === 'week' ? (
            <TasksCalendarWeek anchorDay={anchorDay} {...viewProps} />
          ) : view === 'day' ? (
            <TasksCalendarDay anchorDay={anchorDay} {...viewProps} />
          ) : (
            <TasksCalendarYear
              year={year}
              tasks={base}
              onPickMonth={(m) => { setCursor((c) => ({ ...c, month: m })); setView('month') }}
              onPickDay={(k) => { setAnchorDay(k); setView('day') }}
            />
          )}
        </div>
      </div>

      {openItem && (
        <TaskDrawer task={openItem} project={openProject} onClose={() => setOpenId(null)} />
      )}
      {showPortfolios && <PortfolioManager onClose={() => setShowPortfolios(false)} />}
    </AppLayout>
  )
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
      style={{
        background: active ? color : 'var(--color-surface-overlay)',
        color: active ? 'white' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'transparent' : 'var(--color-surface-border)'}`,
      }}
    >
      {!active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}
