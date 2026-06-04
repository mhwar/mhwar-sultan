'use client'
import { useState } from 'react'
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Leaf, Target, Share2, Mail,
  Users2, FileText, Search, Globe, Check, X,
} from 'lucide-react'
import type { Project, GrowthMetric, GrowthExperiment, GrowthChannel, MetricCategory, ExperimentStatus, ExperimentResult, ChannelType, ChannelStatus } from '@/types'
import { useGrowthStore } from '@/store/store'
import { useShallow } from 'zustand/shallow'
import { formatDateShort, now } from '@/lib/utils'

// ── Labels & colors ──────────────────────────────────────────────────────────

const CAT_LABEL: Record<MetricCategory, string> = {
  acquisition: 'الاكتساب', activation: 'التفعيل', retention: 'الاحتفاظ',
  revenue: 'الإيرادات', referral: 'الإحالة',
}
const CAT_VAR: Record<MetricCategory, string> = {
  acquisition: 'var(--info-500)', activation: 'var(--iris-500)',
  retention: 'var(--success-500)', revenue: 'var(--warning-500)',
  referral: 'var(--fg-3)',
}
const EXP_STATUS_LABEL: Record<ExperimentStatus, string> = {
  idea: 'فكرة', running: 'جارية', completed: 'مكتملة', paused: 'موقوفة',
}
const EXP_STATUS_VAR: Record<ExperimentStatus, string> = {
  idea: 'var(--fg-3)', running: 'var(--info-500)',
  completed: 'var(--success-500)', paused: 'var(--warning-500)',
}
const EXP_RESULT_LABEL: Record<ExperimentResult, string> = {
  won: 'نجحت', lost: 'فشلت', inconclusive: 'غير حاسمة',
}
const EXP_RESULT_VAR: Record<ExperimentResult, string> = {
  won: 'var(--success-500)', lost: 'var(--danger-500)', inconclusive: 'var(--fg-3)',
}
const CH_STATUS_LABEL: Record<ChannelStatus, string> = {
  active: 'نشطة', testing: 'اختبار', paused: 'موقوفة', stopped: 'متوقفة',
}
const CH_STATUS_VAR: Record<ChannelStatus, string> = {
  active: 'var(--success-500)', testing: 'var(--warning-500)',
  paused: 'var(--fg-3)', stopped: 'var(--danger-500)',
}
const CH_TYPE_LABEL: Record<ChannelType, string> = {
  organic: 'عضوي', paid: 'مدفوع', social: 'اجتماعي', email: 'بريد إلكتروني',
  referral: 'إحالة', content: 'محتوى', seo: 'SEO', other: 'أخرى',
}
const CH_TYPE_ICON: Record<ChannelType, React.ComponentType<{ size?: number }>> = {
  organic: Leaf, paid: Target, social: Share2, email: Mail,
  referral: Users2, content: FileText, seo: Search, other: Globe,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function iceScore(e: GrowthExperiment) {
  return Math.round(((e.impact + e.confidence + e.ease) / 3) * 10) / 10
}
function iceColor(score: number) {
  if (score >= 4) return 'var(--success-500)'
  if (score >= 2.5) return 'var(--warning-500)'
  return 'var(--fg-3)'
}

function IceDots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="w-4 h-4 rounded-full border transition-colors"
          style={{
            background: n <= value ? 'var(--iris-500)' : 'transparent',
            borderColor: n <= value ? 'var(--iris-500)' : 'var(--border-subtle)',
          }}
        />
      ))}
    </span>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      {action}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { project: Project }

export default function GrowthTab({ project }: Props) {
  const pid = project.id
  const metrics     = useGrowthStore(useShallow((s) => s.metrics.filter((m) => m.projectId === pid).sort((a, b) => a.order - b.order)))
  const experiments = useGrowthStore(useShallow((s) => s.experiments.filter((e) => e.projectId === pid)))
  const channels    = useGrowthStore(useShallow((s) => s.channels.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)))
  const { addMetric, updateMetric, deleteMetric, addExperiment, updateExperiment, deleteExperiment, addChannel, updateChannel, deleteChannel } = useGrowthStore()

  return (
    <div className="space-y-8">
      <MetricsSection pid={pid} metrics={metrics} addMetric={addMetric} updateMetric={updateMetric} deleteMetric={deleteMetric} />
      <ExperimentsSection pid={pid} experiments={experiments} addExperiment={addExperiment} updateExperiment={updateExperiment} deleteExperiment={deleteExperiment} />
      <ChannelsSection pid={pid} channels={channels} addChannel={addChannel} updateChannel={updateChannel} deleteChannel={deleteChannel} />
    </div>
  )
}

// ── Section 1: Metrics ────────────────────────────────────────────────────────

type MetricFilter = MetricCategory | 'all'

const METRIC_FILTERS: { value: MetricFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'acquisition', label: 'الاكتساب' },
  { value: 'activation', label: 'التفعيل' },
  { value: 'retention', label: 'الاحتفاظ' },
  { value: 'revenue', label: 'الإيرادات' },
  { value: 'referral', label: 'الإحالة' },
]

interface MetricsSectionProps {
  pid: string
  metrics: GrowthMetric[]
  addMetric: (d: Omit<GrowthMetric, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => string
  updateMetric: (id: string, d: Partial<GrowthMetric>) => void
  deleteMetric: (id: string) => void
}

function MetricsSection({ pid, metrics, addMetric, updateMetric, deleteMetric }: MetricsSectionProps) {
  const [filter, setFilter] = useState<MetricFilter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const visible = filter === 'all' ? metrics : metrics.filter((m) => m.category === filter)

  return (
    <div className="axis-card p-4 md:p-6">
      <SectionHeader
        title="المقاييس"
        action={
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> إضافة مقياس
          </button>
        }
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-5">
        {METRIC_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 h-7 rounded-full text-xs font-medium transition-colors"
            style={{
              background: filter === f.value ? 'var(--iris-500)' : 'var(--color-surface-overlay)',
              color: filter === f.value ? 'white' : 'var(--color-text-muted)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ms-1 opacity-60">{metrics.filter((m) => m.category === f.value).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((m) =>
          editingId === m.id
            ? <MetricEditCard key={m.id} metric={m} onSave={(d) => { updateMetric(m.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            : <MetricCard key={m.id} metric={m} onEdit={() => setEditingId(m.id)} onDelete={() => deleteMetric(m.id)} />
        )}
        {adding && (
          <MetricAddCard
            onSave={(d) => { addMetric({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {visible.length === 0 && !adding && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          لا توجد مقاييس{filter !== 'all' ? ' لهذه الفئة' : ''} بعد
        </div>
      )}
    </div>
  )
}

function MetricCard({ metric: m, onEdit, onDelete }: { metric: GrowthMetric; onEdit: () => void; onDelete: () => void }) {
  const pct = m.target ? Math.min(100, Math.round((m.value / m.target) * 100)) : null
  return (
    <div
      className="group relative rounded-xl p-4 cursor-pointer transition-colors"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_VAR[m.category] }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{CAT_LABEL[m.category]}</span>
        </div>
        <div className="flex items-center gap-1">
          {m.change !== undefined && m.change !== null && (
            <span
              className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: m.change > 0 ? 'var(--success-500)' : m.change < 0 ? 'var(--danger-500)' : 'var(--fg-3)' }}
            >
              {m.change > 0 ? <TrendingUp size={11} /> : m.change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {Math.abs(m.change)}%
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: 'var(--danger-500)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Name & value */}
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{m.name}</p>
      <p className="axis-num text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {m.value.toLocaleString('ar-u-nu-latn')}
        <span className="text-sm font-normal ms-1" style={{ color: 'var(--color-text-muted)' }}>{m.unit}</span>
      </p>

      {/* Progress bar */}
      {pct !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>{pct}% من الهدف</span>
            <span>{m.target?.toLocaleString('ar-u-nu-latn')} {m.unit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_VAR[m.category] }} />
          </div>
        </div>
      )}
    </div>
  )
}

function MetricEditCard({ metric: m, onSave, onCancel }: { metric: GrowthMetric; onSave: (d: Partial<GrowthMetric>) => void; onCancel: () => void }) {
  const [name, setName] = useState(m.name)
  const [value, setValue] = useState(String(m.value))
  const [unit, setUnit] = useState(m.unit)
  const [target, setTarget] = useState(m.target !== undefined ? String(m.target) : '')
  const [change, setChange] = useState(m.change !== undefined ? String(m.change) : '')
  const [category, setCategory] = useState<MetricCategory>(m.category)

  const save = () => onSave({ name, value: parseFloat(value) || 0, unit, target: target ? parseFloat(target) : undefined, change: change ? parseFloat(change) : undefined, category })

  return <MetricFormCard name={name} setName={setName} value={value} setValue={setValue} unit={unit} setUnit={setUnit} target={target} setTarget={setTarget} change={change} setChange={setChange} category={category} setCategory={setCategory} onSave={save} onCancel={onCancel} />
}

function MetricAddCard({ onSave, onCancel }: { onSave: (d: Omit<GrowthMetric, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('0')
  const [unit, setUnit] = useState('')
  const [target, setTarget] = useState('')
  const [change, setChange] = useState('')
  const [category, setCategory] = useState<MetricCategory>('acquisition')

  const save = () => {
    if (!name.trim()) return
    onSave({ name, value: parseFloat(value) || 0, unit, target: target ? parseFloat(target) : undefined, change: change ? parseFloat(change) : undefined, category })
  }

  return <MetricFormCard name={name} setName={setName} value={value} setValue={setValue} unit={unit} setUnit={setUnit} target={target} setTarget={setTarget} change={change} setChange={setChange} category={category} setCategory={setCategory} onSave={save} onCancel={onCancel} />
}

interface MetricFormProps {
  name: string; setName: (v: string) => void
  value: string; setValue: (v: string) => void
  unit: string; setUnit: (v: string) => void
  target: string; setTarget: (v: string) => void
  change: string; setChange: (v: string) => void
  category: MetricCategory; setCategory: (v: MetricCategory) => void
  onSave: () => void; onCancel: () => void
}

function MetricFormCard({ name, setName, value, setValue, unit, setUnit, target, setTarget, change, setChange, category, setCategory, onSave, onCancel }: MetricFormProps) {
  const inputCls = "w-full h-8 rounded-md px-2 text-sm outline-none transition-colors"
  const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">الاسم</label>
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مستخدمون نشطون" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">القيمة</label>
          <input className={inputCls} style={inputStyle} type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">الوحدة</label>
          <input className={inputCls} style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="مستخدم" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">الهدف</label>
          <input className={inputCls} style={inputStyle} type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="اختياري" />
        </div>
        <div>
          <label className="axis-label mb-1 block">التغيير %</label>
          <input className={inputCls} style={inputStyle} type="number" value={change} onChange={(e) => setChange(e.target.value)} placeholder="مثال: 12.5" />
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">الفئة</label>
        <select className={inputCls} style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value as MetricCategory)}>
          {(Object.keys(CAT_LABEL) as MetricCategory[]).map((k) => <option key={k} value={k}>{CAT_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}

// ── Section 2: Experiments ────────────────────────────────────────────────────

type ExpFilter = ExperimentStatus | 'all'

const EXP_FILTERS: { value: ExpFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'idea', label: 'فكرة' },
  { value: 'running', label: 'جارية' },
  { value: 'completed', label: 'مكتملة' },
  { value: 'paused', label: 'موقوفة' },
]

interface ExpSectionProps {
  pid: string
  experiments: GrowthExperiment[]
  addExperiment: (d: Omit<GrowthExperiment, 'id' | 'order' | 'createdAt'>) => string
  updateExperiment: (id: string, d: Partial<GrowthExperiment>) => void
  deleteExperiment: (id: string) => void
}

function ExperimentsSection({ pid, experiments, addExperiment, updateExperiment, deleteExperiment }: ExpSectionProps) {
  const [filter, setFilter] = useState<ExpFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const visible = (filter === 'all' ? experiments : experiments.filter((e) => e.status === filter))
    .slice()
    .sort((a, b) => iceScore(b) - iceScore(a))

  return (
    <div className="axis-card p-4 md:p-6">
      <SectionHeader
        title="تجارب النمو"
        action={
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> إضافة تجربة
          </button>
        }
      />

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 mb-5">
        {EXP_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 h-7 rounded-full text-xs font-medium transition-colors"
            style={{
              background: filter === f.value ? 'var(--iris-500)' : 'var(--color-surface-overlay)',
              color: filter === f.value ? 'white' : 'var(--color-text-muted)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map((e) => (
          <ExperimentRow
            key={e.id}
            exp={e}
            expanded={expandedId === e.id}
            onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
            onUpdate={(d) => updateExperiment(e.id, d)}
            onDelete={() => { if (expandedId === e.id) setExpandedId(null); deleteExperiment(e.id) }}
          />
        ))}
        {adding && (
          <ExperimentAddRow
            pid={pid}
            onSave={(d) => { addExperiment(d); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {visible.length === 0 && !adding && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد تجارب بعد</div>
      )}
    </div>
  )
}

function ExperimentRow({ exp: e, expanded, onToggle, onUpdate, onDelete }: {
  exp: GrowthExperiment; expanded: boolean
  onToggle: () => void; onUpdate: (d: Partial<GrowthExperiment>) => void; onDelete: () => void
}) {
  const score = iceScore(e)
  const inputCls = "w-full rounded-md px-2 py-1.5 text-sm outline-none"
  const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-surface-border)' }}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        {/* ICE score badge */}
        <span
          className="shrink-0 w-10 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: `color-mix(in oklch, ${iceColor(score)} 15%, transparent)`, color: iceColor(score) }}
        >
          {score}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{e.title}</span>

        {/* Status pill */}
        <span
          className="shrink-0 flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium"
          style={{ background: `color-mix(in oklch, ${EXP_STATUS_VAR[e.status]} 15%, transparent)`, color: EXP_STATUS_VAR[e.status] }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: EXP_STATUS_VAR[e.status] }} />
          {EXP_STATUS_LABEL[e.status]}
        </span>

        {/* Result badge */}
        {e.status === 'completed' && e.result && (
          <span
            className="shrink-0 px-2 h-6 rounded-full flex items-center text-xs font-semibold"
            style={{ background: `color-mix(in oklch, ${EXP_RESULT_VAR[e.result]} 15%, transparent)`, color: EXP_RESULT_VAR[e.result] }}
          >
            {EXP_RESULT_LABEL[e.result]}
          </span>
        )}

        {expanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="axis-label mb-1 block">الفرضية</label>
              <textarea
                rows={2}
                className="w-full rounded-md px-2 py-1.5 text-sm outline-none resize-none"
                style={inputStyle}
                defaultValue={e.hypothesis ?? ''}
                onBlur={(ev) => onUpdate({ hypothesis: ev.target.value })}
                placeholder="نعتقد أن … سيؤدي إلى …"
              />
            </div>
            <div>
              <label className="axis-label mb-1 block">المقياس المستهدف</label>
              <input
                className={inputCls}
                style={inputStyle}
                defaultValue={e.metric ?? ''}
                onBlur={(ev) => onUpdate({ metric: ev.target.value })}
                placeholder="مثال: معدل التسجيل"
              />
            </div>
          </div>

          {/* ICE */}
          <div>
            <label className="axis-label mb-2 block">نقاط ICE</label>
            <div className="flex flex-wrap gap-4">
              {(['impact', 'confidence', 'ease'] as const).map((dim) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {dim === 'impact' ? 'التأثير' : dim === 'confidence' ? 'الثقة' : 'السهولة'}
                  </span>
                  <IceDots value={e[dim]} onChange={(v) => onUpdate({ [dim]: v as 1 | 2 | 3 | 4 | 5 })} />
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="axis-label mb-1 block">تاريخ البدء</label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                defaultValue={e.startDate ? e.startDate.slice(0, 10) : ''}
                onBlur={(ev) => onUpdate({ startDate: ev.target.value ? new Date(ev.target.value).toISOString() : undefined })}
              />
            </div>
            <div>
              <label className="axis-label mb-1 block">تاريخ الانتهاء</label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                defaultValue={e.endDate ? e.endDate.slice(0, 10) : ''}
                onBlur={(ev) => onUpdate({ endDate: ev.target.value ? new Date(ev.target.value).toISOString() : undefined })}
              />
            </div>
          </div>

          {/* Status + Result */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="axis-label mb-1 block">الحالة</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={e.status}
                onChange={(ev) => onUpdate({ status: ev.target.value as ExperimentStatus })}
              >
                {(Object.keys(EXP_STATUS_LABEL) as ExperimentStatus[]).map((k) => <option key={k} value={k}>{EXP_STATUS_LABEL[k]}</option>)}
              </select>
            </div>
            {e.status === 'completed' && (
              <div>
                <label className="axis-label mb-1 block">النتيجة</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={e.result ?? ''}
                  onChange={(ev) => onUpdate({ result: (ev.target.value as ExperimentResult) || undefined })}
                >
                  <option value="">— اختر —</option>
                  {(Object.keys(EXP_RESULT_LABEL) as ExperimentResult[]).map((k) => <option key={k} value={k}>{EXP_RESULT_LABEL[k]}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="axis-label mb-1 block">ملاحظات</label>
            <textarea
              rows={2}
              className="w-full rounded-md px-2 py-1.5 text-sm outline-none resize-none"
              style={inputStyle}
              defaultValue={e.notes ?? ''}
              onBlur={(ev) => onUpdate({ notes: ev.target.value })}
            />
          </div>

          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs px-3 h-7 rounded-md transition-colors"
            style={{ color: 'var(--danger-500)', border: '1px solid var(--danger-500)', background: 'transparent' }}
          >
            <Trash2 size={12} /> حذف التجربة
          </button>
        </div>
      )}
    </div>
  )
}

function ExperimentAddRow({ pid, onSave, onCancel }: {
  pid: string
  onSave: (d: Omit<GrowthExperiment, 'id' | 'order' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<ExperimentStatus>('idea')
  const [impact, setImpact] = useState<1|2|3|4|5>(3)
  const [confidence, setConfidence] = useState<1|2|3|4|5>(3)
  const [ease, setEase] = useState<1|2|3|4|5>(3)

  const save = () => {
    if (!title.trim()) return
    onSave({ projectId: pid, title, status, impact, confidence, ease })
  }

  const inputCls = "w-full h-8 rounded-md px-2 text-sm outline-none"
  const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid var(--iris-500)', background: 'var(--color-surface-overlay)' }}>
      <div>
        <label className="axis-label mb-1 block">عنوان التجربة</label>
        <input className={inputCls} style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تبسيط تدفق التسجيل" autoFocus />
      </div>
      <div>
        <label className="axis-label mb-1 block">الحالة</label>
        <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ExperimentStatus)}>
          {(Object.keys(EXP_STATUS_LABEL) as ExperimentStatus[]).map((k) => <option key={k} value={k}>{EXP_STATUS_LABEL[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="axis-label mb-2 block">نقاط ICE</label>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>التأثير</span>
            <IceDots value={impact} onChange={(v) => setImpact(v as 1|2|3|4|5)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>الثقة</span>
            <IceDots value={confidence} onChange={(v) => setConfidence(v as 1|2|3|4|5)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>السهولة</span>
            <IceDots value={ease} onChange={(v) => setEase(v as 1|2|3|4|5)} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}

// ── Section 3: Channels ───────────────────────────────────────────────────────

interface ChSectionProps {
  pid: string
  channels: GrowthChannel[]
  addChannel: (d: Omit<GrowthChannel, 'id' | 'order' | 'createdAt'>) => string
  updateChannel: (id: string, d: Partial<GrowthChannel>) => void
  deleteChannel: (id: string) => void
}

function ChannelsSection({ pid, channels, addChannel, updateChannel, deleteChannel }: ChSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="axis-card p-4 md:p-6">
      <SectionHeader
        title="قنوات الاكتساب"
        action={
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> إضافة قناة
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((c) =>
          editingId === c.id
            ? <ChannelEditCard key={c.id} channel={c} onSave={(d) => { updateChannel(c.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            : <ChannelCard key={c.id} channel={c} onEdit={() => setEditingId(c.id)} onDelete={() => deleteChannel(c.id)} />
        )}
        {adding && (
          <ChannelAddCard
            onSave={(d) => { addChannel({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {channels.length === 0 && !adding && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد قنوات بعد</div>
      )}
    </div>
  )
}

function ChannelCard({ channel: c, onEdit, onDelete }: { channel: GrowthChannel; onEdit: () => void; onDelete: () => void }) {
  const Icon = CH_TYPE_ICON[c.type]
  return (
    <div
      className="group relative rounded-xl p-4 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
          >
            <Icon size={15} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{CH_TYPE_LABEL[c.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="flex items-center gap-1 px-2 h-5 rounded-full text-xs font-medium"
            style={{ background: `color-mix(in oklch, ${CH_STATUS_VAR[c.status]} 15%, transparent)`, color: CH_STATUS_VAR[c.status] }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: CH_STATUS_VAR[c.status] }} />
            {CH_STATUS_LABEL[c.status]}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: 'var(--danger-500)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {c.notes && (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{c.notes}</p>
      )}
    </div>
  )
}

function ChannelEditCard({ channel: c, onSave, onCancel }: { channel: GrowthChannel; onSave: (d: Partial<GrowthChannel>) => void; onCancel: () => void }) {
  const [name, setName] = useState(c.name)
  const [type, setType] = useState<ChannelType>(c.type)
  const [status, setStatus] = useState<ChannelStatus>(c.status)
  const [notes, setNotes] = useState(c.notes ?? '')
  return <ChannelFormCard name={name} setName={setName} type={type} setType={setType} status={status} setStatus={setStatus} notes={notes} setNotes={setNotes} onSave={() => onSave({ name, type, status, notes })} onCancel={onCancel} />
}

function ChannelAddCard({ onSave, onCancel }: { onSave: (d: Omit<GrowthChannel, 'id' | 'order' | 'createdAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ChannelType>('social')
  const [status, setStatus] = useState<ChannelStatus>('testing')
  const [notes, setNotes] = useState('')
  const save = () => { if (!name.trim()) return; onSave({ name, type, status, notes }) }
  return <ChannelFormCard name={name} setName={setName} type={type} setType={setType} status={status} setStatus={setStatus} notes={notes} setNotes={setNotes} onSave={save} onCancel={onCancel} />
}

interface ChannelFormProps {
  name: string; setName: (v: string) => void
  type: ChannelType; setType: (v: ChannelType) => void
  status: ChannelStatus; setStatus: (v: ChannelStatus) => void
  notes: string; setNotes: (v: string) => void
  onSave: () => void; onCancel: () => void
}

function ChannelFormCard({ name, setName, type, setType, status, setStatus, notes, setNotes, onSave, onCancel }: ChannelFormProps) {
  const inputCls = "w-full h-8 rounded-md px-2 text-sm outline-none"
  const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid var(--iris-500)', background: 'var(--color-surface-overlay)' }}>
      <div>
        <label className="axis-label mb-1 block">اسم القناة</label>
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: Twitter / X" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">النوع</label>
          <select className={inputCls} style={inputStyle} value={type} onChange={(e) => setType(e.target.value as ChannelType)}>
            {(Object.keys(CH_TYPE_LABEL) as ChannelType[]).map((k) => <option key={k} value={k}>{CH_TYPE_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="axis-label mb-1 block">الحالة</label>
          <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ChannelStatus)}>
            {(Object.keys(CH_STATUS_LABEL) as ChannelStatus[]).map((k) => <option key={k} value={k}>{CH_STATUS_LABEL[k]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">ملاحظات</label>
        <input className={inputCls} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}
