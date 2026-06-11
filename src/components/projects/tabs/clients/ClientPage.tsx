'use client'
import { useState, useMemo } from 'react'
import {
  ArrowRight, Edit2, Mail, Phone, FileText, CheckCircle2, Inbox, Send, Plus,
  Check, X, Package,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Client, ClientStatus, ContentItem, ContentStatus, ContentSource, FinanceEntry, FinanceKind, FinanceStatus, Project } from '@/types'
import { useContentStore, useClientStore, useFinanceStore, usePackageStore } from '@/store/store'
import { ClientAvatar } from '../ClientsTab'
import ContentDrawer from '../content/ContentDrawer'
import { PlatformIcon } from '../content/PlatformIcon'
import {
  STATUS_LABEL, STATUS_VAR, SOURCE_LABEL, DONE_STATUSES,
  STAGE_ORDER, STAGE_LABEL, STAGE_VAR, STAGE_STATUSES, stageOf, type ContentStage,
  scheduledKey, keyInMonth, monthLabel, fmtDayMonth, TYPE_LABEL,
  buildClientColorMap,
} from '../content/contentMeta'

const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'نشط', paused: 'موقوف', ended: 'منتهٍ',
}
const CLIENT_STATUS_VAR: Record<ClientStatus, string> = {
  active: 'var(--success-500)', paused: 'var(--warning-500)', ended: 'var(--fg-3)',
}

const FINANCE_STATUS_LABEL: Record<FinanceStatus, string> = {
  planned: 'مخطط', paid: 'مدفوع', overdue: 'متأخر',
}
const FINANCE_STATUS_VAR: Record<FinanceStatus, string> = {
  planned: 'var(--fg-3)', paid: 'var(--success-500)', overdue: 'var(--danger-500)',
}
const FINANCE_KIND_LABEL: Record<FinanceKind, string> = {
  income: 'إيراد', expense: 'مصروف',
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties

type Tab = 'overview' | 'content' | 'agreement' | 'billing'

interface Props {
  client: Client
  project: Project
  accent: string
  onClose: () => void
  onEdit: () => void
}

export default function ClientPage({ client, project, accent, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  const statusColor = CLIENT_STATUS_VAR[client.status]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'content', label: 'المحتوى' },
    { key: 'agreement', label: 'الاتفاقية' },
    { key: 'billing', label: 'الفوترة' },
  ]

  return (
    <div className="space-y-4">
      {/* Back bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <ArrowRight size={14} />
          العملاء
        </button>
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{client.name}</span>
      </div>

      {/* Client header */}
      <div className="axis-card p-4 md:p-6">
        <div className="flex items-start gap-4">
          <ClientAvatar client={client} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{client.name}</h2>
              <span
                className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full text-xs font-medium"
                style={{ background: `color-mix(in oklch, ${statusColor} 15%, transparent)`, color: statusColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                {CLIENT_STATUS_LABEL[client.status]}
              </span>
            </div>
            {client.contactName && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{client.contactName}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {client.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{client.email}</span>}
              {client.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{client.phone}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              <span className="font-semibold axis-num" style={{ color: 'var(--success-500)' }}>
                {client.contractValue.toLocaleString('en-US')} {client.contractCurrency}
                <span className="font-normal ms-1" style={{ color: 'var(--color-text-muted)' }}>/ شهر</span>
              </span>
              {client.deliverableCount !== undefined && client.deliverableCount > 0 && (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  <span className="axis-num">{client.deliverableCount}</span> قطعة / شهر
                </span>
              )}
              {(client.contractStart || client.contractEnd) && (
                <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <FileText size={11} />
                  {client.contractStart && new Date(client.contractStart).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {client.contractStart && client.contractEnd && ' — '}
                  {client.contractEnd && new Date(client.contractEnd).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Edit2 size={13} /> تعديل
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t.key ? accent : 'var(--color-text-muted)',
              borderBottom: tab === t.key ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab client={client} accent={accent} />}
      {tab === 'content' && <ContentTab client={client} project={project} accent={accent} />}
      {tab === 'agreement' && <AgreementTab client={client} />}
      {tab === 'billing' && <BillingTab client={client} project={project} />}
    </div>
  )
}

/* ── Overview Tab ─────────────────────────────────────────── */

function OverviewTab({ client, accent }: { client: Client; accent: string }) {
  const [requestTitle, setRequestTitle] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const { addItem } = useContentStore()
  const items = useContentStore(useShallow((s) =>
    s.items.filter((i) => i.projectId === client.projectId && i.clientId === client.id)
  ))

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthItems = useMemo(
    () => items.filter((i) => keyInMonth(scheduledKey(i), year, month)),
    [items, year, month]
  )
  const done = monthItems.filter((i) => DONE_STATUSES.includes(i.status)).length
  const quota = client.deliverableCount ?? 0
  const pct = quota > 0 ? Math.min(100, Math.round((done / quota) * 100)) : 0
  const remainingToSchedule = Math.max(0, quota - monthItems.length)
  const requests = items.filter((i) => i.source === 'client-request' && !DONE_STATUSES.includes(i.status))
  const published = useMemo(
    () => items
      .filter((i) => i.status === 'published')
      .sort((a, b) => (scheduledKey(b) ?? '').localeCompare(scheduledKey(a) ?? ''))
      .slice(0, 5),
    [items]
  )

  const addRequest = () => {
    if (!requestTitle.trim()) return
    addItem({
      projectId: client.projectId,
      clientId: client.id,
      title: requestTitle.trim(),
      type: 'post',
      status: 'idea',
      source: 'client-request',
    })
    setRequestTitle('')
    setRequestSent(true)
    setTimeout(() => setRequestSent(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Month progress */}
      <div className="axis-card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>تقدم {monthLabel(year, month)}</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            <span className="axis-num">{done}</span>
            {quota > 0 && <span className="axis-num" style={{ color: 'var(--color-text-muted)' }}> / {quota}</span>}
            <span className="font-normal text-xs ms-1" style={{ color: 'var(--color-text-muted)' }}>قطعة منجزة</span>
          </span>
          {quota > 0 && (
            done >= quota
              ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--success-500)' }}><CheckCircle2 size={13} /> اكتملت الحصة</span>
              : <span className="axis-num text-xs" style={{ color: accent }}>{pct}%</span>
          )}
        </div>
        {quota > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
            <div className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${pct}%`, background: accent }} />
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span><span className="axis-num">{monthItems.length}</span> مجدول هذا الشهر</span>
          {remainingToSchedule > 0 && <span><span className="axis-num">{remainingToSchedule}</span> متبقٍ للجدولة</span>}
          {requests.length > 0 && (
            <span style={{ color: 'var(--warning-500)' }}>
              <span className="axis-num">{requests.length}</span> طلب قيد التنفيذ
            </span>
          )}
        </div>
      </div>

      {/* Quick request */}
      <div className="axis-card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5"><Inbox size={11} /> إضافة طلب من العميل</span>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="مثال: تصميم إعلان العرض الجديد"
            value={requestTitle}
            onChange={(e) => setRequestTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addRequest() }}
            className="flex-1 h-9 rounded-md px-3 text-sm outline-none"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={addRequest}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold text-white shrink-0"
            style={{ background: accent }}
          >
            <Plus size={13} /> إضافة
          </button>
        </div>
        {requestSent && (
          <p className="inline-flex items-center gap-1 text-xs mt-1.5" style={{ color: 'var(--success-500)' }}>
            <Send size={11} /> أُضيف الطلب إلى تبويب المحتوى بحالة «فكرة»
          </p>
        )}
      </div>

      {/* This month's works grouped by status */}
      <div className="axis-card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>أعمال {monthLabel(year, month)}</p>
        {monthItems.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>لا توجد أعمال مجدولة لهذا الشهر بعد</p>
        ) : (
          <div className="space-y-3">
            {STAGE_ORDER.map((stage) => {
              const group = monthItems.filter((i) => STAGE_STATUSES[stage].includes(i.status))
              if (group.length === 0) return null
              return (
                <div key={stage}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_VAR[stage] }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{STAGE_LABEL[stage]}</span>
                    <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>{group.length}</span>
                  </div>
                  <div className="space-y-1">
                    {group.map((it) => <WorkRow key={it.id} item={it} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Last published */}
      {published.length > 0 && (
        <div className="axis-card p-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>آخر الأعمال المنشورة</p>
          <div className="space-y-1">
            {published.map((it) => <WorkRow key={it.id} item={it} showDate />)}
          </div>
        </div>
      )}
    </div>
  )
}

function WorkRow({ item, showDate }: { item: ContentItem; showDate?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-2"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STAGE_VAR[stageOf(item.status)] }} />
      <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{item.title}</span>
      {item.source === 'client-request' && (
        <span
          className="px-1.5 rounded-full text-[10px] font-semibold shrink-0"
          style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
        >
          {SOURCE_LABEL['client-request']}
        </span>
      )}
      <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{TYPE_LABEL[item.type]}</span>
      {item.platform && <PlatformIcon platform={item.platform} size={11} style={{ color: 'var(--color-text-muted)' }} />}
      {showDate && <span className="num-tabular text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{fmtDayMonth(scheduledKey(item))}</span>}
    </div>
  )
}

/* ── Content Tab ──────────────────────────────────────────── */

function ContentTab({ client, project, accent }: { client: Client; project: Project; accent: string }) {
  const [filterStage, setFilterStage] = useState<ContentStage | 'all'>('all')
  const [filterSource, setFilterSource] = useState<ContentSource | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const { addItem, updateItem, deleteItem } = useContentStore()
  const items = useContentStore(useShallow((s) =>
    s.items.filter((i) => i.projectId === client.projectId && i.clientId === client.id)
  ))
  const allClients = useClientStore(useShallow((s) => s.clients.filter((c) => c.projectId === project.id)))
  const clientColorMap = useMemo(() => buildClientColorMap(allClients.map((c) => c.id)), [allClients])

  const filtered = useMemo(() => items.filter((i) => {
    if (filterStage !== 'all' && stageOf(i.status) !== filterStage) return false
    if (filterSource !== 'all' && (i.source ?? 'internal') !== filterSource) return false
    return true
  }), [items, filterStage, filterSource])

  const openItem = openId ? items.find((i) => i.id === openId) : undefined

  const closeDrawer = () => {
    const cur = openId ? items.find((i) => i.id === openId) : undefined
    if (cur && !cur.title.trim() && !cur.body?.trim()) deleteItem(cur.id)
    setOpenId(null)
  }

  const handleAdd = () => {
    const id = addItem({
      projectId: client.projectId,
      clientId: client.id,
      title: '',
      type: 'post',
      status: 'idea',
    })
    setOpenId(id)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>المرحلة:</span>
        <FilterChip active={filterStage === 'all'} onClick={() => setFilterStage('all')} color="var(--iris-500)">الكل</FilterChip>
        {STAGE_ORDER.map((s) => (
          <FilterChip key={s} active={filterStage === s} onClick={() => setFilterStage(filterStage === s ? 'all' : s)} color={STAGE_VAR[s]}>
            {STAGE_LABEL[s]}
          </FilterChip>
        ))}
        <span className="w-px h-5 mx-1" style={{ background: 'var(--color-surface-border)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>المصدر:</span>
        <FilterChip active={filterSource === 'client-request'} onClick={() => setFilterSource(filterSource === 'client-request' ? 'all' : 'client-request')} color="var(--warning-500)">
          {SOURCE_LABEL['client-request']}
        </FilterChip>
        <FilterChip active={filterSource === 'internal'} onClick={() => setFilterSource(filterSource === 'internal' ? 'all' : 'internal')} color="oklch(0.62 0.17 215)">
          {SOURCE_LABEL.internal}
        </FilterChip>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold"
          style={{ background: accent, color: 'white' }}
        >
          <Plus size={13} /> إضافة محتوى
        </button>
      </div>

      {/* Content list */}
      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا يوجد محتوى ضمن الفلاتر المحددة</p>
          </div>
        ) : (
          filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => setOpenId(it.id)}
              className="w-full text-start flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STAGE_VAR[stageOf(it.status)] }} />
              <span className="flex-1 min-w-0 text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{it.title || '(بلا عنوان)'}</span>
              <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{TYPE_LABEL[it.type]}</span>
              {it.platform && <PlatformIcon platform={it.platform} size={12} style={{ color: 'var(--color-text-muted)' }} />}
              <span
                className="px-1.5 rounded-full text-[10px] font-semibold shrink-0"
                style={{ background: `color-mix(in oklch, ${STATUS_VAR[it.status]} 15%, transparent)`, color: STATUS_VAR[it.status] }}
              >
                {STATUS_LABEL[it.status]}
              </span>
              {it.source === 'client-request' && (
                <span
                  className="px-1.5 rounded-full text-[10px] font-semibold shrink-0"
                  style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
                >
                  {SOURCE_LABEL['client-request']}
                </span>
              )}
              {(it.publishDate || it.dueDate) && (
                <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {fmtDayMonth(scheduledKey(it))}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {openItem && (
        <ContentDrawer
          item={openItem}
          clients={allClients}
          accent={openItem.clientId ? (clientColorMap[openItem.clientId] ?? accent) : accent}
          onUpdate={(data) => updateItem(openItem.id, data)}
          onDelete={() => deleteItem(openItem.id)}
          onClose={closeDrawer}
        />
      )}
    </div>
  )
}

function FilterChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 h-6 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1"
      style={{
        background: active ? `color-mix(in oklch, ${color} 18%, transparent)` : 'var(--color-surface-overlay)',
        color: active ? color : 'var(--color-text-secondary)',
        border: `1px solid ${active ? `color-mix(in oklch, ${color} 45%, transparent)` : 'var(--color-surface-border)'}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {children}
    </button>
  )
}

/* ── Agreement Tab ────────────────────────────────────────── */

type ClientFormData = Omit<Client, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'projectId'>

function AgreementTab({ client }: { client: Client }) {
  const { updateClient } = useClientStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(client.name)
  const [contactName, setContactName] = useState(client.contactName ?? '')
  const [email, setEmail] = useState(client.email ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')
  const [contractValue, setContractValue] = useState(String(client.contractValue))
  const [contractCurrency, setContractCurrency] = useState(client.contractCurrency ?? 'SAR')
  const [deliverableCount, setDeliverableCount] = useState(client.deliverableCount !== undefined ? String(client.deliverableCount) : '')
  const [contractStart, setContractStart] = useState(client.contractStart ? client.contractStart.slice(0, 10) : '')
  const [contractEnd, setContractEnd] = useState(client.contractEnd ? client.contractEnd.slice(0, 10) : '')
  const [status, setStatus] = useState<ClientStatus>(client.status)
  const [notes, setNotes] = useState(client.notes ?? '')

  const save = () => {
    const data: Partial<ClientFormData> = {
      name: name.trim() || client.name,
      contactName: contactName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      contractValue: parseFloat(contractValue) || 0,
      contractCurrency,
      deliverableCount: deliverableCount ? parseInt(deliverableCount) : undefined,
      contractStart: contractStart ? new Date(contractStart).toISOString() : undefined,
      contractEnd: contractEnd ? new Date(contractEnd).toISOString() : undefined,
      status,
      notes: notes || undefined,
    }
    updateClient(client.id, data)
    setEditing(false)
  }

  const cancel = () => {
    setName(client.name)
    setContactName(client.contactName ?? '')
    setEmail(client.email ?? '')
    setPhone(client.phone ?? '')
    setContractValue(String(client.contractValue))
    setContractCurrency(client.contractCurrency ?? 'SAR')
    setDeliverableCount(client.deliverableCount !== undefined ? String(client.deliverableCount) : '')
    setContractStart(client.contractStart ? client.contractStart.slice(0, 10) : '')
    setContractEnd(client.contractEnd ? client.contractEnd.slice(0, 10) : '')
    setStatus(client.status)
    setNotes(client.notes ?? '')
    setEditing(false)
  }

  const STATUS_OPTS: { value: ClientStatus; label: string }[] = [
    { value: 'active', label: 'نشط' },
    { value: 'paused', label: 'موقوف' },
    { value: 'ended', label: 'منتهٍ' },
  ]

  return (
    <div className="axis-card p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>تفاصيل الاتفاقية</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Edit2 size={12} /> تعديل
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">اسم العميل</label>
              <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">جهة التواصل</label>
              <input className={inputCls} style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">البريد الإلكتروني</label>
              <input className={inputCls} style={inputStyle} dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">الجوال</label>
              <input className={inputCls} style={inputStyle} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="axis-label mb-1 block">قيمة العقد الشهرية</label>
              <input type="number" className={inputCls} style={inputStyle} value={contractValue} onChange={(e) => setContractValue(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">العملة</label>
              <input className={inputCls} style={inputStyle} value={contractCurrency} onChange={(e) => setContractCurrency(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">قطع / شهر</label>
              <input type="number" className={inputCls} style={inputStyle} value={deliverableCount} onChange={(e) => setDeliverableCount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">بداية العقد</label>
              <input type="date" className={inputCls} style={inputStyle} value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
            </div>
            <div>
              <label className="axis-label mb-1 block">نهاية العقد</label>
              <input type="date" className={inputCls} style={inputStyle} value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="axis-label mb-1 block">الحالة</label>
            <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="axis-label mb-1 block">ملاحظات العقد</label>
            <textarea
              className="w-full rounded-md px-2 py-1.5 text-sm outline-none resize-none"
              style={{ ...inputStyle, height: 80 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات العقد..."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex items-center gap-1 px-3 h-8 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
              <Check size={12} /> حفظ
            </button>
            <button onClick={cancel} className="flex items-center gap-1 px-3 h-8 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
              <X size={12} /> إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <InfoRow label="اسم العميل" value={client.name} />
          {client.contactName && <InfoRow label="جهة التواصل" value={client.contactName} />}
          {client.email && <InfoRow label="البريد الإلكتروني" value={client.email} ltr />}
          {client.phone && <InfoRow label="الجوال" value={client.phone} ltr />}
          <InfoRow label="قيمة العقد الشهرية" value={`${client.contractValue.toLocaleString('en-US')} ${client.contractCurrency}`} />
          {client.deliverableCount !== undefined && (
            <InfoRow label="قطع / شهر" value={String(client.deliverableCount)} />
          )}
          {client.contractStart && <InfoRow label="بداية العقد" value={new Date(client.contractStart).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })} />}
          {client.contractEnd && <InfoRow label="نهاية العقد" value={new Date(client.contractEnd).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })} />}
          {client.notes && <InfoRow label="ملاحظات العقد" value={client.notes} multiline />}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, ltr, multiline }: { label: string; value: string; ltr?: boolean; multiline?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="axis-label">{label}</span>
      <span className={`text-sm${multiline ? ' leading-relaxed' : ''}`} style={{ color: 'var(--color-text-primary)' }} dir={ltr ? 'ltr' : undefined}>{value}</span>
    </div>
  )
}

/* ── Billing Tab ──────────────────────────────────────────── */

function BillingTab({ client, project }: { client: Client; project: Project }) {
  const entries = useFinanceStore(useShallow((s) =>
    s.entries.filter((e) => e.projectId === project.id && e.clientId === client.id)
  ))
  const pkg = usePackageStore(useShallow((s) =>
    s.packages.find((p) => p.projectId === project.id && p.clientIds?.includes(client.id))
  ))
  const { addEntry } = useFinanceStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formKind, setFormKind] = useState<FinanceKind>('income')
  const [formStatus, setFormStatus] = useState<FinanceStatus>('planned')
  const [formDate, setFormDate] = useState('')

  const income = entries.filter((e) => e.kind === 'income')
  const expense = entries.filter((e) => e.kind === 'expense')

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const monthPrefix = `${year}-${month}`
  const thisMonthIncome = income
    .filter((e) => e.status === 'paid' && e.date?.startsWith(monthPrefix))
    .reduce((s, e) => s + e.amount, 0)
  const currency = entries[0]?.currency ?? 'SAR'

  const handleAddEntry = () => {
    if (!formTitle.trim()) return
    addEntry({
      projectId: project.id,
      clientId: client.id,
      title: formTitle.trim(),
      kind: formKind,
      amount: parseFloat(formAmount) || 0,
      currency,
      status: formStatus,
      date: formDate ? new Date(formDate).toISOString() : undefined,
      recurring: false,
    })
    setFormTitle('')
    setFormAmount('')
    setFormDate('')
    setShowAddForm(false)
  }

  return (
    <div className="space-y-5">
      {/* Package */}
      {pkg ? (
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)' }}>
              <Package size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{pkg.name}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>الباقة المرتبطة</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-flex items-baseline gap-1">
              <span className="axis-num font-semibold" style={{ color: 'var(--color-text-primary)' }}>{pkg.price.toLocaleString('en-US')}</span>
              {pkg.currency} / شهر
            </span>
            {pkg.deliverables != null && (
              <span className="inline-flex items-baseline gap-1">
                <span className="axis-num font-semibold" style={{ color: 'var(--color-text-primary)' }}>{pkg.deliverables.toLocaleString('en-US')}</span>
                قطعة / شهر
              </span>
            )}
          </div>
          {pkg.features && pkg.features.length > 0 && (
            <ul className="space-y-1.5">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success-500)' }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>لا توجد باقة مرتبطة</p>
      )}

      {/* Summary */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>إجمالي الإيرادات المحصلة هذا الشهر</p>
        <p className="axis-num text-xl font-bold" style={{ color: 'var(--success-500)' }}>
          {thisMonthIncome.toLocaleString('en-US')} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{currency}</span>
        </p>
      </div>

      {/* Income entries */}
      {income.length > 0 && (
        <div className="axis-card p-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>الإيرادات</p>
          <div className="space-y-1.5">
            {income.map((e) => <FinanceRow key={e.id} entry={e} />)}
          </div>
        </div>
      )}

      {/* Expense entries */}
      {expense.length > 0 && (
        <div className="axis-card p-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>المصروفات</p>
          <div className="space-y-1.5">
            {expense.map((e) => <FinanceRow key={e.id} entry={e} />)}
          </div>
        </div>
      )}

      {entries.length === 0 && !showAddForm && (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد قيود مالية مرتبطة بهذا العميل</p>
        </div>
      )}

      {/* Add entry form */}
      {showAddForm && (
        <div className="axis-card p-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>إضافة قيد مالي</p>
          <div>
            <label className="axis-label mb-1 block">العنوان</label>
            <input className={inputCls} style={inputStyle} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="مثال: اشتراك شهري" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">النوع</label>
              <select className={inputCls} style={inputStyle} value={formKind} onChange={(e) => setFormKind(e.target.value as FinanceKind)}>
                <option value="income">{FINANCE_KIND_LABEL.income}</option>
                <option value="expense">{FINANCE_KIND_LABEL.expense}</option>
              </select>
            </div>
            <div>
              <label className="axis-label mb-1 block">الحالة</label>
              <select className={inputCls} style={inputStyle} value={formStatus} onChange={(e) => setFormStatus(e.target.value as FinanceStatus)}>
                <option value="planned">{FINANCE_STATUS_LABEL.planned}</option>
                <option value="paid">{FINANCE_STATUS_LABEL.paid}</option>
                <option value="overdue">{FINANCE_STATUS_LABEL.overdue}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="axis-label mb-1 block">المبلغ</label>
              <input type="number" className={inputCls} style={inputStyle} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="axis-label mb-1 block">التاريخ</label>
              <input type="date" className={inputCls} style={inputStyle} value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddEntry} className="flex items-center gap-1 px-3 h-8 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
              <Check size={12} /> حفظ
            </button>
            <button onClick={() => setShowAddForm(false)} className="flex items-center gap-1 px-3 h-8 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
              <X size={12} /> إلغاء
            </button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة قيد
        </button>
      )}
    </div>
  )
}

function FinanceRow({ entry: e }: { entry: FinanceEntry }) {
  const statusColor = FINANCE_STATUS_VAR[e.status]
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-2.5 py-2"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</p>
        {e.date && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{new Date(e.date).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
      </div>
      {e.recurring && (
        <span className="text-[10px] px-1.5 rounded-full shrink-0" style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)' }}>
          متكرر
        </span>
      )}
      <span
        className="text-[10px] px-1.5 rounded-full font-semibold shrink-0"
        style={{ background: `color-mix(in oklch, ${statusColor} 15%, transparent)`, color: statusColor }}
      >
        {FINANCE_STATUS_LABEL[e.status]}
      </span>
      <span className="axis-num text-xs font-semibold shrink-0" style={{ color: e.kind === 'income' ? 'var(--success-500)' : 'var(--danger-500)' }}>
        {e.kind === 'income' ? '+' : '-'}{e.amount.toLocaleString('en-US')}
      </span>
    </div>
  )
}
