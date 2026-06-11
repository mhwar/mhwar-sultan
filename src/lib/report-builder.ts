import type { Project } from '@/types'

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
export function buildProductReportHTML({ project, phases, docs, team, kpis, tasks, doneTasks }: {
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

export function downloadReport(project: Project, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `تقرير-${project.name}-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
