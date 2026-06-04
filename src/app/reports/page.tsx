'use client'
import { Download, CheckSquare, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import MetricCard from '@/components/reports/MetricCard'
import Donut from '@/components/reports/Donut'
import Button from '@/components/ui/Button'
import { useProjectStore, useTaskStore, useNoteStore, computeStats } from '@/store/store'
import { monthBuckets, cumulative, trendDelta, statusDistribution, recentActivity } from '@/lib/reports'
import { timeAgoAr } from '@/lib/utils'

export default function ReportsPage() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)
  const notes = useNoteStore((s) => s.notes)

  const stats = computeStats(projects, tasks)
  const createdSeries = monthBuckets(tasks.map((t) => t.createdAt), 6)
  const doneSeries = monthBuckets(tasks.filter((t) => t.status === 'done').map((t) => t.createdAt), 6)
  const projectSeries = monthBuckets(projects.map((p) => p.createdAt), 6)
  const dist = statusDistribution(tasks)
  const activity = recentActivity(tasks, projects, notes)

  const donutSegments = [
    { label: 'منجزة', value: dist.done, color: 'var(--success-500)' },
    { label: 'جارية', value: dist.inProgress, color: 'var(--warning-500)' },
    { label: 'للتنفيذ', value: dist.todo, color: 'var(--fg-4)' },
  ]

  const exportReport = () => {
    const data = { projects, tasks, notes, stats, generatedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mhwar-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 animate-fade-up space-y-6">
        <PageHeader
          eyebrow="نظرة عامة"
          title="التقارير"
          sub="ملخص أداء المشاريع والمهام"
          actions={
            <Button variant="secondary" size="md" onClick={exportReport}>
              <Download size={15} />
              تصدير JSON
            </Button>
          }
        />

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="إجمالي المشاريع" value={stats.totalProjects} delta={trendDelta(projectSeries)} series={projectSeries} color="var(--iris-500)" />
          <MetricCard label="مشاريع نشطة" value={stats.activeProjects} color="var(--success-500)" />
          <MetricCard label="إجمالي المهام" value={stats.totalTasks} delta={trendDelta(createdSeries)} series={createdSeries} color="var(--info-500)" />
          <MetricCard label="مهام منجزة" value={stats.completedTasks} delta={trendDelta(doneSeries)} series={cumulative(doneSeries)} color="var(--warning-500)" />
        </div>

        {/* Charts row */}
        <div className="reports-grid">
          {/* Per-project progress */}
          <div className="axis-card p-5">
            <div className="report-chart-card__head">
              <div>
                <div className="report-chart-card__title">التقدم حسب المشروع</div>
                <div className="report-chart-card__sub">نسبة الإنجاز لكل مشروع</div>
              </div>
            </div>
            <div className="audience-bars mt-4" style={{ gridTemplateColumns: `repeat(${Math.max(projects.length, 1)}, 1fr)` }}>
              {projects.map((p) => (
                <div key={p.id} className="audience-bars__col">
                  <div className="audience-bars__stack" style={{ background: 'var(--surface-2)' }}>
                    <div style={{ height: `${p.progress}%`, background: p.color }} />
                  </div>
                  <div className="audience-bars__label">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status donut */}
          <div className="axis-card p-5">
            <div className="report-chart-card__head">
              <div>
                <div className="report-chart-card__title">توزيع المهام</div>
                <div className="report-chart-card__sub">حسب الحالة</div>
              </div>
            </div>
            <Donut segments={donutSegments} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="axis-card p-5">
          <div className="report-chart-card__head mb-4">
            <div>
              <div className="report-chart-card__title">النشاط الأخير</div>
              <div className="report-chart-card__sub">أحدث المهام والملاحظات</div>
            </div>
          </div>
          <div className="scheduled-list">
            {activity.map((item) => (
              <div key={item.id} className="scheduled-row">
                <div className={`scheduled-row__icon scheduled-row__icon--${item.kind === 'task' ? 'iris' : 'info'}`}>
                  {item.kind === 'task' ? <CheckSquare size={16} /> : <FileText size={16} />}
                </div>
                <div className="scheduled-row__body">
                  <div className="scheduled-row__title">{item.title}</div>
                  <div className="scheduled-row__sub">{item.sub}</div>
                </div>
                <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{timeAgoAr(item.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export CTA */}
        <div className="reports-cta axis-card p-5">
          <div className="reports-cta__icon"><Download size={20} /></div>
          <div className="reports-cta__body">
            <div className="reports-cta__title">تصدير تقرير كامل</div>
            <div className="reports-cta__sub">نزّل نسخة JSON من كل المشاريع والمهام والملاحظات مع الإحصائيات</div>
          </div>
          <Button variant="primary" size="md" onClick={exportReport}>
            <Download size={15} />
            تصدير
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
