'use client'
import { useMemo, useState } from 'react'
import { Plus, Printer } from 'lucide-react'
import type { Task } from '@/types'
import {
  WEEKDAYS, monthMatrix, dateToKey, dayKey, todayKey, keyInMonth, monthLabel,
} from '@/components/projects/tabs/content/contentMeta'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_VAR, formatDateAr } from '@/lib/utils'
import type { TaskViewProps } from './shared'

interface Props extends TaskViewProps {
  year: number
  /** Month indexes to render. Year program → 0..11. Month program → [month]. */
  months: number[]
  /** true = annual grid (weeks laid horizontally); false = single month (weeks stacked). */
  dense: boolean
}

const DAY_W = 78          // px — fixed day-cell width in dense mode
const LABEL_W = 76        // px — month label column width
const FREE_COLOR = 'var(--color-text-muted)'

interface HoverState { task: Task; left: number; top: number }

export default function TasksCalendarProgram({ year, months, dense, ...p }: Props) {
  const { tasks, projectColorMap, projectNameMap, assigneeNameMap, onOpenItem, onAddOnDay, onReschedule } = p
  const today = todayKey()
  const [hover, setHover] = useState<HoverState | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // ── Map every task to each day it covers (spans repeat across days) ──
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      const sk = t.startDate ? dayKey(t.startDate) : null
      const ek = t.dueDate ? dayKey(t.dueDate) : null
      if (sk && ek && sk !== ek) {
        const cur = new Date(sk + 'T00:00:00Z')
        const end = new Date(ek + 'T00:00:00Z')
        while (cur <= end) {
          const k = dateToKey(cur)
          if (!m.has(k)) m.set(k, [])
          m.get(k)!.push(t)
          cur.setUTCDate(cur.getUTCDate() + 1)
        }
      } else if (ek) {
        if (!m.has(ek)) m.set(ek, [])
        m.get(ek)!.push(t)
      }
    }
    return m
  }, [tasks])

  const colorOf = (t: Task) => (t.projectId ? (projectColorMap[t.projectId] ?? FREE_COLOR) : FREE_COLOR)

  const showHover = (t: Task) => (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cardW = 240
    let left = r.left + r.width / 2 - cardW / 2
    left = Math.max(8, Math.min(left, window.innerWidth - cardW - 8))
    const top = r.bottom + 6
    setHover({ task: t, left, top })
  }

  const maxChips = dense ? 3 : 5

  // ── A single colored task chip (project color, title + assignee) ──
  const Chip = ({ t }: { t: Task }) => {
    const color = colorOf(t)
    const isFree = !t.projectId
    const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : undefined
    const done = t.status === 'done'
    return (
      <button
        draggable={!dense}
        onDragStart={(e) => { if (!dense) { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move' } }}
        onClick={() => onOpenItem(t)}
        onMouseEnter={showHover(t)}
        onMouseLeave={() => setHover(null)}
        className="w-full text-start rounded transition-transform hover:scale-[1.02] hover:z-10 relative"
        style={{
          background: isFree ? 'var(--color-surface-muted)' : color,
          borderInlineStart: isFree ? `2px solid ${FREE_COLOR}` : 'none',
          padding: dense ? '2px 4px' : '4px 6px',
          opacity: done ? 0.55 : 1,
          cursor: dense ? 'pointer' : 'grab',
          lineHeight: 1.15,
        }}
      >
        <span
          className="block truncate font-semibold"
          style={{
            fontSize: dense ? '0.62rem' : '0.72rem',
            color: isFree ? 'var(--color-text-primary)' : '#fff',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {t.title}
        </span>
        {assignee && (
          <span
            className="block truncate"
            style={{
              fontSize: dense ? '0.56rem' : '0.64rem',
              color: isFree ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.82)',
              marginTop: 1,
            }}
          >
            {assignee}
          </span>
        )}
      </button>
    )
  }

  // ── A single day cell ──
  const DayCell = ({ date, month }: { date: Date; month: number }) => {
    const key = dateToKey(date)
    const inMonth = keyInMonth(key, year, month)
    const isToday = key === today
    const dayTasks = inMonth ? (byDay.get(key) ?? []) : []
    const isOver = dragOver === key

    return (
      <div
        onDragOver={!dense ? (e) => { e.preventDefault(); if (dragOver !== key) setDragOver(key) } : undefined}
        onDragLeave={!dense ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === key ? null : d)) } : undefined}
        onDrop={!dense ? (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id && inMonth) onReschedule(id, key); setDragOver(null) } : undefined}
        className="group/cell relative flex flex-col rounded-md transition-colors"
        style={{
          minHeight: dense ? 60 : 116,
          padding: dense ? 3 : 6,
          gap: dense ? 2 : 3,
          background: isOver ? 'oklch(0.62 0.21 275 / 0.08)' : inMonth ? 'var(--color-surface-overlay)' : 'transparent',
          border: `1px solid ${isOver ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
          opacity: inMonth ? 1 : 0.35,
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="axis-num flex items-center justify-center rounded-full font-semibold"
            style={{
              width: dense ? 16 : 22, height: dense ? 16 : 22,
              fontSize: dense ? '0.6rem' : '0.72rem',
              background: isToday ? 'var(--iris-500)' : 'transparent',
              color: isToday ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {date.getUTCDate()}
          </span>
          {!dense && inMonth && (
            <button
              onClick={() => onAddOnDay(key)}
              className="opacity-0 group-hover/cell:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="إضافة"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {dayTasks.slice(0, maxChips).map((t) => <Chip key={t.id + key} t={t} />)}
        {dayTasks.length > maxChips && (
          <button
            onClick={() => (dense ? onOpenItem(dayTasks[maxChips]) : onAddOnDay(key))}
            className="text-start ps-0.5"
            style={{ fontSize: dense ? '0.55rem' : '0.65rem', color: 'var(--color-text-muted)' }}
          >
            +{dayTasks.length - maxChips} المزيد
          </button>
        )}
      </div>
    )
  }

  // ── Print the annual program (window.open + HTML, same as task export) ──
  const printProgram = () => {
    const html = buildAnnualProgramHTML({
      year, months, byDay, projectColorMap, projectNameMap, assigneeNameMap,
    })
    const w = window.open('', '_blank', 'width=1100,height=800,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  // ════════════════════ DENSE (annual program) ════════════════════
  if (dense) {
    const maxWeeks = Math.max(...months.map((m) => monthMatrix(year, m).length))
    const weekGroupW = 7 * DAY_W + 6 * 2 // 7 cells + 6 inner gaps

    return (
      <>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            البرنامج السنوي — مرّر فوق أي مهمة لعرض تفاصيلها، وانقر لفتحها
          </p>
          <button
            onClick={printProgram}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'var(--iris-500)', color: '#fff' }}
          >
            <Printer size={14} /> طباعة البرنامج السنوي
          </button>
        </div>

        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="inline-flex flex-col gap-2" style={{ minWidth: '100%' }}>

            {/* Top header: spacer + week-group weekday headers */}
            <div className="flex" style={{ gap: 10 }}>
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              {Array.from({ length: maxWeeks }, (_, wi) => (
                <div key={wi} style={{ width: weekGroupW, flexShrink: 0 }}>
                  <div className="text-center text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)', fontSize: '0.62rem' }}>
                    الأسبوع {wi + 1}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${DAY_W}px)`, gap: 2 }}>
                    {WEEKDAYS.map((d, i) => (
                      <div key={i} className="text-center font-semibold" style={{ color: 'var(--color-text-muted)', fontSize: '0.58rem' }}>{d}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* One row per month */}
            {months.map((month) => {
              const weeks = monthMatrix(year, month)
              const daysWithTasks = weeks.flat().filter((d) => {
                const k = dateToKey(d)
                return keyInMonth(k, year, month) && (byDay.get(k)?.length ?? 0) > 0
              }).length
              return (
                <div key={month} className="flex items-stretch" style={{ gap: 10 }}>
                  {/* Month label */}
                  <div
                    className="flex flex-col items-center justify-center rounded-lg shrink-0 text-center"
                    style={{ width: LABEL_W, background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', padding: 6 }}
                  >
                    <span className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {monthLabel(year, month).split(' ')[0]}
                    </span>
                    {daysWithTasks > 0 && (
                      <span className="axis-num text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {daysWithTasks} يوم
                      </span>
                    )}
                  </div>

                  {/* Weeks laid horizontally */}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ width: weekGroupW, flexShrink: 0, display: 'grid', gridTemplateColumns: `repeat(7, ${DAY_W}px)`, gap: 2 }}>
                      {week.map((date) => <DayCell key={dateToKey(date)} date={date} month={month} />)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        <HoverCard hover={hover} projectNameMap={projectNameMap} assigneeNameMap={assigneeNameMap} colorOf={colorOf} />
      </>
    )
  }

  // ════════════════════ NON-DENSE (single-month program) ════════════════════
  const month = months[0]
  const weeks = monthMatrix(year, month)
  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-text-muted)' }}>{w}</div>
        ))}
      </div>
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((date) => <DayCell key={dateToKey(date)} date={date} month={month} />)}
          </div>
        ))}
      </div>
      <HoverCard hover={hover} projectNameMap={projectNameMap} assigneeNameMap={assigneeNameMap} colorOf={colorOf} />
    </>
  )
}

// ── Floating hover detail card (fixed-positioned, escapes scroll clipping) ──
function HoverCard({
  hover, projectNameMap, assigneeNameMap, colorOf,
}: {
  hover: HoverState | null
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
  colorOf: (t: Task) => string
}) {
  if (!hover) return null
  const { task: t } = hover
  const project = t.projectId ? projectNameMap[t.projectId] : 'بلا مشروع'
  const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : undefined
  const color = colorOf(t)

  return (
    <div
      className="fixed z-[80] rounded-xl p-3 pointer-events-none animate-fade-up"
      style={{
        left: hover.left, top: hover.top, width: 240,
        background: 'var(--color-surface-overlay)',
        border: '1px solid var(--color-surface-border)',
        boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: color }} />
        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{t.title}</p>
      </div>
      <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <Row label="المشروع" value={project} />
        {assignee && <Row label="المسؤول" value={assignee} />}
        <Row label="الحالة" value={TASK_STATUS_LABELS[t.status]} />
        <Row label="الأولوية" value={PRIORITY_LABELS[t.priority]} dot={PRIORITY_VAR[t.priority]} />
        {t.startDate && t.dueDate && dayKey(t.startDate) !== dayKey(t.dueDate) ? (
          <Row label="المدة" value={`${formatDateAr(t.startDate)} ← ${formatDateAr(t.dueDate)}`} />
        ) : t.dueDate ? (
          <Row label="الاستحقاق" value={formatDateAr(t.dueDate)} />
        ) : null}
      </div>
      <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-surface-border)', color: 'var(--color-text-muted)' }}>
        انقر لفتح المهمة
      </p>
    </div>
  )
}

function Row({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="flex items-center gap-1.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}

// ════════════════════ Annual program print (HTML → window.print) ════════════════════
const PRINT_FREE = '#cbd5e1'
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildAnnualProgramHTML({
  year, months, byDay, projectColorMap, projectNameMap, assigneeNameMap,
}: {
  year: number
  months: number[]
  byDay: Map<string, Task[]>
  projectColorMap: Record<string, string>
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
}): string {
  const PDAY = 42       // print day-cell width (px)
  const maxWeeks = Math.max(...months.map((m) => monthMatrix(year, m).length))
  const wgW = 7 * PDAY + 6 // 7 cells + inner gaps (1px)

  const chipHtml = (t: Task): string => {
    const isFree = !t.projectId
    const color = isFree ? PRINT_FREE : (projectColorMap[t.projectId as string] ?? PRINT_FREE)
    const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : ''
    const done = t.status === 'done'
    const cls = `chip${isFree ? ' free' : ''}${done ? ' done' : ''}`
    return `<div class="${cls}" style="background:${color}">`
      + `<span class="t">${escHtml(t.title)}</span>`
      + (assignee ? `<span class="a">${escHtml(assignee)}</span>` : '')
      + `</div>`
  }

  const cellHtml = (date: Date, month: number): string => {
    const key = dateToKey(date)
    const inMonth = keyInMonth(key, year, month)
    if (!inMonth) return `<div class="cell out"></div>`
    const dayTasks = byDay.get(key) ?? []
    const shown = dayTasks.slice(0, 4)
    const extra = dayTasks.length - shown.length
    return `<div class="cell">`
      + `<div class="dn">${date.getUTCDate()}</div>`
      + shown.map(chipHtml).join('')
      + (extra > 0 ? `<div class="more">+${extra}</div>` : '')
      + `</div>`
  }

  const headerRow = `<div class="hrow">`
    + `<div class="mlbl-sp"></div>`
    + Array.from({ length: maxWeeks }, (_, wi) =>
        `<div class="wg" style="width:${wgW}px">`
        + `<div class="wgt">الأسبوع ${wi + 1}</div>`
        + `<div class="wdays">${WEEKDAYS.map((d) => `<span class="wd">${d}</span>`).join('')}</div>`
        + `</div>`
      ).join('')
    + `</div>`

  const monthRows = months.map((month) => {
    const weeks = monthMatrix(year, month)
    const name = monthLabel(year, month).split(' ')[0]
    const weeksHtml = weeks.map((week) =>
      `<div class="wgb" style="width:${wgW}px">${week.map((d) => cellHtml(d, month)).join('')}</div>`
    ).join('')
    return `<div class="mrow"><div class="mlbl">${escHtml(name)}</div>${weeksHtml}</div>`
  }).join('')

  // Legend — only projects that own at least one task in range
  const usedProjectIds = new Set<string>()
  byDay.forEach((list) => list.forEach((t) => { if (t.projectId) usedProjectIds.add(t.projectId) }))
  const legend = [...usedProjectIds]
    .map((id) => `<span class="lg"><span class="sw" style="background:${projectColorMap[id] ?? PRINT_FREE}"></span>${escHtml(projectNameMap[id] ?? id)}</span>`)
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>البرنامج السنوي ${year}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:16px 20px;direction:rtl}
@page{size:A4 landscape;margin:8mm}
h1{font-size:18px;font-weight:700}
.sub{color:#64748b;font-size:11px;margin-bottom:12px}
.print-btn{padding:9px 22px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:14px}
@media print{.print-btn{display:none}}
.prog{display:flex;flex-direction:column;gap:4px;width:max-content}
.hrow,.mrow{display:flex;gap:6px;align-items:stretch}
.mlbl,.mlbl-sp{flex:0 0 46px;width:46px}
.mlbl{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:9px;padding:2px}
.wg{flex:0 0 auto}
.wgt{text-align:center;font-size:7.5px;font-weight:700;color:#64748b;margin-bottom:2px}
.wdays{display:grid;grid-template-columns:repeat(7,${PDAY}px);gap:1px}
.wd{text-align:center;font-size:7px;font-weight:600;color:#94a3b8}
.wgb{flex:0 0 auto;display:grid;grid-template-columns:repeat(7,${PDAY}px);gap:1px}
.cell{min-height:38px;border:1px solid #e5e7eb;border-radius:3px;padding:1px;display:flex;flex-direction:column;gap:1px;overflow:hidden}
.cell.out{background:#fafafa;border-color:#f1f5f9}
.dn{font-size:7px;color:#94a3b8;text-align:left;line-height:1;font-weight:600}
.chip{border-radius:2px;padding:1px 2px;color:#fff;overflow:hidden}
.chip .t{display:block;font-size:6px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip .a{display:block;font-size:5.5px;line-height:1.1;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip.free{background:#e2e8f0!important;color:#334155}
.chip.done{opacity:.5}
.chip.done .t{text-decoration:line-through}
.more{font-size:6px;color:#94a3b8;text-align:center}
.legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb}
.lg{display:flex;align-items:center;gap:5px;font-size:10px;color:#334155}
.sw{width:11px;height:11px;border-radius:3px;display:inline-block}
.footer{margin-top:12px;font-size:10px;color:#94a3b8}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<h1>البرنامج السنوي ${year}</h1>
<div class="sub">عرض شامل لمهام السنة موزّعة على الأشهر والأسابيع — اللون يعبّر عن المشروع</div>
<div class="prog">
${headerRow}
${monthRows}
</div>
${legend ? `<div class="legend">${legend}</div>` : ''}
<div class="footer">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
</body>
</html>`
}
