'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ImagePlus, Trash2, ArrowRight, Check } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import type { Project, ProjectStatus } from '@/types'
import ProjectIcon, { PROJECT_ICON_KEYS, DEFAULT_PROJECT_ICON, resolveProjectIcon } from '@/lib/icons'
import { PROJECT_TYPES, getProjectType, DEFAULT_PROJECT_TYPE } from '@/lib/project-types'
import { getTool } from '@/lib/tool-registry'
import { runSmartSetup } from '@/lib/smart-setup'
import { hexToRgba } from '@/lib/utils'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'

interface ProjectFormProps {
  onClose: () => void
  /** If provided, called with the new project id after creation (skips navigation). */
  onSaved?: (id: string) => void
  initialData?: Project
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning',  label: 'تخطيط' },
  { value: 'active',    label: 'نشط' },
  { value: 'paused',    label: 'موقوف' },
  { value: 'completed', label: 'مكتمل' },
]

const COLOR_OPTIONS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
]

export default function ProjectForm({ onClose, onSaved, initialData }: ProjectFormProps) {
  const router = useRouter()
  const { addProject, updateProject } = useProjectStore()
  const isEditing = !!initialData

  // Create flow is a 2-step wizard (type → details). Edit jumps straight to details.
  const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1)
  const [typeId, setTypeId] = useState<string>(initialData?.type ?? DEFAULT_PROJECT_TYPE)

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    nameEn: initialData?.nameEn ?? '',
    description: initialData?.description ?? '',
    status: (initialData?.status ?? 'planning') as ProjectStatus,
    progress: initialData?.progress ?? 0,
    color: initialData?.color ?? '#6366F1',
    icon: initialData?.icon && PROJECT_ICON_KEYS.includes(initialData.icon) ? initialData.icon : DEFAULT_PROJECT_ICON,
    logo: initialData?.logo ?? '',
    cover: initialData?.cover ?? '',
    category: initialData?.category ?? '',
    tags: initialData?.tags?.join('، ') ?? '',
  })

  // Pick a type in step 1: prefill category + a matching icon, then advance.
  const chooseType = (id: string) => {
    setTypeId(id)
    const t = getProjectType(id)
    setForm((f) => ({
      ...f,
      category: f.category.trim() ? f.category : t.suggestedCategory,
      icon: PROJECT_ICON_KEYS.includes(t.icon) ? t.icon : f.icon,
    }))
    setStep(2)
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, [key]: reader.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    const data = {
      name: form.name.trim(),
      nameEn: form.nameEn.trim() || undefined,
      description: form.description.trim(),
      status: form.status,
      progress: Math.min(100, Math.max(0, form.progress)),
      color: form.color,
      icon: form.icon,
      logo: form.logo || undefined,
      cover: form.cover || undefined,
      category: form.category.trim(),
      type: typeId,
      tags: form.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      links: initialData?.links ?? [],
    }

    if (isEditing) {
      updateProject(initialData.id, data)
      onClose()
    } else {
      const tools = getProjectType(typeId).defaultToolIds.filter((t) => getTool(t))
      const newId = addProject({ ...data, type: typeId, tools })
      runSmartSetup(newId, typeId)
      if (onSaved) {
        onSaved(newId)
      } else {
        onClose()
        router.push(`/project?id=${newId}`)
      }
    }
  }

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
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            {!isEditing && step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="رجوع"
              >
                <ArrowRight size={15} data-flip-rtl />
              </button>
            )}
            <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>
              {isEditing ? 'تعديل المشروع' : step === 1 ? 'اختر نوع المشروع' : 'تفاصيل المشروع'}
            </h2>
          </div>
          <IconButton onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </IconButton>
        </div>

        {/* Step 1 — project type selection (create only) */}
        {!isEditing && step === 1 ? (
          <div className="p-5 space-y-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              يحدّد النوع الأدوات الافتراضية للمشروع، ويمكنك تعديلها لاحقاً من مكتبة الأدوات
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECT_TYPES.map((t) => {
                const active = typeId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => chooseType(t.id)}
                    className="text-start rounded-xl p-4 transition-colors hover:bg-white/5"
                    style={{
                      background: 'var(--color-surface-overlay)',
                      border: `1px solid ${active ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'color-mix(in oklch, var(--iris-500) 15%, transparent)', color: 'var(--iris-500)' }}
                      >
                        <ProjectIcon name={t.icon} size={18} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.defaultToolIds.map((id) => getTool(id)).filter(Boolean).map((tool) => (
                        <span key={tool!.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                          {tool!.label}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isEditing && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
            >
              <Check size={13} style={{ color: 'var(--iris-500)' }} />
              النوع: <span className="font-semibold">{getProjectType(typeId).label}</span>
              <button type="button" onClick={() => setStep(1)} className="ms-auto font-medium" style={{ color: 'var(--color-brand)' }}>تغيير</button>
            </div>
          )}
          <Field label="اسم المشروع" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

          <Field label="الاسم بالإنجليزية" value={form.nameEn} dir="ltr" onChange={(v) => setForm({ ...form, nameEn: v })} />

          {/* Description */}
          <div>
            <label className="axis-label block mb-1.5">الوصف</label>
            <textarea
              rows={3}
              placeholder="وصف مختصر للمشروع"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full text-sm p-3 outline-none resize-y"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--fg-1)',
              }}
            />
          </div>

          {/* Logo + banner */}
          <div>
            <label className="axis-label block mb-1.5">الشعار والبنر</label>
            {/* Cover */}
            <div
              className="relative overflow-hidden mb-3"
              style={{
                height: 96,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: form.cover ? undefined : `linear-gradient(135deg, ${hexToRgba(form.color, 0.5)}, ${hexToRgba(form.color, 0.12)})`,
              }}
            >
              {form.cover && <img src={form.cover} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <label className="axis-btn axis-btn--secondary axis-btn--sm cursor-pointer">
                  <ImagePlus size={13} />
                  {form.cover ? 'تغيير البنر' : 'رفع بنر'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e, 'cover')} />
                </label>
                {form.cover && (
                  <button type="button" className="axis-btn axis-btn--ghost axis-btn--sm" onClick={() => setForm({ ...form, cover: '' })} aria-label="إزالة البنر">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: hexToRgba(form.color, 0.15), color: form.color, borderRadius: 'var(--radius-md)' }}
              >
                {form.logo ? <img src={form.logo} alt="" className="w-full h-full object-cover" /> : <ProjectIcon name={form.icon} size={24} />}
              </div>
              <label className="axis-btn axis-btn--secondary axis-btn--sm cursor-pointer">
                <ImagePlus size={13} />
                {form.logo ? 'تغيير الشعار' : 'رفع شعار'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e, 'logo')} />
              </label>
              {form.logo && (
                <button type="button" className="axis-btn axis-btn--ghost axis-btn--sm" onClick={() => setForm({ ...form, logo: '' })}>
                  <Trash2 size={13} />
                  إزالة
                </button>
              )}
            </div>
          </div>

          {/* Status + Progress */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="الحالة" as="select" value={form.status} onChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={{ background: 'var(--surface-2)' }}>{o.label}</option>
              ))}
            </Field>
            <Field
              label="التقدم %"
              type="number"
              value={form.progress}
              min={0}
              max={100}
              onChange={(v) => setForm({ ...form, progress: Number(v) })}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="axis-label block mb-1.5">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_ICON_KEYS.map((key) => {
                const Icon = resolveProjectIcon(key)
                const active = form.icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, icon: key })}
                    className="w-9 h-9 flex items-center justify-center transition-colors"
                    style={{
                      background: active ? 'var(--iris-50)' : 'var(--surface-2)',
                      color: active ? 'var(--iris-600)' : 'var(--fg-2)',
                      border: `1px solid ${active ? 'var(--iris-400)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                    }}
                    aria-label={key}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="axis-label block mb-1.5">اللون</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className="w-8 h-8 transition-all"
                  style={{
                    background: color,
                    borderRadius: 'var(--radius-md)',
                    outline: form.color === color ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                    transform: form.color === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          {/* Type (edit only — create picks it in step 1) */}
          {isEditing && (
            <Field label="نوع المشروع" as="select" value={typeId} onChange={(v) => setTypeId(v)}>
              {PROJECT_TYPES.map((t) => (
                <option key={t.id} value={t.id} style={{ background: 'var(--surface-2)' }}>{t.label}</option>
              ))}
            </Field>
          )}

          {/* Category + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="الفئة" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field label="الوسوم (بفاصلة)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Button type="submit" variant="primary" size="lg" full>
              {isEditing ? 'حفظ التغييرات' : 'إنشاء المشروع'}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
