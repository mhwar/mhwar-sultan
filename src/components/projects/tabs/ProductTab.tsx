'use client'
import { useState } from 'react'
import {
  Check, ChevronDown, ChevronUp, ExternalLink,
  FileText, BookOpen, Palette, Search, File, FolderOpen,
  GitBranch, Link2, Layers, Map, Plus, Trash2, X,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePlanStore, useProjectStore, useDocumentStore } from '@/store/store'
import type { Project, PlanPhase, DocType } from '@/types'
import { domainForKind } from '@/lib/plan-kinds'
import PlanWorkspace from '@/components/projects/PlanWorkspace'
import SendToSprintMenu from '@/components/projects/SendToSprintMenu'
import Segmented from '@/components/ui/Segmented'

interface ProductTabProps {
  project: Project
  phases: PlanPhase[]
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  spec: 'مواصفات',
  guide: 'دليل',
  design: 'تصاميم',
  research: 'أبحاث',
  other: 'أخرى',
}

const DOC_ICONS: Record<DocType, React.ElementType> = {
  spec: FileText,
  guide: BookOpen,
  design: Palette,
  research: Search,
  other: File,
}

function detectLinkIcon(url: string): React.ElementType {
  const u = url.toLowerCase()
  if (u.includes('github.com') || u.includes('gitlab.com')) return GitBranch
  if (u.includes('figma.com')) return Palette
  return Link2
}

type FeatureFilter = 'all' | 'todo' | 'done'

export default function ProductTab({ project, phases }: ProductTabProps) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const { addDoc, deleteDoc, docs: allDocs } = useDocumentStore()
  const { toggleFeature } = usePlanStore()

  const productPlanIds = usePlanStore(useShallow((s) =>
    s.plans
      .filter((p) => p.projectId === project.id && (p.domain ?? domainForKind(p.kind)) === 'product')
      .map((p) => p.id)
  ))

  const projectDocs = allDocs
    .filter((d) => d.projectId === project.id)
    .sort((a, b) => a.order - b.order)

  // Brief
  const [desc, setDesc] = useState(project.description)
  const [tagInput, setTagInput] = useState('')

  // Links
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)

  // Docs
  const [addingDoc, setAddingDoc] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docType, setDocType] = useState<DocType>('spec')
  const [docDesc, setDocDesc] = useState('')
  const [docUrl, setDocUrl] = useState('')

  // Features filter
  const [featureFilter, setFeatureFilter] = useState<FeatureFilter>('all')

  // Roadmap collapse
  const [roadmapOpen, setRoadmapOpen] = useState(true)

  const links = project.links ?? []
  const tags = project.tags

  const featureRows = phases
    .filter((ph) => ph.planId && productPlanIds.includes(ph.planId))
    .flatMap((ph) => (ph.features ?? []).map((f) => ({ phase: ph, feature: f })))

  const filteredFeatures =
    featureFilter === 'all' ? featureRows
    : featureFilter === 'done' ? featureRows.filter((r) => r.feature.done)
    : featureRows.filter((r) => !r.feature.done)

  const doneCount = featureRows.filter((r) => r.feature.done).length

  function saveDesc() {
    if (desc !== project.description) updateProject(project.id, { description: desc })
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) { setTagInput(''); return }
    updateProject(project.id, { tags: [...tags, t] })
    setTagInput('')
  }

  function removeTag(tag: string) {
    updateProject(project.id, { tags: tags.filter((x) => x !== tag) })
  }

  function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return
    updateProject(project.id, { links: [...links, { label: linkLabel.trim(), url: linkUrl.trim() }] })
    setLinkLabel(''); setLinkUrl(''); setAddingLink(false)
  }

  function removeLink(idx: number) {
    updateProject(project.id, { links: links.filter((_, i) => i !== idx) })
  }

  function submitDoc() {
    if (!docTitle.trim()) return
    addDoc({
      projectId: project.id,
      title: docTitle.trim(),
      type: docType,
      description: docDesc.trim() || undefined,
      url: docUrl.trim() || undefined,
    })
    setDocTitle(''); setDocType('spec'); setDocDesc(''); setDocUrl('')
    setAddingDoc(false)
  }

  function cancelDoc() {
    setDocTitle(''); setDocType('spec'); setDocDesc(''); setDocUrl('')
    setAddingDoc(false)
  }

  return (
    <div className="space-y-5">

      {/* ── 1. الموجز ─────────────────────────────────────── */}
      <div className="axis-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={15} style={{ color: project.color }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>الموجز</h3>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={saveDesc}
          rows={3}
          placeholder="وصف المنتج، الرؤية، والأهداف الأساسية..."
          className="w-full text-sm resize-none rounded-lg px-3 py-2 mb-3 transition-colors"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--fg-1)',
            border: '1px solid var(--border-subtle)',
            outline: 'none',
          }}
        />
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--fg-2)' }}
            >
              {t}
              <button
                onClick={() => removeTag(t)}
                className="opacity-50 hover:opacity-100 transition-opacity ms-0.5"
                aria-label={`حذف ${t}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); addTag() }} className="flex items-center">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="+ تاق"
              className="text-xs px-2 py-1 rounded-full outline-none"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--fg-3)',
                border: '1px dashed var(--border-default)',
                width: tagInput ? 'auto' : 60,
                minWidth: 60,
              }}
            />
          </form>
        </div>
      </div>

      {/* ── 2. الروابط والموارد ────────────────────────────── */}
      <div className="axis-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={15} style={{ color: project.color }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>الروابط والموارد</h3>
          {links.length > 0 && (
            <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{links.length}</span>
          )}
        </div>

        {links.length > 0 && (
          <div className="space-y-0.5 mb-3">
            {links.map((lk, idx) => {
              const Icon = detectLinkIcon(lk.url)
              return (
                <div key={idx} className="flex items-center gap-2.5 group py-1.5">
                  <Icon size={14} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
                  <a
                    href={lk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm flex-1 truncate hover:underline"
                    style={{ color: 'var(--fg-2)' }}
                  >
                    {lk.label}
                  </a>
                  <span
                    className="text-xs truncate hidden md:block"
                    style={{ color: 'var(--fg-4)', maxWidth: 200 }}
                    dir="ltr"
                  >
                    {lk.url}
                  </span>
                  <ExternalLink size={12} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
                  <button
                    onClick={() => removeLink(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="حذف الرابط"
                  >
                    <Trash2 size={13} style={{ color: 'var(--danger-500)' }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {addingLink ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="الاسم"
              className="text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{ flex: '1 1 80px', minWidth: 80, background: 'var(--surface-2)', color: 'var(--fg-1)', border: '1px solid var(--border-default)' }}
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{ flex: '2 1 160px', minWidth: 160, background: 'var(--surface-2)', color: 'var(--fg-1)', border: '1px solid var(--border-default)' }}
              onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
            />
            <button
              onClick={addLink}
              className="text-sm px-3 py-1.5 rounded-lg font-medium"
              style={{ background: project.color, color: 'white' }}
            >
              إضافة
            </button>
            <button
              onClick={() => { setAddingLink(false); setLinkLabel(''); setLinkUrl('') }}
              className="text-sm px-2 py-1.5 rounded-lg"
              style={{ color: 'var(--fg-3)' }}
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingLink(true)}
            className="flex items-center gap-1.5 text-sm py-1 transition-colors"
            style={{ color: 'var(--fg-4)' }}
          >
            <Plus size={14} /> إضافة رابط
          </button>
        )}
      </div>

      {/* ── 3. المستندات ──────────────────────────────────── */}
      <div className="axis-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={15} style={{ color: project.color }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>المستندات</h3>
          {projectDocs.length > 0 && (
            <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{projectDocs.length}</span>
          )}
        </div>

        {projectDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {projectDocs.map((doc) => {
              const Icon = DOC_ICONS[doc.type]
              return (
                <div
                  key={doc.id}
                  className="group flex items-start gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${project.color}1a` }}
                  >
                    <Icon size={16} style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>
                        {doc.title}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: 'var(--surface-1)', color: 'var(--fg-3)', fontSize: 10 }}
                      >
                        {DOC_TYPE_LABELS[doc.type]}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--fg-3)' }}>
                        {doc.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="axis-iconbtn axis-iconbtn--ghost axis-iconbtn--sm"
                        aria-label="فتح الرابط"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="axis-iconbtn axis-iconbtn--ghost axis-iconbtn--sm"
                      style={{ color: 'var(--danger-500)' }}
                      aria-label="حذف الوثيقة"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {addingDoc ? (
          <div
            className="space-y-2.5 p-3 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}
          >
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="عنوان الوثيقة *"
              autoFocus
              className="w-full text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{ background: 'var(--surface-1)', color: 'var(--fg-1)', border: '1px solid var(--border-subtle)' }}
            />
            <div className="flex gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="text-sm px-2 py-1.5 rounded-lg outline-none"
                style={{ flex: '1 1 auto', background: 'var(--surface-1)', color: 'var(--fg-2)', border: '1px solid var(--border-subtle)' }}
              >
                {(Object.entries(DOC_TYPE_LABELS) as [DocType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="رابط (اختياري)"
                dir="ltr"
                className="text-sm px-3 py-1.5 rounded-lg outline-none"
                style={{ flex: '2 1 auto', background: 'var(--surface-1)', color: 'var(--fg-1)', border: '1px solid var(--border-subtle)' }}
              />
            </div>
            <textarea
              value={docDesc}
              onChange={(e) => setDocDesc(e.target.value)}
              placeholder="وصف مختصر (اختياري)"
              rows={2}
              className="w-full text-sm px-3 py-1.5 rounded-lg resize-none outline-none"
              style={{ background: 'var(--surface-1)', color: 'var(--fg-1)', border: '1px solid var(--border-subtle)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={submitDoc}
                className="text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{ background: project.color, color: 'white' }}
              >
                إضافة
              </button>
              <button
                onClick={cancelDoc}
                className="text-sm px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--fg-3)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingDoc(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--fg-4)', border: '1px dashed var(--border-default)' }}
          >
            <Plus size={14} /> إضافة وثيقة
          </button>
        )}
      </div>

      {/* ── 4. المميزات ────────────────────────────────────── */}
      {featureRows.length > 0 && (
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Layers size={15} style={{ color: project.color }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>المميزات</h3>
            <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>
              {doneCount}/{featureRows.length}
            </span>
            <div className="ms-auto">
              <Segmented<FeatureFilter>
                value={featureFilter}
                onChange={setFeatureFilter}
                options={[
                  { value: 'all', label: 'الكل' },
                  { value: 'todo', label: 'قيد العمل' },
                  { value: 'done', label: 'منجز' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            {filteredFeatures.map(({ phase, feature }) => (
              <div key={feature.id} className="flex items-center gap-2.5 group">
                <button
                  onClick={() => toggleFeature(phase.id, feature.id)}
                  className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: feature.done ? project.color : 'transparent',
                    borderColor: feature.done ? project.color : 'var(--border-default)',
                  }}
                >
                  {feature.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                </button>
                <span
                  className="text-sm flex-1 truncate"
                  style={{
                    color: feature.done ? 'var(--fg-3)' : 'var(--fg-2)',
                    textDecoration: feature.done ? 'line-through' : 'none',
                  }}
                >
                  {feature.title}
                </span>
                <span className="text-xs truncate shrink-0" style={{ color: 'var(--fg-4)', maxWidth: 140 }}>
                  {phase.title}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <SendToSprintMenu projectId={project.id} title={feature.title} done={feature.done} />
                </div>
              </div>
            ))}
            {filteredFeatures.length === 0 && (
              <p className="text-sm py-3 text-center" style={{ color: 'var(--fg-4)' }}>
                {featureFilter === 'done' ? 'لا مميزات منجزة بعد' : 'لا مميزات قيد العمل'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 5. خارطة الطريق ───────────────────────────────── */}
      <div className="axis-card overflow-hidden">
        <button
          onClick={() => setRoadmapOpen((o) => !o)}
          className="flex items-center gap-2 w-full px-4 py-3 text-start transition-colors"
          style={{ borderBottom: roadmapOpen ? '1px solid var(--border-subtle)' : 'none' }}
        >
          <Map size={15} style={{ color: project.color }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>خارطة الطريق</span>
          <div className="ms-auto">
            {roadmapOpen
              ? <ChevronUp size={15} style={{ color: 'var(--fg-3)' }} />
              : <ChevronDown size={15} style={{ color: 'var(--fg-3)' }} />}
          </div>
        </button>
        {roadmapOpen && (
          <div className="p-4">
            <PlanWorkspace
              project={project}
              phases={phases}
              domain="product"
              emptyTitle="لا توجد خطة منتج بعد"
              emptyDescription="ابدأ بخارطة طريق أو خطة منتج لتنظيم المراحل والمميزات"
            />
          </div>
        )}
      </div>
    </div>
  )
}
