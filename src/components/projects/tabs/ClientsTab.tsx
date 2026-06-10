'use client'
import { useRef, useMemo, useState } from 'react'
import { Plus, Trash2, Check, X, Building2, Mail, Phone, FileText, ChevronLeft, Image, Edit2, Upload } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Client, ClientStatus } from '@/types'
import { useClientStore } from '@/store/store'
import { formatDateShort } from '@/lib/utils'
import ClientPage from './clients/ClientPage'
import { buildClientColorMap } from './content/contentMeta'

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'نشط', paused: 'موقوف', ended: 'منتهٍ',
}
const STATUS_VAR: Record<ClientStatus, string> = {
  active: 'var(--success-500)', paused: 'var(--warning-500)', ended: 'var(--fg-3)',
}

function fmt(n: number) { return n.toLocaleString('en-US') }

/** Initials from a name string (up to 2 chars). */
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface Props { project: Project }

export default function ClientsTab({ project }: Props) {
  const pid = project.id
  const clients = useClientStore(useShallow((s) =>
    s.clients.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)
  ))
  const { addClient, updateClient, deleteClient } = useClientStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const active = clients.filter((c) => c.status === 'active')
  const totalValue = active.reduce((s, c) => s + c.contractValue, 0)
  const currency = active[0]?.contractCurrency ?? clients[0]?.contractCurrency ?? 'SAR'
  const clientColorMap = useMemo(() => buildClientColorMap(clients.map((c) => c.id)), [clients])
  const openClient = openId ? clients.find((c) => c.id === openId) : undefined

  if (openClient) {
    return (
      <ClientPage
        client={openClient}
        project={project}
        accent={clientColorMap[openClient.id] ?? 'var(--iris-500)'}
        onClose={() => setOpenId(null)}
        onEdit={() => { setOpenId(null); setEditingId(openClient.id) }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard label="إجمالي العملاء" value={String(clients.length)} sub="عميل" color="var(--iris-500)" />
          <SummaryCard label="عملاء نشطون" value={String(active.length)} sub="عميل" color="var(--success-500)" />
          <SummaryCard label="قيمة العقود الشهرية" value={fmt(totalValue)} sub={currency} color="var(--warning-500)" />
        </div>
      )}

      <div className="axis-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>العملاء</h2>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> إضافة عميل
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map((c) =>
            editingId === c.id
              ? <ClientForm key={c.id} initial={c} onSave={(d) => { updateClient(c.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
              : (
                <ClientCard
                  key={c.id}
                  client={c}
                  deleteConfirm={deleteConfirmId === c.id}
                  onOpen={() => setOpenId(c.id)}
                  onEdit={() => setEditingId(c.id)}
                  onDeleteRequest={() => setDeleteConfirmId(c.id)}
                  onDeleteConfirm={() => { deleteClient(c.id); setDeleteConfirmId(null) }}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                />
              )
          )}
          {adding && (
            <ClientForm
              onSave={(d) => { addClient({ ...d, projectId: pid }); setAdding(false) }}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>

        {clients.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Building2 size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا يوجد عملاء بعد</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>أضف عملاءك وتفاصيل عقودهم</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="axis-num text-xl font-bold" style={{ color }}>
        {value} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>
      </p>
    </div>
  )
}

/** Avatar: logo image if available, else colored initials circle. */
export function ClientAvatar({ client, size = 40 }: { client: { name: string; logo?: string }; size?: number }) {
  const [err, setErr] = useState(false)
  if (client.logo && !err) {
    return (
      <img
        src={client.logo}
        alt={client.name}
        onError={() => setErr(true)}
        className="rounded-xl object-contain bg-white"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 font-bold select-none"
      style={{
        width: size, height: size,
        background: 'color-mix(in oklch, var(--iris-500) 15%, transparent)',
        color: 'var(--iris-500)',
        fontSize: size * 0.35,
      }}
    >
      {initials(client.name)}
    </div>
  )
}

interface ClientCardProps {
  client: Client
  deleteConfirm: boolean
  onOpen: () => void
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function ClientCard({ client: c, deleteConfirm, onOpen, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: ClientCardProps) {
  const statusColor = STATUS_VAR[c.status]
  return (
    <div
      className="group relative rounded-xl p-4 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={!deleteConfirm ? onOpen : undefined}
    >
      <div className="flex items-start gap-3">
        <ClientAvatar client={c} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
            <span
              className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full text-xs font-medium"
              style={{ background: `color-mix(in oklch, ${statusColor} 15%, transparent)`, color: statusColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
              {STATUS_LABEL[c.status]}
            </span>
          </div>
          {c.contactName && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{c.contactName}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {c.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{c.email}</span>}
            {c.phone && <span className="inline-flex items-center gap-1 num-tabular"><Phone size={11} />{c.phone}</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
            <span className="font-semibold axis-num" style={{ color: 'var(--success-500)' }}>
              {c.contractValue.toLocaleString('en-US')} {c.contractCurrency}
              <span className="font-normal ms-1" style={{ color: 'var(--color-text-muted)' }}>/ شهر</span>
            </span>
            {c.deliverableCount !== undefined && c.deliverableCount > 0 && (
              <span style={{ color: 'var(--color-text-muted)' }}>
                <span className="axis-num">{c.deliverableCount}</span> قطعة / شهر
              </span>
            )}
          </div>
          {(c.contractStart || c.contractEnd) && (
            <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <FileText size={11} />
              {c.contractStart && formatDateShort(c.contractStart)}
              {c.contractStart && c.contractEnd && <ChevronLeft size={10} />}
              {c.contractEnd && formatDateShort(c.contractEnd)}
            </div>
          )}
          {c.notes && <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{c.notes}</p>}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {deleteConfirm ? (
            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onDeleteConfirm}
                className="flex items-center gap-1 px-2 h-6 rounded text-xs font-semibold"
                style={{ background: 'color-mix(in oklch, var(--danger-500) 15%, transparent)', color: 'var(--danger-500)', border: '1px solid color-mix(in oklch, var(--danger-500) 30%, transparent)' }}
              >
                <Trash2 size={10} /> نعم، احذف
              </button>
              <button
                onClick={onDeleteCancel}
                className="flex items-center gap-1 px-2 h-6 rounded text-xs"
                style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
              >
                <X size={10} /> إلغاء
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
                style={{ color: 'var(--color-text-muted)' }}
                title="تعديل"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest() }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
                style={{ color: 'var(--danger-500)' }}
                title="حذف"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties

type ClientFormData = Omit<Client, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'projectId'>

function ClientForm({ initial, onSave, onCancel }: { initial?: Client; onSave: (d: ClientFormData) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [logo, setLogo] = useState(initial?.logo ?? '')
  const [contactName, setContactName] = useState(initial?.contactName ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [contractValue, setContractValue] = useState(initial ? String(initial.contractValue) : '')
  const [contractCurrency, setContractCurrency] = useState(initial?.contractCurrency ?? 'SAR')
  const [contractStart, setContractStart] = useState(initial?.contractStart ? initial.contractStart.slice(0, 10) : '')
  const [contractEnd, setContractEnd] = useState(initial?.contractEnd ? initial.contractEnd.slice(0, 10) : '')
  const [deliverableCount, setDeliverableCount] = useState(initial?.deliverableCount !== undefined ? String(initial.deliverableCount) : '')
  const [status, setStatus] = useState<ClientStatus>(initial?.status ?? 'active')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [logoErr, setLogoErr] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') {
        setLogo(result)
        setLogoErr(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    if (!name.trim()) return
    onSave({
      name,
      logo: logo.trim() || undefined,
      contactName: contactName || undefined,
      phone: phone || undefined,
      email: email || undefined,
      contractValue: parseFloat(contractValue) || 0,
      contractCurrency,
      contractStart: contractStart ? new Date(contractStart).toISOString() : undefined,
      contractEnd: contractEnd ? new Date(contractEnd).toISOString() : undefined,
      deliverableCount: deliverableCount ? parseInt(deliverableCount) : undefined,
      status,
      notes: notes || undefined,
    })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      {/* Logo preview + file upload */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)' }}
        >
          {logo && !logoErr ? (
            <img src={logo} alt="logo" className="w-full h-full object-contain" onError={() => setLogoErr(true)} />
          ) : (
            <Image size={20} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="axis-label block">الشعار</label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors"
              style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              <Upload size={12} /> رفع شعار
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => { setLogo(''); setLogoErr(false) }}
                className="flex items-center gap-1 px-2 h-8 rounded-md text-xs transition-colors"
                style={{ color: 'var(--danger-500)', border: '1px solid color-mix(in oklch, var(--danger-500) 30%, transparent)' }}
                title="حذف الشعار"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>PNG أو SVG أو JPG</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">اسم العميل</label>
          <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: شركة الأفق" autoFocus />
        </div>
        <div>
          <label className="axis-label mb-1 block">جهة التواصل</label>
          <input className={inputCls} style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="اسم المسؤول" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">البريد الإلكتروني</label>
          <input className={inputCls} style={inputStyle} dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="axis-label mb-1 block">الجوال</label>
          <input className={inputCls} style={inputStyle} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="axis-label mb-1 block">قيمة العقد / شهر</label>
          <input type="number" className={inputCls} style={inputStyle} value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="axis-label mb-1 block">العملة</label>
          <input className={inputCls} style={inputStyle} value={contractCurrency} onChange={(e) => setContractCurrency(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">قطع / شهر</label>
          <input type="number" className={inputCls} style={inputStyle} value={deliverableCount} onChange={(e) => setDeliverableCount(e.target.value)} placeholder="0" />
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
          {(Object.keys(STATUS_LABEL) as ClientStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="axis-label mb-1 block">ملاحظات</label>
        <input className={inputCls} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
      </div>
      <div className="flex gap-2 pt-1">
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
