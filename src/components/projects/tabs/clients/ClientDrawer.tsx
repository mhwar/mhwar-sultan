'use client'
import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Edit2, CheckCircle2, Inbox, Send } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Client, ClientStatus, ContentItem } from '@/types'
import { useContentStore } from '@/store/store'
import {
  STATUS_ORDER, STATUS_LABEL, STATUS_VAR, TYPE_LABEL, SOURCE_LABEL, DONE_STATUSES,
  scheduledKey, keyInMonth, monthLabel, fmtDayMonth,
} from '../content/contentMeta'
import { PlatformIcon } from '../content/PlatformIcon'
import { ClientAvatar } from '../ClientsTab'

const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'نشط', paused: 'موقوف', ended: 'منتهٍ',
}
const CLIENT_STATUS_VAR: Record<ClientStatus, string> = {
  active: 'var(--success-500)', paused: 'var(--warning-500)', ended: 'var(--fg-3)',
}

interface Props {
  client: Client
  accent: string
  onEdit: () => void
  onClose: () => void
}

/** مساحة عمل العميل: العقد + تقدم الشهر + أعمال الشهر + آخر المنشور + إضافة طلب سريع. */
export default function ClientDrawer({ client, accent, onEdit, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const { addItem } = useContentStore()
  const items = useContentStore(useShallow((s) =>
    s.items.filter((i) => i.projectId === client.projectId && i.clientId === client.id)
  ))

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

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

  const statusColor = CLIENT_STATUS_VAR[client.status]

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 480 }}>

        {/* Header */}
        <div className="relative" style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 16%, transparent), transparent 60%)` }}>
          <div style={{ height: 3, background: accent }} />
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <ClientAvatar client={client} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>{client.name}</h3>
                    <span
                      className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full text-xs font-medium"
                      style={{ background: `color-mix(in oklch, ${statusColor} 15%, transparent)`, color: statusColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                      {CLIENT_STATUS_LABEL[client.status]}
                    </span>
                  </div>
                  {client.contactName && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{client.contactName}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                    <span className="font-semibold axis-num" style={{ color: 'var(--success-500)' }}>
                      {client.contractValue.toLocaleString('en-US')} {client.contractCurrency}
                      <span className="font-normal ms-1" style={{ color: 'var(--fg-3)' }}>/ شهر</span>
                    </span>
                    {quota > 0 && (
                      <span style={{ color: 'var(--fg-3)' }}>
                        <span className="axis-num">{quota}</span> قطعة / شهر
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost" onClick={onEdit} aria-label="تعديل العميل" title="تعديل بيانات العميل">
                  <Edit2 size={14} />
                </button>
                <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost" onClick={close} aria-label="إغلاق">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-6" style={{ paddingTop: 20 }}>

          {/* This month progress */}
          <section>
            <div className="drawer-section__title">تقدم {monthLabel(year, month)}</div>
            <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
                  <span className="axis-num">{done}</span>
                  {quota > 0 && <span className="axis-num" style={{ color: 'var(--fg-3)' }}> / {quota}</span>}
                  <span className="font-normal text-xs ms-1" style={{ color: 'var(--fg-3)' }}>قطعة منجزة</span>
                </span>
                {quota > 0 && (
                  done >= quota
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--success-500)' }}><CheckCircle2 size={13} /> اكتملت الحصة</span>
                    : <span className="axis-num text-xs" style={{ color: accent }}>{pct}%</span>
                )}
              </div>
              {quota > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                  <div className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${pct}%`, background: accent }} />
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: 'var(--fg-3)' }}>
                <span><span className="axis-num">{monthItems.length}</span> مجدول هذا الشهر</span>
                {remainingToSchedule > 0 && <span><span className="axis-num">{remainingToSchedule}</span> متبقٍ للجدولة</span>}
                {requests.length > 0 && (
                  <span style={{ color: 'var(--warning-500)' }}>
                    <span className="axis-num">{requests.length}</span> طلب قيد التنفيذ
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Quick request */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Inbox size={11} /> إضافة طلب من العميل</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="مثال: تصميم إعلان العرض الجديد"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addRequest() }}
                className="flex-1 h-9 rounded-md px-3 text-sm outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
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
          </section>

          {/* This month's works grouped by status */}
          <section>
            <div className="drawer-section__title">أعمال {monthLabel(year, month)}</div>
            {monthItems.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--fg-3)' }}>لا توجد أعمال مجدولة لهذا الشهر بعد</p>
            ) : (
              <div className="space-y-3">
                {STATUS_ORDER.map((status) => {
                  const group = monthItems.filter((i) => i.status === status)
                  if (group.length === 0) return null
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_VAR[status] }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--fg-2)' }}>{STATUS_LABEL[status]}</span>
                        <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{group.length}</span>
                      </div>
                      <div className="space-y-1">
                        {group.map((it) => <WorkRow key={it.id} item={it} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recently published */}
          {published.length > 0 && (
            <section>
              <div className="drawer-section__title">آخر الأعمال المنشورة</div>
              <div className="space-y-1">
                {published.map((it) => <WorkRow key={it.id} item={it} showDate />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkRow({ item, showDate }: { item: ContentItem; showDate?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-2"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_VAR[item.status] }} />
      <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--fg-1)' }}>{item.title}</span>
      {item.source === 'client-request' && (
        <span
          className="px-1.5 rounded-full text-[10px] font-semibold shrink-0"
          style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
        >
          {SOURCE_LABEL['client-request']}
        </span>
      )}
      <span className="text-[10px] shrink-0" style={{ color: 'var(--fg-3)' }}>{TYPE_LABEL[item.type]}</span>
      {item.platform && <PlatformIcon platform={item.platform} size={11} style={{ color: 'var(--fg-3)' }} />}
      {showDate && <span className="num-tabular text-[10px] shrink-0" style={{ color: 'var(--fg-3)' }}>{fmtDayMonth(scheduledKey(item))}</span>}
    </div>
  )
}
