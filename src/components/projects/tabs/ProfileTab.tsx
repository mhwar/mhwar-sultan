'use client'
/**
 * ProfileTab — الملف التعريفي للمنتج.
 *
 * Structured, investor-facing profile filled section by section and exported
 * as a branded 16:9 PPTX deck (see src/lib/profile-pptx.ts). One profile per
 * project, stored in useProfileStore and synced to D1 like every resource.
 */
import { useState } from 'react'
import {
  FileText, AlertCircle, Lightbulb, Layers, Target, Sparkles,
  Briefcase, Users2, Mail, Quote, Megaphone, Download, Plus, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useProfileStore } from '@/store/store'
import type { Project, ProductProfile, ProfileSubProduct } from '@/types'
import Button from '@/components/ui/Button'

const INPUT_STYLE = {
  background: 'var(--color-surface-muted)',
  border: '1px solid var(--color-surface-border)',
  color: 'var(--color-text-primary)',
} as const

interface ProfileTabProps {
  project: Project
}

// ── Section definitions ───────────────────────────────────

type TextField = 'tagline' | 'overview' | 'problem' | 'solution' | 'market' | 'businessModel' | 'team' | 'contact'
type ListField = 'goals' | 'advantages'

interface TextSectionDef {
  field: TextField
  title: string
  hint: string
  icon: LucideIcon
  rows: number
}

const TEXT_SECTIONS: TextSectionDef[] = [
  { field: 'tagline',       title: 'الجملة التعريفية', hint: 'سطر واحد يلخّص المنتج — يظهر على غلاف العرض', icon: Quote, rows: 1 },
  { field: 'overview',      title: 'نبذة عامة', hint: 'ما هو المنتج؟ ماذا يقدّم ولمن؟', icon: FileText, rows: 4 },
  { field: 'problem',       title: 'المشكلة', hint: 'ما المشكلة التي يعالجها المنتج في السوق؟', icon: AlertCircle, rows: 4 },
  { field: 'solution',      title: 'الحل', hint: 'كيف يحل المنتج هذه المشكلة بشكل مختلف؟', icon: Lightbulb, rows: 4 },
  { field: 'market',        title: 'الجمهور المستهدف والسوق', hint: 'من العملاء؟ ما حجم السوق وفرص النمو؟', icon: Megaphone, rows: 4 },
  { field: 'businessModel', title: 'نموذج العمل', hint: 'كيف يحقق المنتج الإيرادات؟ خطط الأسعار والقنوات', icon: Briefcase, rows: 4 },
  { field: 'team',          title: 'الفريق', hint: 'من يقف خلف المنتج؟ الأدوار والخبرات الأساسية', icon: Users2, rows: 3 },
  { field: 'contact',       title: 'معلومات التواصل', hint: 'بريد، موقع، أرقام — تظهر في الشريحة الختامية', icon: Mail, rows: 2 },
]

interface ListSectionDef {
  field: ListField
  title: string
  hint: string
  icon: LucideIcon
  placeholder: string
}

const LIST_SECTIONS: ListSectionDef[] = [
  { field: 'goals',      title: 'الأهداف', hint: 'أهداف المنتج والمشروع المرحلية والاستراتيجية', icon: Target, placeholder: 'أضف هدفاً...' },
  { field: 'advantages', title: 'المزايا التنافسية', hint: 'ما الذي يميز المنتج عن البدائل الموجودة؟', icon: Sparkles, placeholder: 'أضف ميزة...' },
]

// Sections counted in the completion meter (tagline + 7 text + 2 lists + sub-products)
const COMPLETION_TOTAL = TEXT_SECTIONS.length + LIST_SECTIONS.length + 1

function completedCount(p: ProductProfile | undefined): number {
  if (!p) return 0
  let n = 0
  for (const s of TEXT_SECTIONS) if (p[s.field].trim()) n++
  for (const s of LIST_SECTIONS) if (p[s.field].some((x) => x.trim())) n++
  if (p.subProducts.some((sp) => sp.name.trim())) n++
  return n
}

// ── Component ─────────────────────────────────────────────

export default function ProfileTab({ project }: ProfileTabProps) {
  const profile = useProfileStore((s) => s.profiles.find((p) => p.projectId === project.id))
  const upsertProfile = useProfileStore((s) => s.upsertProfile)

  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState('')

  const done = completedCount(profile)
  const pct = Math.round((done / COMPLETION_TOTAL) * 100)

  async function handleExport() {
    if (!profile || done === 0) return
    setExporting(true)
    setExportErr('')
    try {
      const { exportProfilePptx } = await import('@/lib/profile-pptx')
      await exportProfilePptx(project, profile)
    } catch {
      setExportErr('تعذّر إنشاء ملف العرض — أعد المحاولة')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Header: completion + export */}
      <div className="axis-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold" style={{ color: 'var(--fg-1)' }}>
              الملف التعريفي
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>
              عبّئ الأقسام التالية ثم صدّرها كعرض تقديمي بمقاس 16:9 جاهز للمستثمرين والشركاء
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-end">
              <div className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
                {done} من {COMPLETION_TOTAL} أقسام
              </div>
              <div
                className="mt-1 h-1.5 w-32 rounded-full overflow-hidden"
                style={{ background: 'var(--color-surface-base)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: project.color }}
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={exporting || done === 0}
            >
              <Download size={14} strokeWidth={1.5} />
              {exporting ? 'جارٍ التصدير...' : 'تصدير عرض تقديمي'}
            </Button>
          </div>
        </div>
        {exportErr && (
          <p className="text-xs mt-3" style={{ color: 'var(--danger-500)' }}>{exportErr}</p>
        )}
      </div>

      {/* Text sections */}
      {TEXT_SECTIONS.map((section) => (
        <TextSectionCard
          key={`${section.field}-${profile?.id ?? 'new'}`}
          def={section}
          value={profile?.[section.field] ?? ''}
          onSave={(v) => upsertProfile(project.id, { [section.field]: v })}
        />
      ))}

      {/* Sub-products */}
      <SubProductsCard
        projectId={project.id}
        items={profile?.subProducts ?? []}
        onChange={(subProducts) => upsertProfile(project.id, { subProducts })}
      />

      {/* List sections */}
      {LIST_SECTIONS.map((section) => (
        <ListSectionCard
          key={section.field}
          def={section}
          items={profile?.[section.field] ?? []}
          onChange={(items) => upsertProfile(project.id, { [section.field]: items })}
        />
      ))}
    </div>
  )
}

// ── Section cards ─────────────────────────────────────────

function SectionShell({
  icon: Icon, title, hint, filled, children,
}: {
  icon: LucideIcon
  title: string
  hint: string
  filled: boolean
  children: React.ReactNode
}) {
  return (
    <div className="axis-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} strokeWidth={1.5} style={{ color: filled ? 'var(--iris-500)' : 'var(--fg-3)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{title}</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--fg-3)' }}>{hint}</p>
      {children}
    </div>
  )
}

function TextSectionCard({
  def, value, onSave,
}: {
  def: TextSectionDef
  value: string
  onSave: (v: string) => void
}) {
  return (
    <SectionShell icon={def.icon} title={def.title} hint={def.hint} filled={!!value.trim()}>
      <textarea
        defaultValue={value}
        rows={def.rows}
        dir="rtl"
        className="w-full rounded-md px-3 py-2 text-sm leading-relaxed outline-none resize-y" style={{ ...INPUT_STYLE, minHeight: def.rows === 1 ? undefined : '5rem' }}
        onBlur={(e) => {
          const next = e.target.value
          if (next !== value) onSave(next)
        }}
      />
    </SectionShell>
  )
}

function ListSectionCard({
  def, items, onChange,
}: {
  def: ListSectionDef
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }

  return (
    <SectionShell icon={def.icon} title={def.title} hint={def.hint} filled={items.some((x) => x.trim())}>
      {items.length > 0 && (
        <ul className="space-y-2 mb-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--iris-500)' }}
              />
              <input
                defaultValue={item}
                dir="rtl"
                className="flex-1 rounded-md px-3 py-2 text-sm outline-none" style={INPUT_STYLE}
                onBlur={(e) => {
                  const next = e.target.value.trim()
                  if (next === item) return
                  onChange(
                    next
                      ? items.map((x, j) => (j === i ? next : x))
                      : items.filter((_, j) => j !== i)
                  )
                }}
              />
              <button
                type="button"
                className="axis-iconbtn axis-iconbtn--sm"
                aria-label="حذف"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          dir="rtl"
          placeholder={def.placeholder}
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none" style={INPUT_STYLE}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <Button variant="secondary" size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus size={14} strokeWidth={1.5} />
          إضافة
        </Button>
      </div>
    </SectionShell>
  )
}

function SubProductsCard({
  projectId, items, onChange,
}: {
  projectId: string
  items: ProfileSubProduct[]
  onChange: (items: ProfileSubProduct[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  function add() {
    const n = name.trim()
    if (!n) return
    onChange([
      ...items,
      { id: `${projectId}-sub-${Date.now()}`, name: n, description: desc.trim() },
    ])
    setName(''); setDesc(''); setAdding(false)
  }

  return (
    <SectionShell
      icon={Layers}
      title="المنتجات والخدمات"
      hint="المنتجات المتفرعة والخدمات التي يقدمها المشروع — تظهر كبطاقات في العرض"
      filled={items.some((sp) => sp.name.trim())}
    >
      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          {items.map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg p-4 space-y-2"
              style={{ background: 'var(--color-surface-base)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  defaultValue={sub.name}
                  dir="rtl"
                  className="flex-1 rounded-md px-3 py-2 text-sm font-medium outline-none" style={INPUT_STYLE}
                  onBlur={(e) => {
                    const next = e.target.value.trim()
                    if (next && next !== sub.name) {
                      onChange(items.map((x) => (x.id === sub.id ? { ...x, name: next } : x)))
                    }
                  }}
                />
                <button
                  type="button"
                  className="axis-iconbtn axis-iconbtn--sm"
                  aria-label="حذف"
                  onClick={() => onChange(items.filter((x) => x.id !== sub.id))}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
              <textarea
                defaultValue={sub.description}
                rows={2}
                dir="rtl"
                placeholder="وصف مختصر..."
                className="w-full rounded-md px-3 py-2 text-xs leading-relaxed outline-none resize-y" style={INPUT_STYLE}
                onBlur={(e) => {
                  const next = e.target.value
                  if (next !== sub.description) {
                    onChange(items.map((x) => (x.id === sub.id ? { ...x, description: next } : x)))
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-2">
          <input
            value={name}
            dir="rtl"
            placeholder="اسم المنتج أو الخدمة"
            className="w-full rounded-md px-3 py-2 text-sm outline-none" style={INPUT_STYLE}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <textarea
            value={desc}
            rows={2}
            dir="rtl"
            placeholder="وصف مختصر (اختياري)"
            className="w-full rounded-md px-3 py-2 text-sm outline-none resize-y" style={INPUT_STYLE}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={add} disabled={!name.trim()}>إضافة</Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setName(''); setDesc('') }}>إلغاء</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} />
          إضافة منتج
        </Button>
      )}
    </SectionShell>
  )
}
