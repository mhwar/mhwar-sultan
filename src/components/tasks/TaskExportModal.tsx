'use client'
import { useState, useMemo } from 'react'
import { X, Download } from 'lucide-react'
import type { Task, Project, Portfolio, Sprint } from '@/types'
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import { monthLabel } from '@/components/projects/tabs/content/contentMeta'

type Scope = 'all' | 'portfolio' | 'project'
type Period = 'day' | 'week' | 'month' | 'year' | 'all'
type GroupBy = 'none' | 'project' | 'sprint' | 'status' | 'priority'
type ColKey = 'status' | 'priority' | 'project' | 'assignee' | 'due' | 'start' | 'sprint'

const COL_DEFS: { key: ColKey; label: string }[] = [
  { key: 'status', label: 'الحالة' },
  { key: 'priority', label: 'الأولوية' },
  { key: 'project', label: 'المشروع' },
  { key: 'assignee', label: 'المسؤول' },
  { key: 'due', label: 'الاستحقاق' },
  { key: 'start', label: 'البدء' },
  { key: 'sprint', label: 'المرحلة' },
]

interface Props {
  tasks: Task[]
  projects: Project[]
  portfolios: Portfolio[]
  sprints: Sprint[]
  assigneeNameMap: Record<string, string>
  projectNameMap: Record<string, string>
  cursor: { year: number; month: number }
  anchorDay: string
  onClose: () => void
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function weekBoundsStr(key: string): [string, string] {
  const d = new Date(key + 'T00:00:00Z')
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - d.getUTCDay())
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

export default function TaskExportModal({ tasks, projects, portfolios, sprints, assigneeNameMap, projectNameMap, cursor, anchorDay, onClose }: Props) {
  const [scope, setScope] = useState<Scope>('all')
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>(portfolios[0]?.id ?? '')
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id ?? '')
  const [period, setPeriod] = useState<Period>('month')
  const [groupBy, setGroupBy] = useState<GroupBy>('project')
  const [cols, setCols] = useState<Set<ColKey>>(new Set(['status', 'priority', 'project', 'assignee', 'due']))

  const toggleCol = (k: ColKey) => setCols((prev) => {
    const next = new Set(prev)
    if (next.has(k)) next.delete(k); else next.add(k)
    return next
  })

  const sprintNameMap = useMemo(() => Object.fromEntries(sprints.map((s) => [s.id, s.name])), [sprints])

  const exportTasks = useMemo(() => {
    let result = [...tasks]
    if (scope === 'portfolio' && selectedPortfolio) {
      const pf = portfolios.find((p) => p.id === selectedPortfolio)
      const pfIds = new Set(pf?.projectIds ?? [])
      result = result.filter((t) => t.projectId && pfIds.has(t.projectId))
    } else if (scope === 'project' && selectedProject) {
      result = result.filter((t) => t.projectId === selectedProject)
    }
    if (period !== 'all') {
      const dk = (t: Task) => t.dueDate ? t.dueDate.slice(0, 10) : null
      if (period === 'day') {
        result = result.filter((t) => dk(t) === anchorDay)
      } else if (period === 'week') {
        const [ws, we] = weekBoundsStr(anchorDay)
        result = result.filter((t) => { const k = dk(t); return k !== null && k >= ws && k <= we })
      } else if (period === 'month') {
        const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
        result = result.filter((t) => { const k = dk(t); return k !== null && k.startsWith(prefix) })
      } else if (period === 'year') {
        const prefix = String(cursor.year)
        result = result.filter((t) => { const k = dk(t); return k !== null && k.startsWith(prefix) })
      }
    }
    return result
  }, [tasks, scope, selectedPortfolio, selectedProject, period, portfolios, anchorDay, cursor])

  const handleExport = () => {
    const scopeLabel = scope === 'all' ? 'كل المهام'
      : scope === 'portfolio' ? `المحفظة: ${portfolios.find((p) => p.id === selectedPortfolio)?.name ?? ''}`
      : `المشروع: ${projectNameMap[selectedProject] ?? ''}`

    const periodLabel: Record<Period, string> = {
      day: `يوم ${anchorDay}`,
      week: (() => { const [s, e] = weekBoundsStr(anchorDay); return `${s} – ${e}` })(),
      month: monthLabel(cursor.year, cursor.month),
      year: String(cursor.year),
      all: 'كل الفترات',
    }

    const total = exportTasks.length
    const done = exportTasks.filter((t) => t.status === 'done').length
    const unscheduled = exportTasks.filter((t) => !t.dueDate).length
    const colKeys = COL_DEFS.filter((c) => cols.has(c.key))

    const statusBadge = (s: Task['status']) => {
      const cls = s === 'done' ? 'done-badge' : s === 'in-progress' ? 'inprog-badge' : 'todo-badge'
      return `<span class="status-badge ${cls}">${esc(TASK_STATUS_LABELS[s])}</span>`
    }
    const priorityBadge = (pr: Task['priority']) => {
      const cls = pr === 'high' ? 'high-badge' : pr === 'medium' ? 'med-badge' : 'low-badge'
      return `<span class="priority-badge ${cls}">${esc(PRIORITY_LABELS[pr])}</span>`
    }
    const renderCell = (t: Task, k: ColKey): string => {
      if (k === 'status') return statusBadge(t.status)
      if (k === 'priority') return priorityBadge(t.priority)
      if (k === 'project') return esc(t.projectId ? (projectNameMap[t.projectId] ?? '—') : '—')
      if (k === 'assignee') return esc(t.assigneeId ? (assigneeNameMap[t.assigneeId] ?? '—') : '—')
      if (k === 'due') return `<span dir="ltr">${t.dueDate ? t.dueDate.slice(0, 10) : '—'}</span>`
      if (k === 'start') return `<span dir="ltr">${t.startDate ? t.startDate.slice(0, 10) : '—'}</span>`
      if (k === 'sprint') return esc(t.sprintId ? (sprintNameMap[t.sprintId] ?? '—') : '—')
      return ''
    }
    const taskRow = (t: Task) =>
      `<tr class="${t.status === 'done' ? 'done-row' : ''}"><td>${esc(t.title)}</td>${colKeys.map((c) => `<td>${renderCell(t, c.key)}</td>`).join('')}</tr>`

    let tableBody = ''
    if (groupBy === 'none') {
      tableBody = exportTasks.map(taskRow).join('')
    } else {
      const groups = new Map<string, { label: string; items: Task[] }>()
      for (const t of exportTasks) {
        let key = ''; let label = ''
        if (groupBy === 'project') { key = t.projectId ?? '__free'; label = t.projectId ? (projectNameMap[t.projectId] ?? 'مشروع') : 'بلا مشروع' }
        else if (groupBy === 'sprint') { key = t.sprintId ?? '__backlog'; label = t.sprintId ? (sprintNameMap[t.sprintId] ?? 'مرحلة') : 'الباكلوج' }
        else if (groupBy === 'status') { key = t.status; label = TASK_STATUS_LABELS[t.status] }
        else if (groupBy === 'priority') { key = t.priority; label = PRIORITY_LABELS[t.priority] }
        if (!groups.has(key)) groups.set(key, { label, items: [] })
        groups.get(key)!.items.push(t)
      }
      for (const [, g] of groups) {
        tableBody += `<tr><td colspan="${colKeys.length + 1}" class="group-header">${esc(g.label)} <span style="opacity:.6">(${g.items.length})</span></td></tr>`
        tableBody += g.items.map(taskRow).join('')
      }
    }

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تصدير المهام</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;background:#fff;color:#111;padding:24px 32px;direction:rtl;font-size:13px}
h1{font-size:20px;font-weight:700;margin-bottom:4px}
.sub{color:#666;margin-bottom:16px;font-size:12px}
.summary{display:flex;gap:24px;padding:12px 20px;background:#f5f5f5;border-radius:8px;margin-bottom:20px;flex-wrap:wrap}
.sum-item .num{font-size:22px;font-weight:700;color:#6366f1}
.sum-item .lbl{font-size:11px;color:#666}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
th{background:#f9fafb;padding:8px 12px;text-align:right;font-weight:600;font-size:12px;border-bottom:2px solid #e5e7eb}
td{padding:7px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
.group-header{background:#ede9fe;color:#4338ca;font-weight:700;font-size:12px;letter-spacing:.03em}
.status-badge,.priority-badge{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600}
.done-badge{background:#d1fae5;color:#065f46}
.inprog-badge{background:#fef3c7;color:#92400e}
.todo-badge{background:#f3f4f6;color:#374151}
.high-badge{background:#fee2e2;color:#991b1b}
.med-badge{background:#fef3c7;color:#92400e}
.low-badge{background:#f0fdf4;color:#166534}
.done-row td{opacity:.55;text-decoration:line-through}
.print-btn{padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:20px}
.footer{margin-top:16px;font-size:11px;color:#999}
@media print{.print-btn{display:none}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<h1>تقرير المهام</h1>
<div class="sub">${esc(scopeLabel)} · ${esc(periodLabel[period])}</div>
<div class="summary">
  <div class="sum-item"><div class="num">${total}</div><div class="lbl">إجمالي</div></div>
  <div class="sum-item"><div class="num">${done}</div><div class="lbl">منجزة</div></div>
  <div class="sum-item"><div class="num">${total - done}</div><div class="lbl">قيد التنفيذ</div></div>
  <div class="sum-item"><div class="num">${unscheduled}</div><div class="lbl">بلا موعد</div></div>
</div>
<table>
<thead><tr><th>المهمة</th>${colKeys.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
<tbody>${tableBody}</tbody>
</table>
<div class="footer">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</div>
</body>
</html>`

    const w = window.open('', '_blank', 'width=940,height=760,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  const chipStyle = (active: boolean) => ({
    background: active ? 'var(--iris-500)' : 'var(--color-surface-muted)',
    color: active ? 'white' : 'var(--color-text-secondary)',
    border: `1px solid ${active ? 'transparent' : 'var(--color-surface-border)'}`,
  })

  const toggleChipStyle = (active: boolean) => ({
    background: active ? 'color-mix(in oklch, var(--iris-500) 15%, transparent)' : 'var(--color-surface-muted)',
    color: active ? 'var(--iris-500)' : 'var(--color-text-secondary)',
    border: `1px solid ${active ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-surface-border)' }}>
          <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>تصدير المهام</span>
          <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost" onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Scope */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>النطاق</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'portfolio', 'project'] as Scope[]).map((s) => (
                <button key={s} onClick={() => setScope(s)} className="px-3 h-7 rounded-full text-xs font-medium transition-colors" style={chipStyle(scope === s)}>
                  {s === 'all' ? 'كل المهام' : s === 'portfolio' ? 'محفظة' : 'مشروع'}
                </button>
              ))}
            </div>
            {scope === 'portfolio' && portfolios.length > 0 && (
              <select value={selectedPortfolio} onChange={(e) => setSelectedPortfolio(e.target.value)} className="mt-2 w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
                {portfolios.map((pf) => <option key={pf.id} value={pf.id}>{pf.name}</option>)}
              </select>
            )}
            {scope === 'project' && projects.length > 0 && (
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="mt-2 w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
                {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            )}
          </div>

          {/* Period */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>الفترة الزمنية</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['day', 'week', 'month', 'year', 'all'] as Period[]).map((per) => (
                <button key={per} onClick={() => setPeriod(per)} className="px-3 h-7 rounded-full text-xs font-medium transition-colors" style={chipStyle(period === per)}>
                  {per === 'day' ? 'يوم' : per === 'week' ? 'أسبوع' : per === 'month' ? 'شهر' : per === 'year' ? 'سنة' : 'الكل'}
                </button>
              ))}
            </div>
          </div>

          {/* Group by */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>التجميع</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['none', 'project', 'sprint', 'status', 'priority'] as GroupBy[]).map((g) => (
                <button key={g} onClick={() => setGroupBy(g)} className="px-3 h-7 rounded-full text-xs font-medium transition-colors" style={chipStyle(groupBy === g)}>
                  {g === 'none' ? 'بدون تجميع' : g === 'project' ? 'مشروع' : g === 'sprint' ? 'مرحلة' : g === 'status' ? 'الحالة' : 'الأولوية'}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>الأعمدة</p>
            <div className="flex gap-1.5 flex-wrap">
              {COL_DEFS.map((c) => (
                <button key={c.key} onClick={() => toggleCol(c.key)} className="px-3 h-7 rounded-full text-xs font-medium transition-colors" style={toggleChipStyle(cols.has(c.key))}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            سيتم تصدير <span className="axis-num font-semibold" style={{ color: 'var(--color-text-primary)' }}>{exportTasks.length}</span> مهمة
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 sticky bottom-0" style={{ background: 'var(--color-surface-raised)', borderTop: '1px solid var(--color-surface-border)' }}>
          <button onClick={onClose} className="text-sm px-4 h-8 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
            إلغاء
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 text-sm px-4 h-8 rounded-lg font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
            <Download size={14} />
            تصدير وطباعة
          </button>
        </div>
      </div>
    </div>
  )
}
