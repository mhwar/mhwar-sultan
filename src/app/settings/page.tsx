'use client'
import { useState } from 'react'
import { Download, RefreshCw, Info, Shield } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useProjectStore, useTaskStore, usePlanStore, useNoteStore } from '@/store/store'
import { SEED_PROJECTS, SEED_TASKS, SEED_PHASES, SEED_NOTES } from '@/lib/seed-data'

export default function SettingsPage() {
  const { projects } = useProjectStore()
  const { tasks } = useTaskStore()
  const [resetDone, setResetDone] = useState(false)

  const exportData = () => {
    const data = {
      projects,
      tasks,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mhwar-backup-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetData = () => {
    if (!confirm('هل تريد إعادة تعيين جميع البيانات للحالة الافتراضية؟ لا يمكن التراجع عن هذا.')) return
    localStorage.removeItem('mhwar-projects')
    localStorage.removeItem('mhwar-tasks')
    localStorage.removeItem('mhwar-plans')
    localStorage.removeItem('mhwar-notes')
    window.location.reload()
  }

  const sectionStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.875rem',
    paddingBottom: '0.875rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }

  const btnBase = {
    padding: '0.5rem 1rem',
    borderRadius: '0.625rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: `opacity var(--axis-duration-micro) cubic-bezier(0.2, 0.8, 0.2, 1)`,
    border: 'none',
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl animate-fade-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            الإعدادات
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            إعدادات المنصة والبيانات
          </p>
        </div>

        {/* Data section */}
        <div style={sectionStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-brand-subtle)' }}
            >
              <Download size={15} style={{ color: 'var(--color-brand-light)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              البيانات
            </h2>
          </div>

          <div style={rowStyle}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                تصدير البيانات
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                تنزيل نسخة احتياطية من مشاريعك ومهامك
              </p>
            </div>
            <button
              onClick={exportData}
              style={{
                ...btnBase,
                background: 'var(--color-brand-subtle)',
                color: 'var(--color-brand-light)',
              } as React.CSSProperties}
            >
              <Download size={13} />
              تصدير JSON
            </button>
          </div>

          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                إعادة تعيين البيانات
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                حذف جميع البيانات والعودة للمشاريع الافتراضية
              </p>
            </div>
            <button
              onClick={resetData}
              style={{
                ...btnBase,
                background: 'rgba(239,68,68,0.1)',
                color: '#EF4444',
              } as React.CSSProperties}
            >
              <RefreshCw size={13} />
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Stats section */}
        <div style={sectionStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-status-active) 15%, transparent)' }}
            >
              <Shield size={15} style={{ color: 'var(--color-status-active)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              إحصائيات التخزين
            </h2>
          </div>

          {[
            { label: 'إجمالي المشاريع', value: projects.length },
            { label: 'إجمالي المهام', value: tasks.length },
            { label: 'مكان التخزين', value: 'المتصفح (localStorage)' },
          ].map((row) => (
            <div key={row.label} style={rowStyle}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {row.label}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* About section */}
        <div style={sectionStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-brand-subtle)' }}
            >
              <Info size={15} style={{ color: 'var(--color-brand-light)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              عن المنصة
            </h2>
          </div>

          {[
            { label: 'الإصدار', value: '1.0.0' },
            { label: 'إطار العمل', value: 'Next.js 16' },
            { label: 'واجهة المستخدم', value: 'Tailwind CSS v4' },
            { label: 'إدارة الحالة', value: 'Zustand' },
          ].map((row) => (
            <div key={row.label} style={{ ...rowStyle }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {row.label}
              </span>
              <span
                className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
