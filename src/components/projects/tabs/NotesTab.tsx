'use client'
import { useState, useCallback } from 'react'
import { Plus, Pin, Trash2, FileText } from 'lucide-react'
import { useNoteStore } from '@/store/store'
import type { Project, Note } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { formatDateAr } from '@/lib/utils'

interface NotesTabProps {
  project: Project
  notes: Note[]
}

export default function NotesTab({ project, notes }: NotesTabProps) {
  const { addNote, updateNote, deleteNote } = useNoteStore()
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null)
  const activeNote = notes.find((n) => n.id === activeId)
  const [localContent, setLocalContent] = useState(activeNote?.content ?? '')
  const [localTitle, setLocalTitle] = useState(activeNote?.title ?? '')

  const selectNote = (note: Note) => {
    setActiveId(note.id)
    setLocalContent(note.content)
    setLocalTitle(note.title)
  }

  const handleSave = useCallback(() => {
    if (!activeId) return
    updateNote(activeId, { title: localTitle, content: localContent })
  }, [activeId, localTitle, localContent, updateNote])

  const handleNewNote = () => {
    addNote({
      projectId: project.id,
      title: 'ملاحظة جديدة',
      content: '',
      pinned: false,
    })
    setTimeout(() => {
      const allNotes = useNoteStore.getState().getProjectNotes(project.id)
      const newest = allNotes[0]
      if (newest) selectNote(newest)
    }, 0)
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="لا توجد ملاحظات بعد"
        description="أضف أفكارك وملاحظاتك لهذا المشروع"
        action={
          <button
            onClick={handleNewNote}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: project.color }}
          >
            ملاحظة جديدة
          </button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:h-[calc(100vh-18rem)]">
      {/* Notes list — 1/3 */}
      <div className="md:col-span-1 flex flex-col gap-2 md:overflow-y-auto pe-1">
        <button
          onClick={handleNewNote}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: `${project.color}15`,
            color: project.color,
            border: `1px dashed ${project.color}40`,
          }}
        >
          <Plus size={15} />
          ملاحظة جديدة
        </button>

        {notes.map((note) => (
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
                  {note.pinned && (
                    <Pin size={10} style={{ color: project.color }} />
                  )}
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: activeId === note.id ? project.color : 'var(--color-text-primary)' }}
                  >
                    {note.title}
                  </p>
                </div>
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {note.content || 'فارغة...'}
                </p>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
              {formatDateAr(note.updatedAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Note editor — 2/3 */}
      {activeNote ? (
        <div className="md:col-span-2 axis-card flex flex-col min-h-64 md:overflow-hidden">
          {/* Editor header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleSave}
              className="bg-transparent text-base font-bold outline-none flex-1"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <div className="flex items-center gap-1">
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
                  if (remaining.length > 0) {
                    selectNote(remaining[0])
                  } else {
                    setActiveId(null)
                  }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--color-text-muted)' }}
                title="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editor body */}
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleSave}
            placeholder="اكتب ملاحظاتك هنا..."
            className="flex-1 min-h-48 bg-transparent resize-none outline-none p-5 text-sm leading-8"
            style={{ color: 'var(--color-text-secondary)' }}
          />

          {/* Editor footer */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
              آخر تحديث: {formatDateAr(activeNote.updatedAt)}
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
          <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
            اختر ملاحظة من القائمة
          </p>
        </div>
      )}
    </div>
  )
}
