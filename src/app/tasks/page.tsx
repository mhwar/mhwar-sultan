'use client'
import { useMemo, useState } from 'react'
import {
  Calendar, CalendarRange, CalendarDays, Grid3x3,
  ChevronRight, ChevronLeft, Briefcase, Zap, LayoutGrid, CalendarCheck2, Download,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import Segmented from '@/components/ui/Segmented'
import Button from '@/components/ui/Button'
import { useTaskStore, useProjectStore, useTeamStore, usePortfolioStore, useSprintStore } from '@/store/store'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import {
  monthLabel, dateToKey, todayKey, keyToISO, fmtDayMonth,
} from '@/components/projects/tabs/content/contentMeta'
import { formatDateAr } from '@/lib/utils'
import TaskDrawer from '@/components/projects/TaskDrawer'
import PortfolioManager from '@/components/tasks/PortfolioManager'
import TaskFilterBar from '@/components/tasks/TaskFilterBar'
import TaskExportModal from '@/components/tasks/TaskExportModal'
import TasksCalendarMonth from '@/components/tasks/TasksCalendarMonth'
import type { TaskViewProps } from '@/components/tasks/shared'
import TasksCalendarWeek from '@/components/tasks/TasksCalendarWeek'
import TasksCalendarDay from '@/components/tasks/TasksCalendarDay'
import TasksCalendarYear from '@/components/tasks/TasksCalendarYear'
import TasksCalendarYearFull from '@/components/tasks/TasksCalendarYearFull'
import AddTaskPanel from '@/components/tasks/AddTaskPanel'
import SprintManager from '@/components/tasks/SprintManager'

type View = 'day' | 'week' | 'month' | 'year'
type YearStyle = 'compact' | 'full'

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
  const sprints = useSprintStore(useShallow((s) => s.sprints))

  const today = new Date()
  const [view, setView] = useState<View>('month')
  const [yearStyle, setYearStyle] = useState<YearStyle>('compact')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [anchorDay, setAnchorDay] = useState<string>(todayKey())
  const [filterPortfolio, setFilterPortfolio] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showPortfolios, setShowPortfolios] = useState(false)
  const [showSprintManager, setShowSprintManager] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const projectColorMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.color])), [projects])
  const projectNameMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])
  const assigneeNameMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members])

  const portfolioProjectIds = useMemo(() => {
    if (filterPortfolio === 'all') return null
    const pf = portfolios.find((p) => p.id === filterPortfolio)
    return pf ? new Set(pf.projectIds) : new Set<string>()
  }, [filterPortfolio, portfolios])

  const scopeTasks = useMemo(() => tasks.filter((t) => {
    if (portfolioProjectIds && (!t.projectId || !portfolioProjectIds.has(t.projectId))) return false
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

  const taskCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tasks) {
      if (t.projectId) {
        for (const pf of portfolios) {
          if (pf.projectIds.includes(t.projectId)) {
            m.set(`pf:${pf.id}`, (m.get(`pf:${pf.id}`) ?? 0) + 1)
          }
        }
        m.set(`pr:${t.projectId}`, (m.get(`pr:${t.projectId}`) ?? 0) + 1)
      }
      m.set(`st:${t.status}`, (m.get(`st:${t.status}`) ?? 0) + 1)
      m.set(`pr2:${t.priority}`, (m.get(`pr2:${t.priority}`) ?? 0) + 1)
      if (t.assigneeId) m.set(`as:${t.assigneeId}`, (m.get(`as:${t.assigneeId}`) ?? 0) + 1)
    }
    return m
  }, [tasks, portfolios])

  const scheduledInRange = useMemo(() => {
    const scheduled = base.filter((t) => t.dueDate)
    const done = scheduled.filter((t) => t.status === 'done').length
    return { total: scheduled.length, done, unscheduled: base.filter((t) => !t.dueDate).length }
  }, [base])

  const { year, month } = cursor
  const reschedule = (id: string, key: string | null) =>
    updateTask(id, { dueDate: key ? keyToISO(key) : undefined })

  const addOnDay = (key: string) => {
    const pid = filterProject !== 'all' ? filterProject : projects[0]?.id
    const id = addTask({ projectId: pid, title: 'مهمة جديدة', status: 'todo', priority: 'medium', dueDate: keyToISO(key) })
    if (id) setOpenId(id)
  }

  const handleAddTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
    const id = addTask(data)
    if (id) setOpenId(id)
  }

  const openItem = openId ? tasks.find((t) => t.id === openId) : undefined
  const openProject = openItem?.projectId ? projects.find((p) => p.id === openItem.projectId) : undefined

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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowExport(true)}>
                <Download size={14} /> تصدير
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSprintManager(true)}>
                <Zap size={14} /> المراحل
              </Button>
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

        {/* Year style toggle */}
        {view === 'year' && (
          <div className="flex items-center gap-1">
            <span className="text-xs me-2" style={{ color: 'var(--color-text-muted)' }}>نمط العرض:</span>
            <button
              onClick={() => setYearStyle('compact')}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-colors"
              style={{ background: yearStyle === 'compact' ? 'var(--iris-500)' : 'var(--color-surface-overlay)', color: yearStyle === 'compact' ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${yearStyle === 'compact' ? 'transparent' : 'var(--color-surface-border)'}` }}
            >
              <LayoutGrid size={13} /> مدمج
            </button>
            <button
              onClick={() => setYearStyle('full')}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-colors"
              style={{ background: yearStyle === 'full' ? 'var(--iris-500)' : 'var(--color-surface-overlay)', color: yearStyle === 'full' ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${yearStyle === 'full' ? 'transparent' : 'var(--color-surface-border)'}` }}
            >
              <CalendarCheck2 size={13} /> تفصيلي
            </button>
          </div>
        )}

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

        {/* Add task panel */}
        <AddTaskPanel
          projects={projects}
          sprints={sprints}
          defaultProjectId={filterProject !== 'all' ? filterProject : projects[0]?.id}
          onAdd={handleAddTask}
          onNewSprint={() => setShowSprintManager(true)}
        />

        {/* Filters */}
        <TaskFilterBar
          portfolios={portfolios}
          projects={projects}
          assignees={availableAssignees}
          taskCounts={taskCounts}
          filterPortfolio={filterPortfolio}
          setFilterPortfolio={setFilterPortfolio}
          filterProject={filterProject}
          setFilterProject={setFilterProject}
          filterAssignee={filterAssignee}
          setFilterAssignee={setFilterAssignee}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* View body */}
        <div className="axis-card p-3 md:p-4">
          {view === 'month' ? (
            <TasksCalendarMonth year={year} month={month} {...viewProps} />
          ) : view === 'week' ? (
            <TasksCalendarWeek anchorDay={anchorDay} {...viewProps} />
          ) : view === 'day' ? (
            <TasksCalendarDay anchorDay={anchorDay} {...viewProps} />
          ) : yearStyle === 'full' ? (
            <TasksCalendarYearFull
              year={year}
              tasks={base}
              projectColorMap={projectColorMap}
              onPickMonth={(m) => { setCursor((c) => ({ ...c, month: m })); setView('month') }}
              onPickDay={(k) => { setAnchorDay(k); setView('day') }}
            />
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
      {showSprintManager && <SprintManager onClose={() => setShowSprintManager(false)} />}
      {showExport && (
        <TaskExportModal
          tasks={tasks}
          projects={projects}
          portfolios={portfolios}
          sprints={sprints}
          assigneeNameMap={assigneeNameMap}
          projectNameMap={projectNameMap}
          cursor={cursor}
          anchorDay={anchorDay}
          onClose={() => setShowExport(false)}
        />
      )}
    </AppLayout>
  )
}
