'use client'
import { ExternalLink, Tag, Calendar, Layers, FileDown } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project } from '@/types'
import { useTaskStore, usePlanStore, useSprintStore, useNoteStore, useDocumentStore, useTeamStore, useKpiStore } from '@/store/store'
import StatusBadge from '@/components/shared/StatusBadge'
import ProgressBar from '@/components/shared/ProgressBar'
import { formatDateAr, hexToRgba } from '@/lib/utils'

interface OverviewTabProps {
  project: Project
}

const STATUS_AR: Record<string, string> = {
  active: 'نشط', paused: 'متوقف مؤقتاً', completed: 'مكتمل', planning: 'تخطيط',
}
const PHASE_STATUS_AR: Record<string, string> = {
  completed: 'مكتملة', 'in-progress': 'جارية', upcoming: 'قادمة',
}
const DOC_TYPE_AR: Record<string, string> = {
  spec: 'مواصفات', guide: 'دليل', design: 'تصميم', research: 'بحث', other: 'أخرى',
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildProductReportHTML({ project, phases, docs, team, kpis, tasks, doneTasks }: {
  project: Project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phases: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  team: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kpis: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[]
  doneTasks: number
}): string {
  const color = project.color
  const dateNow = new Date().toLocaleDateString('ar-SA')
  const logoBlock = project.logo
    ? `<img src="${esc(project.logo)}" alt="${esc(project.name)}" class="lh-logo">`
    : `<span class="lh-icon" style="background:color-mix(in srgb,${color} 15%,#fff);color:${color}">${esc(project.name.slice(0, 2))}</span>`

  const phasesHtml = phases.length
    ? `<div class="sec"><h2>خارطة الطريق</h2>
       ${phases.map((ph) => `
         <div class="phase-card">
           <div class="phase-head">
             <span class="phase-title">${esc(ph.title)}</span>
             <span class="pill ${ph.status === 'completed' ? 'ok' : ph.status === 'in-progress' ? 'pill-active' : 'wait'}">${PHASE_STATUS_AR[ph.status] ?? ph.status}</span>
           </div>
           ${ph.description ? `<p class="phase-desc">${esc(ph.description)}</p>` : ''}
           ${ph.milestones?.length ? `<ul class="cl">${ph.milestones.map((m: { title: string; done: boolean }) => `<li class="${m.done ? 'done' : ''}">${m.done ? '✓' : '○'} ${esc(m.title)}</li>`).join('')}</ul>` : ''}
         </div>`).join('')}
       </div>`
    : ''

  const docsHtml = docs.length
    ? `<div class="sec"><h2>منتجاتنا ووثائق المنتج</h2>
       <table>
         <thead><tr><th>الاسم</th><th>النوع</th><th>الوصف</th></tr></thead>
         <tbody>${docs.map((d) => `<tr>
           <td><b>${esc(d.title)}</b>${d.url ? ` <span style="font-size:10px;color:#64748b">${esc(d.url)}</span>` : ''}</td>
           <td>${DOC_TYPE_AR[d.type as string] ?? d.type}</td>
           <td style="font-size:11px;color:#475569">${d.description ? esc(d.description) : '—'}</td>
         </tr>`).join('')}</tbody>
       </table></div>`
    : ''

  const kpisHtml = kpis.length
    ? `<div class="sec"><h2>مؤشرات الأداء الرئيسية</h2>
       <table>
         <thead><tr><th>المؤشر</th><th>القيمة</th><th>الهدف</th><th>الملاحظات</th></tr></thead>
         <tbody>${kpis.map((k) => `<tr>
           <td>${esc(k.name)}</td>
           <td class="num">${k.value} ${esc(k.unit)}</td>
           <td class="num">${k.target ? `${k.target} ${esc(k.unit)}` : '—'}</td>
           <td style="font-size:11px;color:#475569">${k.notes ? esc(k.notes) : '—'}</td>
         </tr>`).join('')}</tbody>
       </table></div>`
    : ''

  const teamHtml = team.length
    ? `<div class="sec"><h2>الفريق</h2>
       <table>
         <thead><tr><th>الاسم</th><th>الدور</th><th>الحالة</th></tr></thead>
         <tbody>${team.map((m) => `<tr>
           <td>${esc(m.name)}</td>
           <td>${esc(m.role)}</td>
           <td><span class="pill ${m.status === 'active' ? 'ok' : 'wait'}">${m.status === 'active' ? 'نشط' : m.status === 'invited' ? 'مدعو' : 'غير نشط'}</span></td>
         </tr>`).join('')}</tbody>
       </table></div>`
    : ''

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير المنتج — ${esc(project.name)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:28px 36px;direction:rtl;font-size:13px;line-height:1.7}
.print-btn{padding:8px 20px;background:${color};color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:16px}
@media print{.print-btn{display:none}}
.lh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.lh-brand{display:flex;align-items:center;gap:10px}
.lh-logo{height:40px;width:auto;object-fit:contain}
.lh-icon{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;font-size:15px;font-weight:700}
.lh-name{font-size:14px;font-weight:700;color:#0f172a}
.lh-badge{font-size:11px;font-weight:700;padding:3px 12px;border-radius:99px;background:#f0f9ff;color:#0369a1}
.lh-rule{border:none;border-top:2px solid ${color};margin:10px 0 14px}
.doc-head{margin-bottom:18px}
.doc-head h1{font-size:20px;font-weight:700;color:${color};margin-bottom:4px}
.doc-head .sub{font-size:12px;color:#64748b;line-height:1.6}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e2e8f0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px}
.sum-cell{background:#f8fafc;padding:10px 14px}
.sum-label{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase}
.sum-val{font-size:18px;font-weight:700;color:${color};font-variant-numeric:tabular-nums}
.sec{margin-bottom:20px}
h2{font-size:13px;font-weight:700;color:${color};margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f8fafc;text-align:right;padding:6px 10px;font-weight:700;border:1px solid #e2e8f0;font-size:11px}
td{padding:6px 10px;border:1px solid #e2e8f0;vertical-align:top}
.num{font-variant-numeric:tabular-nums}
.pill{display:inline-block;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:700}
.pill.ok{background:#dcfce7;color:#15803d}
.pill.wait{background:#fef3c7;color:#b45309}
.pill.pill-active{background:#dbeafe;color:#1d4ed8}
.phase-card{border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:8px;background:#fafafa}
.phase-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.phase-title{font-size:13px;font-weight:700;flex:1}
.phase-desc{font-size:11px;color:#64748b;margin-bottom:6px}
.cl{padding-inline-start:4px;list-style:none;font-size:11px;margin-top:5px}
.cl li{margin-bottom:2px;color:#334155}
.cl li.done{color:#9ca3af;text-decoration:line-through}
.footer{margin-top:24px;padding-top:9px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<div class="lh">
  <div class="lh-brand">
    ${logoBlock}
    <span class="lh-name">${esc(project.name)}</span>
  </div>
  <span class="lh-badge">تقرير المنتج</span>
</div>
<hr class="lh-rule">
<div class="doc-head">
  <h1>${esc(project.name)}</h1>
  <p class="sub">${esc(project.description ?? '')}</p>
</div>
<div class="summary">
  <div class="sum-cell"><div class="sum-label">التقدم</div><div class="sum-val">${project.progress}%</div></div>
  <div class="sum-cell"><div class="sum-label">المهام</div><div class="sum-val">${doneTasks}/${tasks.length}</div></div>
  <div class="sum-cell"><div class="sum-label">الحالة</div><div class="sum-val" style="font-size:13px">${STATUS_AR[project.status] ?? project.status}</div></div>
  <div class="sum-cell"><div class="sum-label">الفئة</div><div class="sum-val" style="font-size:13px">${esc(project.category ?? '—')}</div></div>
</div>
${docsHtml}
${phasesHtml}
${kpisHtml}
${teamHtml}
<div class="footer"><span>${esc(project.name)}</span><span class="num">${dateNow}</span></div>
</body>
</html>`
}

export default function OverviewTab({ project }: OverviewTabProps) {
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === project.id)))
  const phases = usePlanStore(useShallow((s) => s.phases.filter((ph) => ph.projectId === project.id).sort((a, b) => a.order - b.order)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === project.id)))
  const notes = useNoteStore(useShallow((s) => s.notes.filter((n) => n.projectId === project.id)))
  const docs = useDocumentStore(useShallow((s) => s.docs.filter((d) => d.projectId === project.id).sort((a, b) => a.order - b.order)))
  const team = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === project.id).sort((a, b) => a.order - b.order)))
  const kpis = useKpiStore(useShallow((s) => s.kpis.filter((k) => k.projectId === project.id).sort((a, b) => a.order - b.order)))
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const donePhases = phases.filter((ph) => ph.status === 'completed').length
  const activeSprints = sprints.filter((sp) => sp.status === 'active').length

  const stats = [
    { label: 'التقدم',    value: `${project.progress}%` },
    { label: 'المهام',    value: `${doneTasks}/${tasks.length}` },
    { label: 'السبرنتات', value: `${activeSprints}/${sprints.length}` },
    { label: 'الملاحظات', value: `${notes.length}` },
  ]

  const exportReport = () => {
    const html = buildProductReportHTML({ project, phases, docs, team, kpis, tasks, doneTasks })
    const w = window.open('', '_blank', 'width=900,height=800,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  return (
    <div className="space-y-5">
      {/* Stats strip + export button */}
      <div className="flex items-center gap-3">
        <div className="axis-stats flex-1">
          {stats.map((s) => (
            <div key={s.label} className="axis-stat">
              <span className="axis-label">{s.label}</span>
              <span className="axis-num text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold shrink-0 transition-colors"
          style={{
            background: 'var(--color-surface-raised)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-surface-border)',
          }}
          title="تصدير تقرير شامل عن المنتج"
        >
          <FileDown size={13} />
          تصدير تقرير
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main info — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="axis-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              الوصف
            </h3>
            <p className="text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
              {project.description || 'لا يوجد وصف'}
            </p>
          </div>

          {/* Tags */}
          {(project.tags?.length ?? 0) > 0 && (
            <div className="axis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  التقنيات والوسوم
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(project.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{
                      background: hexToRgba(project.color, 0.1),
                      color: project.color,
                      border: `1px solid ${hexToRgba(project.color, 0.25)}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {project.links && project.links.length > 0 && (
            <div className="axis-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                الروابط
              </h3>
              <div className="space-y-2">
                {project.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm py-2 rounded-lg px-3 transition-colors hover:bg-white/5"
                    style={{ color: project.color }}
                  >
                    <ExternalLink size={13} />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side stats — 1/3 */}
        <div className="space-y-4">
          {/* Progress card */}
          <div className="axis-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              التقدم الإجمالي
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={project.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - project.progress / 100)}`}
                    className="transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: project.color }}>
                    {project.progress}%
                  </span>
                </div>
              </div>
            </div>
            <ProgressBar value={project.progress} color={project.color} size="sm" />
          </div>

          {/* Quick stats */}
          <div className="axis-card p-5 space-y-3">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              ملخص سريع
            </h3>
            {[
              { label: 'الحالة',       value: <StatusBadge status={project.status} size="sm" /> },
              { label: 'الفئة',        value: project.category || '—', icon: <Layers size={12} /> },
              { label: 'المهام',        value: `${doneTasks} / ${tasks.length} منجزة` },
              { label: 'المراحل',       value: `${donePhases} / ${phases.length} مكتملة` },
              { label: 'تاريخ الإنشاء', value: formatDateAr(project.createdAt), icon: <Calendar size={12} /> },
              { label: 'آخر تحديث',    value: formatDateAr(project.updatedAt), icon: <Calendar size={12} /> },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                {typeof row.value === 'string' ? (
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{row.value}</span>
                ) : (
                  row.value
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
