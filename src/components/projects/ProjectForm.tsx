'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import type { Project, ProjectStatus } from '@/types'

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

const ICON_OPTIONS = ['⬡', '🚀', '💡', '🔧', '📱', '🌐', '🗂️', '⚡', '🏷️', '🧭', '🎯', '🔮']

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
    icon: initialData?.icon ?? '🚀',
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

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
    padding: '0.625rem 0.875rem',
    width: '100%',
    outline: 'none',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up"
        style={{ background: 'rgba(14, 14, 24, 0.98)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEditing ? 'تعديل المشروع' : 'مشروع جديد'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              اسم المشروع *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: محور"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Name EN */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              الاسم بالإنجليزية
            </label>
            <input
              type="text"
              placeholder="Mehwar"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              style={{ ...inputStyle, direction: 'ltr' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              الوصف
            </label>
            <textarea
              rows={3}
              placeholder="وصف مختصر للمشروع..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Status + Progress row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                الحالة
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: '#0F0F1A' }}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                التقدم ({form.progress}%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              الأيقونة
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className="w-9 h-9 rounded-xl text-lg transition-all"
                  style={{
                    background: form.icon === icon ? 'var(--color-brand-subtle)' : 'rgba(255,255,255,0.04)',
                    border: form.icon === icon ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              اللون
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{
                    background: color,
                    outline: form.color === color ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                    transform: form.color === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Category + Tags row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                الفئة
              </label>
              <input
                type="text"
                placeholder="منصة، تطبيق..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                الوسوم (مفصولة بفاصلة)
              </label>
              <input
                type="text"
                placeholder="React، TypeScript..."
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex gap-3 pt-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-brand)' }}
            >
              {isEditing ? 'حفظ التغييرات' : 'إنشاء المشروع'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
