/* Lightweight markdown → HTML renderer for the notes editor preview.
 * Supports headings, bold/italic, inline code, code fences, blockquotes,
 * bullet/ordered lists, interactive task checkboxes, links, and dividers.
 * Task checkboxes carry data-check-index for toggling back into the source. */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Inline spans: code, bold, italic, links (applied after HTML-escaping). */
function inline(text: string): string {
  let t = escapeHtml(text)
  // inline code first so its contents are not re-formatted
  t = t.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  // [label](url) — url already escaped; only allow http/https/mailto
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    const safe = /^(https?:|mailto:)/i.test(url) ? url : '#'
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="md-link">${label}</a>`
  })
  return t
}

export function renderMarkdown(md: string): string {
  if (!md.trim()) return ''
  const lines = md.split('\n')
  const out: string[] = []
  let checkIndex = 0
  let i = 0
  let inList: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (inList) { out.push(`</${inList}>`); inList = null }
  }

  while (i < lines.length) {
    const line = lines[i]

    // code fence
    if (line.trim().startsWith('```')) {
      closeList()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(escapeHtml(lines[i]))
        i++
      }
      i++ // skip closing fence
      out.push(`<pre class="md-pre"><code>${code.join('\n')}</code></pre>`)
      continue
    }

    // horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      closeList()
      out.push('<hr class="md-hr" />')
      i++
      continue
    }

    // headings
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      closeList()
      const level = h[1].length
      out.push(`<h${level} class="md-h${level}">${inline(h[2])}</h${level}>`)
      i++
      continue
    }

    // task checkbox
    const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (task) {
      if (inList !== 'ul') { closeList(); out.push('<ul class="md-tasks">'); inList = 'ul' }
      const done = task[1].toLowerCase() === 'x'
      const idx = checkIndex++
      out.push(
        `<li class="md-task ${done ? 'is-done' : ''}">` +
        `<span class="md-checkbox ${done ? 'is-on' : ''}" data-check-index="${idx}" role="checkbox" aria-checked="${done}"></span>` +
        `<span class="md-task-label">${inline(task[2])}</span></li>`
      )
      i++
      continue
    }

    // bullet list
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      if (inList !== 'ul') { closeList(); out.push('<ul class="md-ul">'); inList = 'ul' }
      out.push(`<li>${inline(bullet[1])}</li>`)
      i++
      continue
    }

    // ordered list
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ordered) {
      if (inList !== 'ol') { closeList(); out.push('<ol class="md-ol">'); inList = 'ol' }
      out.push(`<li>${inline(ordered[1])}</li>`)
      i++
      continue
    }

    // blockquote
    const quote = line.match(/^\s*>\s?(.*)$/)
    if (quote) {
      closeList()
      out.push(`<blockquote class="md-quote">${inline(quote[1])}</blockquote>`)
      i++
      continue
    }

    // blank line
    if (line.trim() === '') {
      closeList()
      i++
      continue
    }

    // paragraph
    closeList()
    out.push(`<p class="md-p">${inline(line)}</p>`)
    i++
  }

  closeList()
  return out.join('')
}

/** Toggle the nth task checkbox (`- [ ]` ↔ `- [x]`) in the source text. */
export function toggleTaskInSource(md: string, targetIndex: number): string {
  const lines = md.split('\n')
  let idx = 0
  return lines.map((line) => {
    const m = line.match(/^(\s*[-*]\s+\[)([ xX])(\]\s+.*)$/)
    if (!m) return line
    const cur = idx
    idx++
    if (cur !== targetIndex) return line
    const checked = m[2].toLowerCase() === 'x'
    return `${m[1]}${checked ? ' ' : 'x'}${m[3]}`
  }).join('\n')
}

/** Reading stats for the editor footer. */
export function noteStats(content: string): { words: number; minutes: number } {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.round(words / 200))
  return { words, minutes }
}

/* ── New-note templates ─────────────────────────────────── */
export interface NoteTemplate {
  key: string
  label: string
  icon: string   // lucide icon name resolved in the tab
  title: string
  body: string
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    key: 'blank',
    label: 'فارغة',
    icon: 'FileText',
    title: 'ملاحظة جديدة',
    body: '',
  },
  {
    key: 'meeting',
    label: 'محضر اجتماع',
    icon: 'Users',
    title: 'محضر اجتماع',
    body: '## الحضور\n- \n\n## جدول الأعمال\n1. \n\n## النقاط والقرارات\n- \n\n## مهام المتابعة\n- [ ] \n- [ ] ',
  },
  {
    key: 'tasks',
    label: 'قائمة مهام',
    icon: 'ListChecks',
    title: 'قائمة مهام',
    body: '- [ ] \n- [ ] \n- [ ] ',
  },
  {
    key: 'decision',
    label: 'قرار',
    icon: 'GitBranch',
    title: 'سجل قرار',
    body: '## السياق\n\n## الخيارات المطروحة\n1. \n2. \n\n## القرار\n\n## المبررات\n- ',
  },
  {
    key: 'brainstorm',
    label: 'عصف ذهني',
    icon: 'Lightbulb',
    title: 'عصف ذهني',
    body: '## الفكرة\n\n## أفكار\n- \n- \n\n## الخطوة التالية\n- [ ] ',
  },
]
