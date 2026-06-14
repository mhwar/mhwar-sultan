'use client'
import { useState, useCallback } from 'react'
import { Plus, Printer, ChevronLeft, X, Trash2, FileSignature, Edit2, CheckCircle2, Clock, XCircle, Circle, type LucideIcon } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Contract, ContractPaymentItem, ContractStatus } from '@/types'
import { useContractStore } from '@/store/store'
import { generateId, now } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: 'مسودة',
  active: 'ساري',
  completed: 'مكتمل',
  expired: 'منتهٍ',
  cancelled: 'ملغى',
}

const STATUS_COLOR: Record<ContractStatus, string> = {
  draft: 'var(--fg-3)',
  active: 'var(--success-500)',
  completed: 'var(--info-500)',
  expired: 'var(--warning-500)',
  cancelled: 'var(--danger-500)',
}

const STATUS_ICON: Record<ContractStatus, LucideIcon> = {
  draft: Circle,
  active: CheckCircle2,
  completed: CheckCircle2,
  expired: Clock,
  cancelled: XCircle,
}

function fmt(n?: number) {
  if (n == null) return '—'
  return n.toLocaleString('en-US')
}

function fmtDate(s?: string) {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return s }
}

const DEFAULT_PAYMENT_SCHEDULE: ContractPaymentItem[] = [
  { label: 'الدفعة الأولى (40%)', amount: 0, percentage: 40, status: 'pending' },
  { label: 'الدفعة الثانية (60%)', amount: 0, percentage: 60, status: 'pending' },
]

function emptyContract(projectId: string): Omit<Contract, 'id' | 'order' | 'createdAt' | 'updatedAt'> {
  return {
    projectId,
    title: '',
    contractType: 'اتفاقية مرافقة تقنية ونمو',
    status: 'draft',
    contractDate: new Date().toISOString().slice(0, 10),
    party1Name: '',
    party1IdNum: '',
    party1Phone: '',
    party1Email: '',
    party1Address: '',
    party2Name: '',
    party2Rep: '',
    party2RegNum: '',
    party2Phone: '',
    party2Email: '',
    party2Address: '',
    monthlyAmount: undefined,
    currency: 'SAR',
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE.map((i) => ({ ...i })),
    startDate: '',
    endDate: '',
    subject: '',
    scope: '',
    workMechanism: '',
    outOfScope: '',
    notes: '',
    signedAt: '',
  }
}

// ── Main component ────────────────────────────────────────

interface Props { project: Project }

export default function ContractsTab({ project }: Props) {
  const pid = project.id
  const contracts = useContractStore(useShallow((s) =>
    s.contracts.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)
  ))
  const { addContract, updateContract, deleteContract } = useContractStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const [draft, setDraft] = useState<Omit<Contract, 'id' | 'order' | 'createdAt' | 'updatedAt'>>(
    emptyContract(pid)
  )

  const openNew = useCallback(() => {
    setDraft(emptyContract(pid))
    setEditingId(null)
    setFormOpen(true)
  }, [pid])

  const openEdit = useCallback((c: Contract) => {
    setDraft({
      projectId: c.projectId,
      title: c.title,
      contractType: c.contractType,
      status: c.status,
      contractDate: c.contractDate ?? '',
      party1Name: c.party1Name ?? '',
      party1IdNum: c.party1IdNum ?? '',
      party1Phone: c.party1Phone ?? '',
      party1Email: c.party1Email ?? '',
      party1Address: c.party1Address ?? '',
      party2Name: c.party2Name ?? '',
      party2Rep: c.party2Rep ?? '',
      party2RegNum: c.party2RegNum ?? '',
      party2Phone: c.party2Phone ?? '',
      party2Email: c.party2Email ?? '',
      party2Address: c.party2Address ?? '',
      monthlyAmount: c.monthlyAmount,
      currency: c.currency,
      paymentSchedule: c.paymentSchedule.length
        ? c.paymentSchedule.map((i) => ({ ...i }))
        : DEFAULT_PAYMENT_SCHEDULE.map((i) => ({ ...i })),
      startDate: c.startDate ?? '',
      endDate: c.endDate ?? '',
      subject: c.subject ?? '',
      scope: c.scope ?? '',
      workMechanism: c.workMechanism ?? '',
      outOfScope: c.outOfScope ?? '',
      notes: c.notes ?? '',
      signedAt: c.signedAt ?? '',
    })
    setEditingId(c.id)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!draft.title.trim()) return
    if (editingId) {
      updateContract(editingId, draft)
    } else {
      addContract(draft)
    }
    setFormOpen(false)
    setEditingId(null)
  }, [draft, editingId, addContract, updateContract])

  const previewContract = previewId ? contracts.find((c) => c.id === previewId) : null

  if (previewContract) {
    return (
      <ContractPreview
        contract={previewContract}
        onClose={() => setPreviewId(null)}
      />
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-1)', margin: 0 }}>العقود والاتفاقيات</h2>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 0' }}>
            {contracts.length > 0 ? `${contracts.length} عقد` : 'لا توجد عقود بعد'}
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--iris-500)', color: '#fff',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          عقد جديد
        </button>
      </div>

      {/* List */}
      {contracts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 0',
          color: 'var(--fg-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <FileSignature size={40} strokeWidth={1} />
          <p style={{ fontSize: 15, margin: 0 }}>أضف أول عقد لهذا المشروع</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contracts.map((c) => {
            const Icon = STATUS_ICON[c.status]
            return (
              <div key={c.id} className="axis-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Icon size={14} style={{ color: STATUS_COLOR[c.status], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: STATUS_COLOR[c.status], fontWeight: 500 }}>
                        {STATUS_LABEL[c.status]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>•</span>
                      <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{c.contractType}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-1)', margin: '0 0 4px' }}>{c.title}</h3>
                    {c.party2Name && (
                      <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '0 0 8px' }}>
                        الطرف الثاني: {c.party2Name}{c.party2Rep ? ` — ${c.party2Rep}` : ''}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {c.monthlyAmount != null && (
                        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                          {fmt(c.monthlyAmount)} {c.currency} / شهر
                        </span>
                      )}
                      {c.contractDate && (
                        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                          {fmtDate(c.contractDate)}
                        </span>
                      )}
                      {c.startDate && (
                        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                          {fmtDate(c.startDate)} — {c.endDate ? fmtDate(c.endDate) : 'مفتوحة'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPreviewId(c.id)}
                      title="معاينة وطباعة"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)',
                        background: 'transparent', color: 'var(--fg-2)',
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      <Printer size={14} />
                      طباعة
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      title="تعديل"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 6,
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    {deleteConfirmId === c.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => { deleteContract(c.id); setDeleteConfirmId(null) }}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: 'none',
                            background: 'var(--danger-500)', color: '#fff', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            padding: '6px 10px', borderRadius: 6,
                            border: '1px solid var(--border-subtle)',
                            background: 'transparent', color: 'var(--fg-2)', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        title="حذف"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: 6,
                          border: '1px solid var(--border-subtle)',
                          background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Sheet */}
      {formOpen && (
        <ContractForm
          draft={draft}
          onChange={setDraft}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
          isEdit={!!editingId}
        />
      )}
    </div>
  )
}

// ── Form sheet ────────────────────────────────────────────

interface FormProps {
  draft: Omit<Contract, 'id' | 'order' | 'createdAt' | 'updatedAt'>
  onChange: (d: Omit<Contract, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void
  onSave: () => void
  onClose: () => void
  isEdit: boolean
}

function ContractForm({ draft, onChange, onSave, onClose, isEdit }: FormProps) {
  const set = <K extends keyof typeof draft>(key: K, val: typeof draft[K]) =>
    onChange({ ...draft, [key]: val })

  const updatePaymentItem = (idx: number, field: keyof ContractPaymentItem, val: string | number) => {
    const schedule = draft.paymentSchedule.map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    )
    set('paymentSchedule', schedule)
  }

  const addPaymentItem = () => {
    set('paymentSchedule', [
      ...draft.paymentSchedule,
      { label: '', amount: 0, status: 'pending' as const },
    ])
  }

  const removePaymentItem = (idx: number) => {
    set('paymentSchedule', draft.paymentSchedule.filter((_, i) => i !== idx))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border-subtle)',
    background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)',
    fontSize: 14, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'var(--fg-2)', marginBottom: 4, display: 'block' }
  const sectionStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20, marginBottom: 20,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 600,
        background: 'var(--color-surface-overlay)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        zIndex: 1,
      }}>
        {/* Sheet header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--color-surface-overlay)', zIndex: 1,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--fg-1)' }}>
            {isEdit ? 'تعديل العقد' : 'عقد جديد'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: 24, flex: 1 }}>

          {/* Basic info */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              معلومات أساسية
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>عنوان العقد *</label>
              <input
                style={inputStyle}
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="مثال: اتفاقية مرافقة تقنية — شركة الأفق"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>نوع العقد</label>
                <input
                  style={inputStyle}
                  value={draft.contractType}
                  onChange={(e) => set('contractType', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>الحالة</label>
                <select
                  style={inputStyle}
                  value={draft.status}
                  onChange={(e) => set('status', e.target.value as ContractStatus)}
                >
                  {(Object.keys(STATUS_LABEL) as ContractStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>تاريخ العقد</label>
              <input
                type="date"
                style={inputStyle}
                value={draft.contractDate ?? ''}
                onChange={(e) => set('contractDate', e.target.value)}
              />
            </div>
          </div>

          {/* Party 1 */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              الطرف الأول (المستشار)
            </p>
            {[
              { label: 'الاسم', key: 'party1Name' as const, placeholder: 'الاسم الكامل' },
              { label: 'رقم الهوية / السجل', key: 'party1IdNum' as const, placeholder: 'رقم الهوية أو السجل التجاري' },
              { label: 'رقم الجوال', key: 'party1Phone' as const, placeholder: '+966' },
              { label: 'البريد الإلكتروني', key: 'party1Email' as const, placeholder: 'email@example.com' },
              { label: 'العنوان', key: 'party1Address' as const, placeholder: 'المدينة، المنطقة' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{label}</label>
                <input
                  style={inputStyle}
                  value={(draft[key] as string) ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* Party 2 */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              الطرف الثاني (العميل)
            </p>
            {[
              { label: 'اسم الشركة / المؤسسة', key: 'party2Name' as const, placeholder: 'الاسم التجاري' },
              { label: 'ممثل الشركة', key: 'party2Rep' as const, placeholder: 'اسم الممثل القانوني' },
              { label: 'رقم السجل التجاري', key: 'party2RegNum' as const, placeholder: 'رقم السجل التجاري' },
              { label: 'رقم الجوال', key: 'party2Phone' as const, placeholder: '+966' },
              { label: 'البريد الإلكتروني', key: 'party2Email' as const, placeholder: 'email@example.com' },
              { label: 'العنوان', key: 'party2Address' as const, placeholder: 'المدينة، المنطقة' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{label}</label>
                <input
                  style={inputStyle}
                  value={(draft[key] as string) ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* Financial */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              الشروط المالية
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>المبلغ الشهري</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={draft.monthlyAmount ?? ''}
                  onChange={(e) => set('monthlyAmount', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={labelStyle}>العملة</label>
                <select
                  style={inputStyle}
                  value={draft.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                </select>
              </div>
            </div>

            <label style={{ ...labelStyle, marginBottom: 8 }}>جدول الدفعات</label>
            {draft.paymentSchedule.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 100px 32px', gap: 8,
                alignItems: 'center', marginBottom: 8,
              }}>
                <input
                  style={inputStyle}
                  value={item.label}
                  onChange={(e) => updatePaymentItem(idx, 'label', e.target.value)}
                  placeholder="وصف الدفعة"
                />
                <input
                  type="number"
                  style={inputStyle}
                  value={item.amount || ''}
                  onChange={(e) => updatePaymentItem(idx, 'amount', Number(e.target.value))}
                  placeholder="المبلغ"
                />
                <select
                  style={inputStyle}
                  value={item.status}
                  onChange={(e) => updatePaymentItem(idx, 'status', e.target.value)}
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="paid">مدفوعة</option>
                </select>
                <button
                  onClick={() => removePaymentItem(idx)}
                  style={{
                    width: 32, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-subtle)', borderRadius: 6,
                    background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addPaymentItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 6,
                border: '1px dashed var(--border-subtle)',
                background: 'transparent', color: 'var(--fg-3)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              إضافة دفعة
            </button>
          </div>

          {/* Duration */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              مدة الاتفاقية
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>تاريخ البدء</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={draft.startDate ?? ''}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>تاريخ الانتهاء (اتركه فارغاً للمفتوحة)</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={draft.endDate ?? ''}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Text sections */}
          <div style={sectionStyle}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              بنود الاتفاقية
            </p>
            {[
              { label: 'موضوع الاتفاقية', key: 'subject' as const, placeholder: 'وصف موجز لموضوع الاتفاقية' },
              { label: 'نطاق العمل', key: 'scope' as const, placeholder: 'الخدمات والمهام المشمولة' },
              { label: 'آلية العمل', key: 'workMechanism' as const, placeholder: 'كيفية تنفيذ العمل والتواصل' },
              { label: 'ما هو خارج النطاق', key: 'outOfScope' as const, placeholder: 'الخدمات غير المشمولة' },
              { label: 'ملاحظات إضافية', key: 'notes' as const, placeholder: 'أي بنود أو ملاحظات أخرى' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{label}</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={(draft[key] as string) ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          position: 'sticky', bottom: 0, background: 'var(--color-surface-overlay)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'transparent', color: 'var(--fg-2)', fontSize: 14, cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            disabled={!draft.title.trim()}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: draft.title.trim() ? 'var(--iris-500)' : 'var(--fg-3)',
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: draft.title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isEdit ? 'حفظ التعديلات' : 'إنشاء العقد'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Contract preview & print ──────────────────────────────

interface PreviewProps {
  contract: Contract
  onClose: () => void
}

function ContractPreview({ contract: c, onClose }: PreviewProps) {
  const totalAmount = c.paymentSchedule.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      {/* Print controls — hidden when printing */}
      <div className="no-print" style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'transparent', color: 'var(--fg-2)', fontSize: 14, cursor: 'pointer',
          }}
        >
          <ChevronLeft size={16} />
          العودة
        </button>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'var(--iris-500)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Printer size={16} />
          طباعة العقد
        </button>
        <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{c.title}</span>
      </div>

      {/* Print area */}
      <div id="contract-print-area" style={{
        fontFamily: '"Noto Sans Arabic", "Segoe UI", Arial, sans-serif',
        direction: 'rtl', textAlign: 'right',
        maxWidth: 800, margin: '0 auto', padding: '40px 48px',
        color: '#1a1a1a', lineHeight: 1.9, fontSize: 14,
      }}>
        {/* Bismillah */}
        <p style={{ textAlign: 'center', fontSize: 18, marginBottom: 8 }}>
          بسم الله الرحمن الرحيم
        </p>

        {/* Title */}
        <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
          {c.contractType || 'اتفاقية مرافقة تقنية ونمو'}
        </h1>
        {c.title && (
          <p style={{ textAlign: 'center', fontSize: 15, color: '#444', margin: '0 0 24px' }}>
            {c.title}
          </p>
        )}

        <hr style={{ margin: '24px 0', borderColor: '#ccc' }} />

        {/* Intro */}
        <p>
          تُبرم هذه الاتفاقية{c.contractDate ? ` بتاريخ ${fmtDate(c.contractDate)}` : ''} بين الطرفين الآتي ذكرهما،
          وذلك وفق الشروط والأحكام المنصوص عليها فيها.
        </p>

        {/* Party 1 */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>الطرف الأول (المستشار)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            {[
              ['الاسم', c.party1Name],
              ['رقم الهوية / السجل', c.party1IdNum],
              ['رقم الجوال', c.party1Phone],
              ['البريد الإلكتروني', c.party1Email],
              ['العنوان', c.party1Address],
            ].filter(([, v]) => v).map(([label, value]) => (
              <tr key={label as string}>
                <td style={{ padding: '4px 0', width: '35%', color: '#555', fontWeight: 500 }}>{label}:</td>
                <td style={{ padding: '4px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Party 2 */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>الطرف الثاني (العميل)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            {[
              ['اسم الشركة / المؤسسة', c.party2Name],
              ['الممثل القانوني', c.party2Rep],
              ['رقم السجل التجاري', c.party2RegNum],
              ['رقم الجوال', c.party2Phone],
              ['البريد الإلكتروني', c.party2Email],
              ['العنوان', c.party2Address],
            ].filter(([, v]) => v).map(([label, value]) => (
              <tr key={label as string}>
                <td style={{ padding: '4px 0', width: '35%', color: '#555', fontWeight: 500 }}>{label}:</td>
                <td style={{ padding: '4px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ margin: '24px 0', borderColor: '#ccc' }} />

        {/* Subject */}
        {c.subject && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>أولاً: موضوع الاتفاقية</h2>
            <p>{c.subject}</p>
          </>
        )}

        {/* Scope */}
        {c.scope && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>ثانياً: نطاق العمل</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{c.scope}</p>
          </>
        )}

        {/* Work mechanism */}
        {c.workMechanism && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>ثالثاً: آلية العمل</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{c.workMechanism}</p>
          </>
        )}

        {/* Out of scope */}
        {c.outOfScope && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>رابعاً: ما هو خارج النطاق</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{c.outOfScope}</p>
          </>
        )}

        {/* Financial */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>
          {c.outOfScope ? 'خامساً' : c.workMechanism ? 'رابعاً' : c.scope ? 'ثالثاً' : 'ثانياً'}: الشروط المالية
        </h2>
        {c.monthlyAmount != null && (
          <p>
            يتفق الطرفان على أن تكون قيمة الخدمات الشهرية{' '}
            <strong>{fmt(c.monthlyAmount)} {c.currency}</strong> شهرياً.
          </p>
        )}
        {c.paymentSchedule.length > 0 && (
          <>
            <p>يُسدَّد المبلغ وفق الجدول التالي:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 16px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right' }}>الدفعة</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right' }}>المبلغ</th>
                  {c.paymentSchedule.some((i) => i.percentage) && (
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right' }}>النسبة</th>
                  )}
                  <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {c.paymentSchedule.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{item.label}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{fmt(item.amount)} {c.currency}</td>
                    {c.paymentSchedule.some((i) => i.percentage) && (
                      <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>
                        {item.percentage != null ? `${item.percentage}%` : '—'}
                      </td>
                    )}
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>
                      {item.status === 'paid' ? 'مدفوعة' : 'قيد الانتظار'}
                    </td>
                  </tr>
                ))}
                {totalAmount > 0 && (
                  <tr style={{ fontWeight: 700, background: '#f9f9f9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>الإجمالي</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{fmt(totalAmount)} {c.currency}</td>
                    {c.paymentSchedule.some((i) => i.percentage) && (
                      <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>100%</td>
                    )}
                    <td style={{ padding: '6px 8px', border: '1px solid #ddd' }} />
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Duration */}
        {(c.startDate || c.endDate) && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>مدة الاتفاقية</h2>
            <p>
              تسري هذه الاتفاقية {c.startDate ? `ابتداءً من ${fmtDate(c.startDate)}` : ''}
              {c.endDate ? ` وحتى ${fmtDate(c.endDate)}` : ' لمدة غير محددة'}،
              {' '}وتُجدَّد بالتراضي بين الطرفين.
            </p>
          </>
        )}

        {/* Additional notes */}
        {c.notes && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>ملاحظات وبنود إضافية</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{c.notes}</p>
          </>
        )}

        <hr style={{ margin: '32px 0', borderColor: '#ccc' }} />

        {/* Fixed clauses */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>السرية وحماية المعلومات</h2>
        <p>
          يلتزم الطرفان بالحفاظ على سرية جميع المعلومات والبيانات التي يطّلعان عليها بموجب
          هذه الاتفاقية، وعدم إفشائها لأي طرف ثالث بأي وسيلة كانت إلا بموافقة خطية مسبقة
          من الطرف الآخر، ويستمر هذا الالتزام سارياً لمدة ثلاث سنوات بعد انتهاء الاتفاقية.
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>الملكية الفكرية</h2>
        <p>
          تظل حقوق الملكية الفكرية لأي عمل أو مخرجات يُنتجها الطرف الأول حكراً عليه ما لم
          يُتفق صراحةً على خلاف ذلك كتابةً. تُمنح حقوق الاستخدام للطرف الثاني عند استيفاء
          كامل الالتزامات المالية المترتبة على هذه الاتفاقية.
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>حدود المسؤولية</h2>
        <p>
          لا يتحمل الطرف الأول أي مسؤولية عن الأضرار غير المباشرة أو التبعية أو الخسائر التجارية
          الناجمة عن استخدام أو عدم استخدام الخدمات المقدمة بموجب هذه الاتفاقية. وتقتصر مسؤوليته
          في جميع الأحوال على المبالغ المدفوعة فعلياً خلال الأشهر الثلاثة الأخيرة.
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>القوة القاهرة</h2>
        <p>
          لا يُعدّ أيٌّ من الطرفين مخلاً بالتزاماته إذا كان التأخر أو الإخفاق ناجماً عن ظروف
          خارجة عن إرادته، كالكوارث الطبيعية أو الأوبئة أو قرارات حكومية طارئة، شريطة إخطار
          الطرف الآخر فوراً وبذل أقصى الجهود للتغلب على تلك الظروف.
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>أحكام عامة</h2>
        <p>
          تُحكم هذه الاتفاقية وتُفسَّر وفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية.
          أي نزاع ينشأ عن هذه الاتفاقية يُحال أولاً إلى التفاوض المباشر، فإن تعذّر ذلك خلال
          ثلاثين يوماً، يُحال إلى الجهات القضائية المختصة. لا يُعدّ تنازل أحد الطرفين عن حق
          من حقوقه تنازلاً عن حقوق مستقبلية. إن أُعلنت أي بند لاغياً فلا يؤثر ذلك على سائر
          بنود الاتفاقية.
        </p>

        <hr style={{ margin: '40px 0 32px', borderColor: '#ccc' }} />

        {/* Signatures */}
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 24px', textAlign: 'center' }}>التوقيعات</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>الطرف الأول</p>
            <p style={{ color: '#555', marginBottom: 4 }}>{c.party1Name || '___________________________'}</p>
            {c.party1IdNum && <p style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>هوية: {c.party1IdNum}</p>}
            <div style={{ marginTop: 32, borderTop: '1px solid #999', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: '#999' }}>التوقيع</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: '#555' }}>التاريخ: ___________________</p>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>الطرف الثاني</p>
            <p style={{ color: '#555', marginBottom: 4 }}>{c.party2Name || '___________________________'}</p>
            {c.party2Rep && <p style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>الممثل: {c.party2Rep}</p>}
            {c.party2RegNum && <p style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>السجل: {c.party2RegNum}</p>}
            <div style={{ marginTop: 32, borderTop: '1px solid #999', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: '#999' }}>التوقيع والختم</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: '#555' }}>التاريخ: ___________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body > *:not(#__next) { display: none !important; }
          .no-print { display: none !important; }
          #contract-print-area {
            display: block !important;
            max-width: 100% !important;
            padding: 20mm 25mm !important;
            font-size: 13pt !important;
            color: #000 !important;
          }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>
    </div>
  )
}
