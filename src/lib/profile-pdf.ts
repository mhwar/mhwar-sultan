/**
 * Product profile → print-ready PDF export.
 *
 * Builds a polished, investor-facing A4 document (RTL, light theme) from the
 * project's ProductProfile and opens it in a new window that auto-invokes the
 * browser's print dialog ("Save as PDF"). Runs fully client-side, so it works
 * with the static export — no server, no heavy PDF library.
 *
 * Layout: cover page → meta strip → numbered sections (empty ones skipped) →
 * sub-product cards → goals/advantages lists → closing contact card.
 */

import type { Project, ProductProfile } from '@/types'

const IRIS = '#6366F1'

function hexAccent(color: string): string {
  const m = color.trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? `#${m[1]}` : IRIS
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const STATUS_AR: Record<string, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  'on-hold': 'متوقف',
  completed: 'مكتمل',
  archived: 'مؤرشف',
}

export function buildProfileHTML(project: Project, profile: ProductProfile): string {
  const accent = hexAccent(project.color)
  const dateNow = new Intl.DateTimeFormat('ar', {
    year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn',
  }).format(new Date())
  const monogram = esc(project.name.trim().charAt(0) || '•')

  // ── Numbered content blocks (skip empty) ────────────────
  let n = 0
  const num = () => String(++n).padStart(2, '0')
  const blocks: string[] = []

  const textBlock = (title: string, body: string) => {
    if (!body.trim()) return
    blocks.push(`
      <section class="block">
        <div class="block-head"><span class="badge">${num()}</span><h2>${esc(title)}</h2></div>
        <div class="rule"></div>
        <p class="body">${esc(body.trim())}</p>
      </section>`)
  }

  textBlock('نبذة عامة', profile.overview)
  textBlock('المشكلة', profile.problem)
  textBlock('الحل', profile.solution)

  // Sub-products as cards
  const subs = profile.subProducts.filter((s) => s.name.trim())
  if (subs.length > 0) {
    const cards = subs.map((s) => `
      <div class="sp-card">
        <h3>${esc(s.name.trim())}</h3>
        ${s.description.trim() ? `<p>${esc(s.description.trim())}</p>` : ''}
      </div>`).join('')
    blocks.push(`
      <section class="block">
        <div class="block-head"><span class="badge">${num()}</span><h2>المنتجات والخدمات</h2></div>
        <div class="rule"></div>
        <div class="sp-grid">${cards}</div>
      </section>`)
  }

  textBlock('الجمهور المستهدف والسوق', profile.market)
  textBlock('نموذج العمل', profile.businessModel)

  const listBlock = (title: string, items: string[]) => {
    const clean = items.filter((x) => x.trim())
    if (clean.length === 0) return
    const lis = clean.map((x) => `<li>${esc(x.trim())}</li>`).join('')
    blocks.push(`
      <section class="block">
        <div class="block-head"><span class="badge">${num()}</span><h2>${esc(title)}</h2></div>
        <div class="rule"></div>
        <ul class="ticks">${lis}</ul>
      </section>`)
  }

  listBlock('الأهداف', profile.goals)
  listBlock('المزايا التنافسية', profile.advantages)

  textBlock('الفريق', profile.team)

  const contactBlock = profile.contact.trim()
    ? `
      <section class="block contact">
        <h2>للتواصل</h2>
        <p class="body">${esc(profile.contact.trim())}</p>
      </section>`
    : ''

  // ── Meta strip ──────────────────────────────────────────
  const meta = [
    project.category ? { label: 'التصنيف', value: esc(project.category) } : null,
    { label: 'الحالة', value: STATUS_AR[project.status] ?? esc(project.status) },
    { label: 'نسبة الإنجاز', value: `${Math.round(project.progress)}%` },
  ].filter(Boolean) as { label: string; value: string }[]

  const metaHTML = meta.map((m) => `
    <div class="meta-cell">
      <div class="meta-label">${m.label}</div>
      <div class="meta-value">${m.value}</div>
    </div>`).join('')

  const title = `${esc(project.name)} — الملف التعريفي`

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { --accent: ${accent}; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body {
    font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', 'Cairo', Arial, sans-serif;
    color: #1b1b29; background: #fff; line-height: 1.85; font-size: 11pt;
    -webkit-font-smoothing: antialiased;
  }
  .num { font-variant-numeric: lining-nums; }

  /* ── Toolbar (screen only) ── */
  .bar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 14px 24px;
    background: #0f0f16; color: #e8e8f0;
  }
  .bar span { font-size: 13px; color: #9b9bad; }
  .bar button {
    border: none; border-radius: 8px; cursor: pointer;
    background: var(--accent); color: #fff;
    font-size: 14px; font-weight: 600; padding: 9px 22px; font-family: inherit;
  }

  .sheet { max-width: 210mm; margin: 0 auto; padding: 0 18mm; }

  /* ── Cover ── */
  .cover {
    position: relative; min-height: 248mm;
    display: flex; flex-direction: column; justify-content: center;
    padding: 24mm 0; break-after: page;
  }
  .cover::before {
    content: ''; position: absolute; top: 0; inset-inline-start: -18mm;
    width: 8mm; height: 100%; background: var(--accent);
  }
  .monogram {
    width: 84px; height: 84px; border-radius: 22px;
    background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 42px; font-weight: 700; margin-bottom: 28px;
    box-shadow: 0 10px 30px rgba(0,0,0,.12);
  }
  .cover .kicker {
    font-size: 13pt; letter-spacing: .08em; color: var(--accent);
    font-weight: 600; margin-bottom: 14px;
  }
  .cover h1 { font-size: 38pt; font-weight: 800; line-height: 1.15; color: #14142a; }
  .cover .tagline {
    font-size: 17pt; color: var(--accent); font-weight: 600;
    margin-top: 18px; max-width: 150mm;
  }
  .cover .desc {
    font-size: 12pt; color: #5a5a6e; margin-top: 18px; max-width: 150mm; line-height: 1.8;
  }
  .cover .cover-foot {
    position: absolute; bottom: 18mm; inset-inline-start: 0;
    display: flex; align-items: center; gap: 12px;
    font-size: 11pt; color: #8a8a9a;
  }
  .cover .cover-foot .dot { width: 4px; height: 4px; border-radius: 50%; background: #c5c5d2; }

  /* ── Meta strip ── */
  .meta {
    display: flex; gap: 0; border: 1px solid #e7e7ef; border-radius: 12px;
    overflow: hidden; margin: 0 0 14mm;
  }
  .meta-cell { flex: 1; padding: 14px 18px; border-inline-start: 1px solid #eef0f6; }
  .meta-cell:first-child { border-inline-start: none; }
  .meta-label { font-size: 9.5pt; color: #9090a2; margin-bottom: 4px; }
  .meta-value { font-size: 13pt; font-weight: 700; color: #1b1b29; }

  /* ── Section blocks ── */
  .block { margin-bottom: 11mm; break-inside: avoid; }
  .block-head { display: flex; align-items: center; gap: 12px; }
  .badge {
    flex: none; width: 30px; height: 30px; border-radius: 9px;
    background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 12pt; font-weight: 700; font-variant-numeric: lining-nums;
  }
  .block-head h2 { font-size: 15pt; font-weight: 700; color: #17172c; }
  .rule { height: 2px; background: linear-gradient(to left, var(--accent), transparent); margin: 10px 0 14px; border-radius: 2px; }
  .body { font-size: 11.5pt; color: #33333f; white-space: pre-line; line-height: 1.9; }

  /* ── Sub-product cards ── */
  .sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sp-card {
    border: 1px solid #e7e7ef; border-top: 3px solid var(--accent);
    border-radius: 12px; padding: 16px 18px; background: #fbfbfe; break-inside: avoid;
  }
  .sp-card h3 { font-size: 12.5pt; font-weight: 700; color: var(--accent); margin-bottom: 6px; }
  .sp-card p { font-size: 10.5pt; color: #55556a; line-height: 1.75; }

  /* ── Tick lists ── */
  .ticks { list-style: none; display: grid; gap: 10px; }
  .ticks li {
    position: relative; padding-inline-start: 26px;
    font-size: 11.5pt; color: #33333f; line-height: 1.75; break-inside: avoid;
  }
  .ticks li::before {
    content: ''; position: absolute; inset-inline-start: 0; top: 9px;
    width: 9px; height: 9px; border-radius: 3px; background: var(--accent);
    transform: rotate(45deg);
  }

  /* ── Contact ── */
  .contact {
    border: 1px solid #e7e7ef; border-radius: 14px; padding: 22px 24px;
    background: #f7f7fc; break-inside: avoid;
  }
  .contact h2 {
    font-size: 14pt; font-weight: 700; color: var(--accent); margin-bottom: 10px;
  }

  @page { size: A4; margin: 14mm; }
  @media print {
    .bar { display: none; }
    .sheet { max-width: none; margin: 0; padding: 0; }
    .cover::before { inset-inline-start: 0; }
    .cover .cover-foot { inset-inline-start: 0; }
  }
</style>
</head>
<body>
  <div class="bar">
    <span>${title}</span>
    <button onclick="window.print()">طباعة / حفظ كـ PDF</button>
  </div>

  <div class="sheet">
    <!-- Cover -->
    <header class="cover">
      <div class="monogram">${monogram}</div>
      <div class="kicker">ملف تعريفي</div>
      <h1>${esc(project.name)}</h1>
      ${profile.tagline.trim() ? `<div class="tagline">${esc(profile.tagline.trim())}</div>` : ''}
      ${project.description.trim() ? `<div class="desc">${esc(project.description.trim())}</div>` : ''}
      <div class="cover-foot">
        <span>${esc(project.name)}</span>
        <span class="dot"></span>
        <span class="num">${dateNow}</span>
      </div>
    </header>

    ${meta.length ? `<div class="meta">${metaHTML}</div>` : ''}

    ${blocks.join('\n')}
    ${contactBlock}
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 350);
    });
  </script>
</body>
</html>`
}

export function exportProfilePdf(project: Project, profile: ProductProfile): void {
  const html = buildProfileHTML(project, profile)
  const win = window.open('', '_blank')
  if (!win) {
    // Popup blocked — fall back to a downloadable HTML file the user can open + print.
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name} - الملف التعريفي.html`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
