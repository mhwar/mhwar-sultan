'use client'
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  Plus, Pin, Trash2, FileText, Users, ListChecks, GitBranch, Lightbulb,
  Bold, Italic, Heading, List, ListTodo, Quote, Code, Link2, Minus,
  Eye, Pencil, Search, Tag, X,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useNoteStore } from '@/store/store'
import type { Project, Note } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { formatDateAr } from '@/lib/utils'
import {
  renderMarkdown, toggleTaskInSource, noteStats, NOTE_TEMPLATES, type NoteTemplate,
} from './notes/notesMarkdown'

const TEMPLATE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  FileText, Users, ListChecks, GitBranch, Lightbulb,
}

interface NotesTabProps {
  project: Project
}

export default function NotesTab({ project }: NotesTabProps) {
  const { addNote, updateNote, deleteNote } = useNoteStore()
  const notes = useNoteStore(useShallow((s) =>
    [...s.notes.filter((n) => n.projectId === project.id)].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  ))
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null)
  const activeNote = notes.find((n) => n.id === activeId)
  const [localContent, setLocalContent] = useState(activeNote?.content ?? '')
  const [localTitle, setLocalTitle] = useState(activeNote?.title ?? '')
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [search, setSearch] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectNote = useCallback((note: Note) => {
    setActiveId(note.id)
    setLocalContent(note.content)
    setLocalTitle(note.title)
    setMode('write')
  }, [])

  const handleSave = useCallback(() => {
    if (!activeId) return
    updateNote(activeId, { title: localTitle, content: localContent })
  }, [activeId, localTitle, localContent, updateNote])

  const createNote = (tpl: NoteTemplate) => {
    setShowTemplates(false)
    const id = addNote({ projectId: project.id, title: tpl.title, content: tpl.body, pinned: false })
    setActiveId(id)
    setLocalContent(tpl.body)
    setLocalTitle(tpl.title)
    setMode('write')
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [notes, search])

  /* ── Markdown toolbar actions (operate on the textarea selection) ── */
  const applyEdit = (next: string, selStart: number, selEnd: number) => {
    setLocalContent(next)
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) { ta.focus(); ta.setSelectionRange(selStart, selEnd) }
    })
  }

  const wrap = (before: string, after = before) => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const sel = localContent.slice(s, e) || 'نص'
    const next = localContent.slice(0, s) + before + sel + after + localContent.slice(e)
    applyEdit(next, s + before.length, s + before.length + sel.length)
  }

  const prefixLine = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: s } = ta
    const lineStart = localContent.lastIndexOf('\n', s - 1) + 1
    const next = localContent.slice(0, lineStart) + prefix + localContent.slice(lineStart)
    applyEdit(next, s + prefix.length, s + prefix.length)
  }

  const insertBlock = (text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: s } = ta
    const pre = s > 0 && localContent[s - 1] !== '\n' ? '\n' : ''
    const next = localContent.slice(0, s) + pre + text + localContent.slice(s)
    const pos = s + pre.length + text.length
    applyEdit(next, pos, pos)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') { e.preventDefault(); wrap('**') }
      else if (e.key === 'i') { e.preventDefault(); wrap('*') }
      else if (e.key === 's') { e.preventDefault(); handleSave() }
    }
  }

  /* ── Tags ── */
  const addTag = () => {
    const t = tagInput.trim()
    if (!t || !activeNote) return
    const cur = activeNote.tags ?? []
    if (!cur.includes(t)) updateNote(activeNote.id, { tags: [...cur, t] })
    setTagInput('')
  }
  const removeTag = (t: string) => {
    if (!activeNote) return
    updateNote(activeNote.id, { tags: (activeNote.tags ?? []).filter((x) => x !== t) })
  }

  /* ── Interactive checkbox toggle from preview ── */
  const onPreviewClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-check-index]')
    if (!target || !activeId) return
    const idx = parseInt(target.getAttribute('data-check-index') || '-1', 10)
    if (idx < 0) return
    const next = toggleTaskInSource(localContent, idx)
    setLocalContent(next)
    updateNote(activeId, { content: next })
  }

  const previewHtml = useMemo(() => renderMarkdown(localContent), [localContent])
  const stats = noteStats(localContent)

  // Close templates menu on outside interaction
  useEffect(() => {
    if (!showTemplates) return
    const close = () => setShowTemplates(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [showTemplates])

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="لا توجد ملاحظات بعد"
        description="ابدأ بقالب جاهز أو ملاحظة فارغة"
        action={
          <div className="flex flex-wrap gap-2 justify-center">
            {NOTE_TEMPLATES.map((tpl) => {
              const Icon = TEMPLATE_ICON[tpl.icon] ?? FileText
              return (
                <button
                  key={tpl.key}
                  onClick={() => createNote(tpl)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ background: 'var(--surface-2)', color: 'var(--fg-2)', border: '1px solid var(--border-subtle)' }}
                >
                  <Icon size={14} /> {tpl.label}
                </button>
              )
            })}
          </div>
        }
      />
    )
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:h-[calc(100vh-18rem)]">
      {/* Notes list — 1/3 */}
      <div className="md:col-span-1 flex flex-col gap-2 md:overflow-y-auto pe-1">
        {/* New note with template picker */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTemplates((v) => !v) }}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: `${project.color}15`, color: project.color, border: `1px dashed ${project.color}40` }}
          >
            <Plus size={15} />
            ملاحظة جديدة
          </button>
          {showTemplates && (
            <div
              className="absolute z-30 mt-1 w-full rounded-xl p-1 shadow-lg"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {NOTE_TEMPLATES.map((tpl) => {
                const Icon = TEMPLATE_ICON[tpl.icon] ?? FileText
                return (
                  <button
                    key={tpl.key}
                    onClick={() => createNote(tpl)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 text-start"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Icon size={14} />
                    {tpl.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الملاحظات"
            className="w-full h-8 rounded-lg ps-7 pe-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {filtered.map((note) => (
          <div
            key={note.id}
            onClick={() => selectNote(note)}
            className="p-3 rounded-xl cursor-pointer transition-all group"
            style={{
              background: activeId === note.id ? `${project.color}12` : 'var(--surface-2)',
              border: `1px solid ${activeId === note.id ? `${project.color}30` : 'var(--border-subtle)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {note.pinned && <Pin size={10} style={{ color: project.color }} />}
                  <p className="text-sm font-semibold truncate" style={{ color: activeId === note.id ? project.color : 'var(--color-text-primary)' }}>
                    {note.title}
                  </p>
                </div>
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {note.content.replace(/[#*`>\-[\]]/g, '').trim() || 'فارغة...'}
                </p>
              </div>
            </div>
            {(note.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(note.tags ?? []).slice(0, 3).map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-1)', color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
              {formatDateAr(note.updatedAt)}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>لا نتائج للبحث</p>
        )}
      </div>

      {/* Note editor — 2/3 */}
      {activeNote ? (
        <div className="md:col-span-2 axis-card flex flex-col min-h-64 md:overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center justify-between px-5 py-3 gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleSave}
              className="bg-transparent text-base font-bold outline-none flex-1 min-w-0"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <div className="flex items-center gap-1 shrink-0">
              {/* Write/Preview toggle */}
              <div className="flex rounded-lg p-0.5 me-1" style={{ background: 'var(--surface-2)' }}>
                <button
                  onClick={() => setMode('write')}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={mode === 'write' ? { background: 'var(--color-surface-overlay)', color: project.color } : { color: 'var(--color-text-muted)' }}
                  title="تحرير"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => { handleSave(); setMode('preview') }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={mode === 'preview' ? { background: 'var(--color-surface-overlay)', color: project.color } : { color: 'var(--color-text-muted)' }}
                  title="معاينة"
                >
                  <Eye size={13} />
                </button>
              </div>
              <button
                onClick={() => updateNote(activeNote.id, { pinned: !activeNote.pinned })}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: activeNote.pinned ? project.color : 'var(--color-text-muted)' }}
                title={activeNote.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
              >
                <Pin size={14} />
              </button>
              <button
                onClick={() => {
                  deleteNote(activeNote.id)
                  const remaining = notes.filter((n) => n.id !== activeNote.id)
                  if (remaining.length > 0) selectNote(remaining[0])
                  else setActiveId(null)
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--color-text-muted)' }}
                title="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Markdown toolbar (write mode only) */}
          {mode === 'write' && (
            <div className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <ToolBtn icon={<Heading size={14} />} title="عنوان" onClick={() => prefixLine('## ')} />
              <ToolBtn icon={<Bold size={14} />} title="غامق (Ctrl+B)" onClick={() => wrap('**')} />
              <ToolBtn icon={<Italic size={14} />} title="مائل (Ctrl+I)" onClick={() => wrap('*')} />
              <Divider />
              <ToolBtn icon={<List size={14} />} title="قائمة نقطية" onClick={() => prefixLine('- ')} />
              <ToolBtn icon={<ListTodo size={14} />} title="قائمة مهام" onClick={() => prefixLine('- [ ] ')} />
              <ToolBtn icon={<Quote size={14} />} title="اقتباس" onClick={() => prefixLine('> ')} />
              <Divider />
              <ToolBtn icon={<Code size={14} />} title="كود" onClick={() => wrap('`')} />
              <ToolBtn icon={<Link2 size={14} />} title="رابط" onClick={() => wrap('[', '](https://)')} />
              <ToolBtn icon={<Minus size={14} />} title="خط فاصل" onClick={() => insertBlock('\n---\n')} />
            </div>
          )}

          {/* Editor body */}
          {mode === 'write' ? (
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={onKeyDown}
              placeholder="اكتب بصيغة ماركداون… استخدم شريط الأدوات أعلاه"
              className="flex-1 min-h-48 bg-transparent resize-none outline-none p-5 text-sm leading-8"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          ) : (
            <div
              className="flex-1 min-h-48 md:overflow-y-auto p-5 md-body"
              onClick={onPreviewClick}
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="md-p" style="opacity:.5">لا يوجد محتوى للمعاينة</p>' }}
            />
          )}

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap px-5 py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Tag size={13} style={{ color: 'var(--color-text-muted)' }} />
            {(activeNote.tags ?? []).map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--color-text-secondary)' }}>
                {t}
                <button onClick={() => removeTag(t)} style={{ color: 'var(--color-text-muted)' }}><X size={11} /></button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              onBlur={addTag}
              placeholder="أضف وسماً…"
              className="bg-transparent text-xs outline-none flex-1 min-w-20"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Editor footer */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-xs flex items-center gap-3" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
              <span><span className="axis-num">{stats.words}</span> كلمة</span>
              <span><span className="axis-num">{stats.minutes}</span> دقيقة قراءة</span>
              <span>آخر تحديث: {formatDateAr(activeNote.updatedAt)}</span>
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: project.color }}
            >
              حفظ
            </button>
          </div>
        </div>
      ) : (
        <div className="md:col-span-2 axis-card flex items-center justify-center">
          <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">اختر ملاحظة من القائمة</p>
        </div>
      )}
    </div>
  )
}

function ToolBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
      style={{ color: 'var(--color-text-muted)' }}
      title={title}
    >
      {icon}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />
}
