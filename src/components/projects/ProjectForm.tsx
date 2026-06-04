'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import type { Project, ProjectStatus } from '@/types'
import { PROJECT_ICON_KEYS, DEFAULT_PROJECT_ICON, resolveProjectIcon } from '@/lib/icons'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'

interface ProjectFormProps {
  onClose: () => void
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

export default function ProjectForm({ onClose, initialData }: ProjectFormProps) {
  const { addProject, updateProject } = useProjectStore()
  const isEditing = !!initialData

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    nameEn: initialData?.nameEn ?? '',
    description: initialData?.description ?? '',
    status: (initialData?.status ?? 'planning') as ProjectStatus,
    progress: initialData?.progress ?? 0,
    color: initialData?.color ?? '#6366F1',
    icon: initialData?.icon && PROJECT_ICON_KEYS.includes(initialData.icon) ? initialData.icon : DEFAULT_PROJECT_ICON,
    category: initialData?.category ?? '',
    tags: initialData?.tags?.join('، ') ?? '',
  })

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
      category: form.category.trim(),
      tags: form.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      links: initialData?.links ?? [],
    }

    if (isEditing) {
      updateProject(initialData.id, data)
    } else {
      addProject(data)
    }
    onClose()
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
          <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>
            {isEditing ? 'تعديل المشروع' : 'مشروع جديد'}
          </h2>
          <IconButton onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
      </div>
    </div>
  )
}
