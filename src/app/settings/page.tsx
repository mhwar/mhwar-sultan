'use client'
import { Download, RefreshCw, Info, Shield, Palette } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { useProjectStore, useTaskStore } from '@/store/store'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'
import PermissionsSection from '@/components/settings/PermissionsSection'

function SectionHeader({ icon, title, tint }: { icon: React.ReactNode; title: string; tint: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
      >
        {icon}
      </div>
      <h2 className="text-sm font-bold" style={{ color: 'var(--fg-1)' }}>{title}</h2>
    </div>
  )
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={last ? undefined : { borderBottom: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { projects } = useProjectStore()
  const { tasks } = useTaskStore()
  const { theme, toggle } = useThemeStore()

  const exportData = () => {
    const data = { projects, tasks, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mhwar-backup-${new Date().toISOString().slice(0, 10)}.json`
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

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl animate-fade-up space-y-4">
        <PageHeader title="الإعدادات" sub="إعدادات المنصة والبيانات" />

        {/* Permissions */}
        <PermissionsSection />

        {/* Appearance */}
        <div className="axis-card p-6">
          <SectionHeader icon={<Palette size={15} strokeWidth={1.5} />} title="المظهر" tint="var(--iris-500)" />
          <Row last>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>الوضع الفاتح</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>التبديل بين الثيم الداكن والفاتح</p>
            </div>
            <button
              className={cn('axis-switch', theme === 'light' && 'is-on')}
              onClick={toggle}
              aria-label="تبديل الثيم"
            />
          </Row>
        </div>

        {/* Data */}
        <div className="axis-card p-6">
          <SectionHeader icon={<Download size={15} strokeWidth={1.5} />} title="البيانات" tint="var(--iris-500)" />
          <Row>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>تصدير البيانات</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>تنزيل نسخة احتياطية من مشاريعك ومهامك</p>
            </div>
            <Button variant="iris-soft" size="sm" onClick={exportData}><Download size={13} />تصدير JSON</Button>
          </Row>
          <Row last>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>إعادة تعيين البيانات</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>حذف جميع البيانات والعودة للمشاريع الافتراضية</p>
            </div>
            <Button variant="danger" size="sm" onClick={resetData}><RefreshCw size={13} />إعادة تعيين</Button>
          </Row>
        </div>

        {/* Storage stats */}
        <div className="axis-card p-6">
          <SectionHeader icon={<Shield size={15} strokeWidth={1.5} />} title="إحصائيات التخزين" tint="var(--success-500)" />
          {[
            { label: 'إجمالي المشاريع', value: String(projects.length) },
            { label: 'إجمالي المهام', value: String(tasks.length) },
            { label: 'مكان التخزين', value: 'المتصفح (localStorage)' },
          ].map((row, i, arr) => (
            <Row key={row.label} last={i === arr.length - 1}>
              <span className="text-sm" style={{ color: 'var(--fg-2)' }}>{row.label}</span>
              <span className="axis-num text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{row.value}</span>
            </Row>
          ))}
        </div>

        {/* About */}
        <div className="axis-card p-6">
          <SectionHeader icon={<Info size={15} strokeWidth={1.5} />} title="عن المنصة" tint="var(--info-500)" />
          {[
            { label: 'الإصدار', value: '1.0.0' },
            { label: 'إطار العمل', value: 'Next.js 16' },
            { label: 'واجهة المستخدم', value: 'Tailwind CSS v4' },
            { label: 'إدارة الحالة', value: 'Zustand' },
          ].map((row, i, arr) => (
            <Row key={row.label} last={i === arr.length - 1}>
              <span className="text-sm" style={{ color: 'var(--fg-2)' }}>{row.label}</span>
              <Tag variant="neutral">{row.value}</Tag>
            </Row>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
