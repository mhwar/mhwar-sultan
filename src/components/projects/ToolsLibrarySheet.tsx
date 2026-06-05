'use client'
import { X, Plus, ChevronUp, ChevronDown, Minus, Lock } from 'lucide-react'
import type { Project } from '@/types'
import { useProjectStore } from '@/store/store'
import { TOOLS, getTool, isCoreTool } from '@/lib/tool-registry'
import { FALLBACK_TOOL_IDS } from '@/lib/project-types'
import IconButton from '@/components/ui/IconButton'

interface Props {
  project: Project
  onClose: () => void
}

export default function ToolsLibrarySheet({ project, onClose }: Props) {
  const updateProject = useProjectStore((s) => s.updateProject)

  const enabled = (project.tools?.length ? project.tools : FALLBACK_TOOL_IDS).filter((t) => getTool(t))
  const setTools = (tools: string[]) => updateProject(project.id, { tools })

  const addTool = (id: string) => { if (!enabled.includes(id)) setTools([...enabled, id]) }
  const removeTool = (id: string) => { if (!isCoreTool(id)) setTools(enabled.filter((t) => t !== id)) }
  const move = (id: string, dir: -1 | 1) => {
    const i = enabled.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= enabled.length) return
    const next = [...enabled]
    ;[next[i], next[j]] = [next[j], next[i]]
    setTools(next)
  }

  // Available = every registry tool not already enabled. We don't hard-filter by
  // type: a non-technical project can still pull in «المنتج»/«النمو» when needed —
  // type only governs which tools are enabled by default at creation.
  const available = TOOLS.filter((t) => !enabled.includes(t.id))

  // Group available tools by their `group` label.
  const groups = available.reduce<Record<string, typeof available>>((acc, t) => {
    const g = t.group ?? 'أخرى'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>مكتبة الأدوات</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>أضف الأدوات التي يحتاجها مشروعك ورتّبها</p>
          </div>
          <IconButton onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </IconButton>
        </div>

        <div className="p-5 space-y-6">
          {/* Enabled tools */}
          <div>
            <h3 className="axis-label mb-2">الأدوات المفعّلة</h3>
            <div className="space-y-2">
              {enabled.map((id, i) => {
                const tool = getTool(id)!
                const Icon = tool.icon
                const core = isCoreTool(id)
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{tool.label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{tool.description}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => move(id, -1)}
                        disabled={i === 0}
                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-white/5"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label="لأعلى"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => move(id, 1)}
                        disabled={i === enabled.length - 1}
                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-white/5"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label="لأسفل"
                      >
                        <ChevronDown size={14} />
                      </button>
                      {core ? (
                        <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }} title="أداة أساسية">
                          <Lock size={13} />
                        </span>
                      ) : (
                        <button
                          onClick={() => removeTool(id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--danger-500)' }}
                          aria-label="إزالة"
                        >
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Available tools */}
          {available.length > 0 && (
            <div>
              <h3 className="axis-label mb-2">إضافة أدوات</h3>
              <div className="space-y-4">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>{group}</p>
                    <div className="space-y-2">
                      {items.map((tool) => {
                        const Icon = tool.icon
                        return (
                          <button
                            key={tool.id}
                            onClick={() => addTool(tool.id)}
                            className="w-full flex items-center gap-3 rounded-xl p-3 text-start transition-colors hover:bg-white/5"
                            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
                          >
                            <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{tool.label}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{tool.description}</p>
                            </div>
                            <span
                              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                              style={{ background: 'var(--iris-500)', color: 'white' }}
                            >
                              <Plus size={14} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
