/**
 * Product profile → high-end, print-ready PDF export.
 *
 * Builds a premium investor-grade A4 document (RTL) from the project's
 * ProductProfile and opens it in a new window that auto-invokes the browser's
 * print dialog ("Save as PDF"). Fully client-side, so it works with the static
 * export — no server, no heavy PDF library.
 *
 * Structure: cover → table of contents → numbered sections (empty ones
 * skipped) → sub-product cards → goals/advantages → contact, with a repeating
 * running footer. Waits for web fonts before printing so the Arabic type
 * renders crisply in the PDF.
 */

import type { Project, ProductProfile } from '@/types'

const IRIS = '#6366F1'

function hexAccent(color: string): string {
  const m = color.trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? `#${m[1]}` : IRIS
}

function rgbParts(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
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

function isImageUrl(s?: string): boolean {
  if (!s) return false
  const t = s.trim()
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:image')
}

export function buildProfileHTML(project: Project, profile: ProductProfile): string {
  const accent = hexAccent(project.color)
  const [ar, ag, ab] = rgbParts(accent)
  const tint = (a: number) => `rgba(${ar}, ${ag}, ${ab}, ${a})`

  const dateNow = new Intl.DateTimeFormat('ar', {
    year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn',
  }).format(new Date())
  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(new Date())
  const monogram = esc(project.name.trim().charAt(0) || '•')

  // ── Collect sections (skip empty) and build TOC in parallel ──
  let n = 0
  const toc: { num: string; title: string }[] = []
  const blocks: string[] = []
  const reg = (title: string) => {
    const num = String(++n).padStart(2, '0')
    toc.push({ num, title })
    return num
  }

  const textBlock = (title: string, body: string, lead = false) => {
    if (!body.trim()) return
    const num = reg(title)
    blocks.push(`
      <section class="block">
        <div class="block-head">
          <span class="badge">${num}</span>
          <h2>${esc(title)}</h2>
        </div>
        <div class="rule"></div>
        <p class="body${lead ? ' lead' : ''}">${esc(body.trim())}</p>
      </section>`)
  }

  textBlock('نبذة عامة', profile.overview, true)
  textBlock('المشكلة', profile.problem)
  textBlock('الحل', profile.solution)

  const subs = profile.subProducts.filter((s) => s.name.trim())
  if (subs.length > 0) {
    const num = reg('المنتجات والخدمات')
    const cards = subs.map((s, i) => `
      <div class="sp-card">
        <span class="sp-index num">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(s.name.trim())}</h3>
        ${s.description.trim() ? `<p>${esc(s.description.trim())}</p>` : ''}
      </div>`).join('')
    blocks.push(`
      <section class="block">
        <div class="block-head"><span class="badge">${num}</span><h2>المنتجات والخدمات</h2></div>
        <div class="rule"></div>
        <div class="sp-grid">${cards}</div>
      </section>`)
  }

  textBlock('الجمهور المستهدف والسوق', profile.market)
  textBlock('نموذج العمل', profile.businessModel)

  const listBlock = (title: string, items: string[]) => {
    const clean = items.filter((x) => x.trim())
    if (clean.length === 0) return
    const num = reg(title)
    const lis = clean.map((x) => `<li>${esc(x.trim())}</li>`).join('')
    blocks.push(`
      <section class="block">
        <div class="block-head"><span class="badge">${num}</span><h2>${esc(title)}</h2></div>
        <div class="rule"></div>
        <ul class="ticks">${lis}</ul>
      </section>`)
  }

  listBlock('الأهداف', profile.goals)
  listBlock('المزايا التنافسية', profile.advantages)
  textBlock('الفريق', profile.team)

  let contactHTML = ''
  if (profile.contact.trim()) {
    const num = reg('للتواصل')
    contactHTML = `
      <section class="block contact">
        <div class="block-head"><span class="badge">${num}</span><h2>للتواصل</h2></div>
        <p class="body">${esc(profile.contact.trim())}</p>
      </section>`
  }

  // ── Meta strip ──
  const meta = [
    project.category ? { label: 'التصنيف', value: esc(project.category) } : null,
    { label: 'الحالة', value: STATUS_AR[project.status] ?? esc(project.status) },
    { label: 'نسبة الإنجاز', value: `${Math.round(project.progress)}%` },
  ].filter(Boolean) as { label: string; value: string }[]
  const metaHTML = meta.map((m) => `
    <div class="meta-cell">
      <div class="meta-label">${m.label}</div>
      <div class="meta-value num">${m.value}</div>
    </div>`).join('')

  // ── TOC ──
  const tocHTML = toc.map((t) => `
    <li class="toc-row">
      <span class="toc-num num">${t.num}</span>
      <span class="toc-name">${esc(t.title)}</span>
      <span class="toc-dots"></span>
    </li>`).join('')

  const brandMark = isImageUrl(project.logo)
    ? `<img class="brand-logo" src="${esc(project.logo!.trim())}" alt="" />`
    : `<div class="monogram">${monogram}</div>`

  const title = `${esc(project.name)} — الملف التعريفي`

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

  :root {
    --accent: ${accent};
    --tint-8: ${tint(0.08)};
    --tint-12: ${tint(0.12)};
    --tint-30: ${tint(0.30)};
    --ink: #16162b;
    --ink-soft: #3a3a4d;
    --muted: #7a7a8c;
    --line: #e7e7ef;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body {
    font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
    color: var(--ink); background: #fff; line-height: 1.85; font-size: 11pt;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  }
  .num { font-feature-settings: 'lnum' 1; }

  /* ── Screen toolbar ── */
  .bar {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 14px 24px; background: #0f0f16; color: #e8e8f0;
  }
  .bar span { font-size: 13px; color: #9b9bad; }
  .bar button {
    border: none; border-radius: 9px; cursor: pointer; background: var(--accent);
    color: #fff; font-size: 14px; font-weight: 700; padding: 10px 24px; font-family: inherit;
  }

  .sheet { max-width: 210mm; margin: 0 auto; }
  .page { padding: 0 20mm; }

  /* ── Running footer (repeats each printed page) ── */
  .runfoot {
    position: fixed; bottom: 7mm; inset-inline: 18mm; z-index: 5;
    display: none; align-items: center; justify-content: space-between;
    font-size: 8.5pt; color: var(--muted); letter-spacing: .02em;
    border-top: 1px solid var(--line); padding-top: 5px;
  }
  .runfoot .accentdot { color: var(--accent); font-weight: 700; }

  /* ── Cover ── */
  .cover {
    position: relative; min-height: 250mm; padding: 22mm 20mm 24mm;
    display: flex; flex-direction: column; break-after: page; overflow: hidden;
  }
  .cover::before {
    content: ''; position: absolute; top: 0; inset-inline-start: 0;
    width: 9mm; height: 100%; background: var(--accent);
  }
  .cover::after {
    content: ''; position: absolute; top: -40mm; inset-inline-end: -40mm;
    width: 130mm; height: 130mm; border-radius: 50%; background: var(--tint-8);
  }
  .cover-top { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
  .monogram {
    width: 64px; height: 64px; border-radius: 18px; background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800;
  }
  .brand-logo { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; }
  .cover-top .brandname { font-size: 13pt; font-weight: 700; color: var(--ink); }
  .cover-top .brandname small { display: block; font-size: 9.5pt; font-weight: 500; color: var(--muted); letter-spacing: .04em; }

  .cover-hero { margin-top: auto; margin-bottom: auto; position: relative; z-index: 1; }
  .cover .kicker {
    display: inline-block; font-size: 10.5pt; letter-spacing: .22em; color: var(--accent);
    font-weight: 700; padding: 6px 14px; border: 1px solid var(--tint-30); border-radius: 999px;
    margin-bottom: 22px;
  }
  .cover h1 { font-size: 40pt; font-weight: 800; line-height: 1.12; color: #12122a; letter-spacing: -0.5px; }
  .cover .name-en { font-size: 14pt; color: var(--muted); font-weight: 500; margin-top: 8px; letter-spacing: .02em; }
  .cover .tagline {
    font-size: 16pt; color: var(--accent); font-weight: 700; line-height: 1.6;
    margin-top: 22px; max-width: 155mm; padding-inline-start: 16px; border-inline-start: 3px solid var(--accent);
  }
  .cover .desc { font-size: 11.5pt; color: var(--ink-soft); margin-top: 20px; max-width: 150mm; line-height: 1.9; }

  .cover-foot {
    position: relative; z-index: 1; display: flex; align-items: center; gap: 14px;
    font-size: 10pt; color: var(--muted); padding-top: 16px; border-top: 1px solid var(--line);
  }
  .cover-foot .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

  /* ── TOC ── */
  .toc { padding: 26mm 20mm; break-after: page; }
  .toc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
  .toc-head h2 { font-size: 20pt; font-weight: 800; color: var(--ink); }
  .toc-head .tline { flex: 1; height: 2px; background: var(--line); }
  .toc ol { list-style: none; }
  .toc-row { display: flex; align-items: center; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--line); }
  .toc-num {
    flex: none; width: 34px; height: 34px; border-radius: 9px; background: var(--tint-8);
    color: var(--accent); display: flex; align-items: center; justify-content: center;
    font-size: 12pt; font-weight: 700;
  }
  .toc-name { font-size: 13pt; font-weight: 500; color: var(--ink); }
  .toc-dots { flex: 1; border-bottom: 1.5px dotted #cfcfdb; height: 1px; margin-bottom: 4px; }

  /* ── Meta strip ── */
  .meta { display: flex; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; margin-bottom: 14mm; }
  .meta-cell { flex: 1; padding: 15px 20px; border-inline-start: 1px solid var(--line); }
  .meta-cell:first-child { border-inline-start: none; }
  .meta-label { font-size: 9.5pt; color: var(--muted); margin-bottom: 5px; }
  .meta-value { font-size: 13.5pt; font-weight: 700; color: var(--ink); }

  /* ── Content ── */
  .content { padding: 22mm 20mm; }
  .block { margin-bottom: 12mm; }
  .block-head { display: flex; align-items: center; gap: 12px; break-after: avoid; }
  .badge {
    flex: none; width: 32px; height: 32px; border-radius: 9px; background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 12pt; font-weight: 800;
    font-feature-settings: 'lnum' 1;
  }
  .block-head h2 { font-size: 15.5pt; font-weight: 700; color: #16162c; }
  .rule { height: 2px; background: linear-gradient(to left, var(--accent), var(--tint-12)); margin: 11px 0 14px; border-radius: 2px; break-after: avoid; }
  .body { font-size: 11.5pt; color: var(--ink-soft); white-space: pre-line; line-height: 1.95; }
  .body.lead { font-size: 13pt; color: var(--ink); line-height: 1.9; }

  /* ── Sub-product cards ── */
  .sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
  .sp-card {
    position: relative; border: 1px solid var(--line); border-top: 3px solid var(--accent);
    border-radius: 13px; padding: 16px 18px; background: #fbfbfe; break-inside: avoid;
  }
  .sp-index {
    position: absolute; top: 14px; inset-inline-end: 16px; font-size: 10pt; font-weight: 700; color: var(--tint-30);
  }
  .sp-card h3 { font-size: 12.5pt; font-weight: 700; color: var(--accent); margin-bottom: 6px; padding-inline-end: 26px; }
  .sp-card p { font-size: 10.5pt; color: #55556a; line-height: 1.8; }

  /* ── Tick lists ── */
  .ticks { list-style: none; display: grid; gap: 11px; }
  .ticks li {
    position: relative; padding-inline-start: 28px; font-size: 11.5pt; color: var(--ink-soft);
    line-height: 1.8; break-inside: avoid;
  }
  .ticks li::before {
    content: ''; position: absolute; inset-inline-start: 0; top: 8px;
    width: 10px; height: 10px; border-radius: 3px; background: var(--accent); transform: rotate(45deg);
  }

  /* ── Contact ── */
  .contact { border: 1px solid var(--line); border-radius: 16px; padding: 24px 26px; background: var(--tint-8); break-inside: avoid; }
  .contact .badge { background: var(--accent); }

  @page { size: A4; margin: 16mm 0 18mm; }
  @media print {
    .bar { display: none; }
    .sheet { max-width: none; margin: 0; }
    .runfoot { display: flex; }
  }
</style>
</head>
<body>
  <div class="bar">
    <span>${title}</span>
    <button onclick="window.print()">طباعة / حفظ كـ PDF</button>
  </div>

  <div class="runfoot">
    <span><span class="accentdot">●</span>&nbsp; ${esc(project.name)} — ملف تعريفي</span>
    <span class="num">${year}</span>
  </div>

  <div class="sheet">
    <!-- Cover -->
    <header class="cover">
      <div class="cover-top">
        ${brandMark}
        <div class="brandname">${esc(project.name)}${project.nameEn ? `<small>${esc(project.nameEn)}</small>` : ''}</div>
      </div>

      <div class="cover-hero">
        <span class="kicker">ملف تعريفي</span>
        <h1>${esc(project.name)}</h1>
        ${project.nameEn ? `<div class="name-en">${esc(project.nameEn)}</div>` : ''}
        ${profile.tagline.trim() ? `<div class="tagline">${esc(profile.tagline.trim())}</div>` : ''}
        ${project.description.trim() ? `<div class="desc">${esc(project.description.trim())}</div>` : ''}
      </div>

      <div class="cover-foot">
        <span>وثيقة تعريفية</span>
        <span class="dot"></span>
        <span class="num">${dateNow}</span>
      </div>
    </header>

    <!-- Table of contents -->
    <section class="toc">
      <div class="toc-head"><h2>المحتويات</h2><span class="tline"></span></div>
      <ol>${tocHTML}</ol>
    </section>

    <!-- Content -->
    <main class="content">
      ${meta.length ? `<div class="meta">${metaHTML}</div>` : ''}
      ${blocks.join('\n')}
      ${contactHTML}
    </main>
  </div>

  <script>
    window.addEventListener('load', function () {
      var go = function () { try { window.focus(); window.print(); } catch (e) {} };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { setTimeout(go, 250); });
        setTimeout(go, 1800); // safety net if fonts hang
      } else {
        setTimeout(go, 700);
      }
    }, { once: true });
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
