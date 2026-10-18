'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'

type EntryStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
type EntryType = 'payables' | 'receivables'
type FinancialEntry = Payable | Receivable

interface Payable {
  id: string
  description: string
  amount: string
  dueDate: string
  paymentDate?: string
  status: EntryStatus
  category?: string
  supplier?: string
  paymentMethod?: string
  notes?: string
}

interface Receivable {
  id: string
  description: string
  amount: string
  dueDate: string
  paymentDate?: string
  status: EntryStatus
  clientName?: string
  saleNumber?: string
  client?: { name: string }
  sale?: { saleNumber: string }
  paymentMethod?: string
  notes?: string
}

const statusInfo = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  paid: { label: 'Pago', variant: 'success' as const },
  overdue: { label: 'Vencido', variant: 'destructive' as const },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const },
}

const paymentMethods = {
  pix: 'Pix',
  bank_transfer: 'Transferencia',
  credit_card: 'Cartao credito',
  debit_card: 'Cartao debito',
  cash: 'Dinheiro',
  check: 'Cheque',
}

const blankForm = {
  description: '',
  amount: '',
  dueDate: '',
  category: '',
  supplier: '',
  clientName: '',
  paymentMethod: 'pix',
  notes: '',
}

const todayInput = () => new Date().toISOString().slice(0, 10)

export default function FinancialPage() {
  const [payables, setPayables] = useState<Payable[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [activeTab, setActiveTab] = useState<EntryType>('receivables')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [settlement, setSettlement] = useState<{
    type: EntryType
    entry: FinancialEntry
    paymentMethod: keyof typeof paymentMethods
    paymentDate: string
    notes: string
  } | null>(null)
  const [form, setForm] = useState(blankForm)
  const router = useRouter()

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [payablesResponse, receivablesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/payables?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/receivables?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (payablesResponse.status === 401 || receivablesResponse.status === 401 || payablesResponse.status === 403 || receivablesResponse.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (payablesResponse.ok) {
        const data = await payablesResponse.json()
        setPayables(data.payables || [])
      }

      if (receivablesResponse.ok) {
        const data = await receivablesResponse.json()
        setReceivables(data.receivables || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string | number) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'Sem data'

  const isOverdue = (dueDate: string, status: EntryStatus) => {
    if (status !== 'pending') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dueDate) < today
  }

  const receivableClient = (entry: Receivable) => entry.clientName || entry.client?.name || 'Cliente nao informado'
  const receivableSale = (entry: Receivable) => entry.saleNumber || entry.sale?.saleNumber || 'Manual'

  const totals = useMemo(() => {
    const pendingIn = receivables.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidIn = receivables.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const pendingOut = payables.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidOut = payables.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return [
      { title: 'A receber', value: formatCurrency(pendingIn), note: 'Entradas pendentes', tone: 'in' },
      { title: 'Recebido', value: formatCurrency(paidIn), note: 'Entradas confirmadas', tone: 'in' },
      { title: 'A pagar', value: formatCurrency(pendingOut), note: 'Custos pendentes', tone: 'out' },
      { title: 'Lucro realizado', value: formatCurrency(paidIn - paidOut), note: 'Recebido menos pago', tone: 'balance' },
    ]
  }, [payables, receivables])

  const filteredPayables = payables.filter((payable) => {
    const query = searchTerm.toLowerCase()
    return (
      payable.description.toLowerCase().includes(query) ||
      (payable.supplier || '').toLowerCase().includes(query) ||
      (payable.category || '').toLowerCase().includes(query)
    )
  })

  const filteredReceivables = receivables.filter((receivable) => {
    const query = searchTerm.toLowerCase()
    return (
      receivable.description.toLowerCase().includes(query) ||
      receivableClient(receivable).toLowerCase().includes(query) ||
      receivableSale(receivable).toLowerCase().includes(query)
    )
  })

  const createEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('token')
    const payload = {
      description: form.description,
      amount: Number(form.amount || 0),
      dueDate: form.dueDate,
      category: form.category,
      supplier: form.supplier,
      paymentMethod: form.paymentMethod,
      notes: activeTab === 'receivables'
        ? [form.clientName && `Cliente: ${form.clientName}`, form.notes].filter(Boolean).join(' | ')
        : form.notes,
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/${activeTab}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const entry = await response.json()
      if (activeTab === 'payables') setPayables((current) => [entry, ...current])
      if (activeTab === 'receivables') setReceivables((current) => [{ ...entry, clientName: form.clientName }, ...current])
      setForm(blankForm)
      setShowForm(false)
    }

    setSaving(false)
  }

  const updateEntry = async (type: EntryType, id: string, patch: Record<string, unknown>) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/${type}/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      const updated = await response.json()
      if (type === 'payables') setPayables((current) => current.map((item) => (item.id === id ? updated : item)))
      if (type === 'receivables') setReceivables((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
    }
  }

  const openSettlement = (type: EntryType, entry: FinancialEntry) => {
    setSettlement({
      type,
      entry,
      paymentMethod: (entry.paymentMethod as keyof typeof paymentMethods) || 'pix',
      paymentDate: todayInput(),
      notes: '',
    })
  }

  const settleEntry = async () => {
    if (!settlement) return

    const token = localStorage.getItem('token')
    const { type, entry, paymentMethod, paymentDate, notes } = settlement
    const action = type === 'payables' ? 'pay' : 'receive'
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/${type}/${entry.id}/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod, paymentDate, notes }),
    })

    if (response.ok) {
      const updated = await response.json()
      if (type === 'payables') setPayables((current) => current.map((item) => (item.id === entry.id ? updated : item)))
      if (type === 'receivables') setReceivables((current) => current.map((item) => (item.id === entry.id ? { ...item, ...updated } : item)))
      setSettlement(null)
    }
  }

  const deleteEntry = async (type: EntryType, id: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/${type}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      if (type === 'payables') setPayables((current) => current.filter((item) => item.id !== id))
      if (type === 'receivables') setReceivables((current) => current.filter((item) => item.id !== id))
    }
  }

  const renderStatus = (status: EntryStatus, dueDate: string) => {
    const current = isOverdue(dueDate, status) ? statusInfo.overdue : statusInfo[status]
    return <Badge variant={current.variant}>{current.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando financeiro...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">Controle financeiro JV</p>
            <h1 className="page-title">Financeiro</h1>
            <p className="page-subtitle">
              Controle recebimentos de projetos, mensalidades, despesas de ferramentas, hospedagem e pagamentos da operacao.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setShowForm((current) => !current)}>
            <Plus size={17} />
            Novo lancamento
          </button>
        </div>
      </section>

      <section className="workflow-strip">
        <button type="button" onClick={() => router.push('/dashboard/products')}>1. Servicos</button>
        <button type="button" onClick={() => router.push('/dashboard/leads')}>2. Comercial</button>
        <button type="button" onClick={() => router.push('/dashboard/contracts')}>3. Contratos</button>
        <button type="button" onClick={() => router.push('/dashboard/projects')}>4. Projetos</button>
        <button type="button" className="active">5. Financeiro</button>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Fluxo FI-AR/FI-AP</strong>
          <div><span>FBL5N - FBL1N - F-28 - F-53</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['VF01', 'Fatura', 'Origem comercial'],
            ['FBL5N', 'A receber', 'Titulo cliente'],
            ['F-28', 'Baixa cliente', 'Recebimento'],
            ['FBL1N', 'A pagar', 'Titulo fornecedor'],
            ['F-53', 'Baixa fornecedor', 'Pagamento'],
          ].map(([step, id, text]) => (
            <article key={step}>
              <span>{step}</span>
              <strong>{id}</strong>
              <p>{text}</p>
              <small>Integrado</small>
            </article>
          ))}
        </div>
      </section>

      <section className="metrics-grid">
        {totals.map((item) => (
          <article className="sap-card metric-card" key={item.title}>
            <div className="metric-top">
              <span>{item.title}</span>
              <span className="metric-icon">
                <DollarSign size={18} />
              </span>
            </div>
            <div className="metric-value">{item.value}</div>
            <div className="metric-note">{item.note}</div>
          </article>
        ))}
      </section>

      <section className="sap-card panel">
        <div className="panel-header toolbar">
          <div className="auth-switch" style={{ margin: 0, maxWidth: '28rem' }}>
            <button type="button" onClick={() => setActiveTab('receivables')} className={activeTab === 'receivables' ? 'auth-switch-button active' : 'auth-switch-button'}>
              Recebimentos
            </button>
            <button type="button" onClick={() => setActiveTab('payables')} className={activeTab === 'payables' ? 'auth-switch-button active' : 'auth-switch-button'}>
              Custos
            </button>
          </div>

          <div className="search-box">
            <Search />
            <input
              className="search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar lancamento..."
            />
          </div>
        </div>

        {showForm && (
          <form className="panel-body site-form-grid border-b" onSubmit={createEntry}>
            <label className="auth-field md:col-span-2">
              <span className="auth-label">Descricao</span>
              <input className="auth-input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>
            <label className="auth-field">
              <span className="auth-label">Valor</span>
              <input className="auth-input" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
            </label>
            <label className="auth-field">
              <span className="auth-label">Vencimento</span>
              <input className="auth-input" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
            </label>
            {activeTab === 'payables' ? (
              <>
                <label className="auth-field">
                  <span className="auth-label">Categoria</span>
                  <input className="auth-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Hospedagem, software, internet..." />
                </label>
                <label className="auth-field">
                  <span className="auth-label">Fornecedor</span>
                  <input className="auth-input" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
                </label>
              </>
            ) : (
              <label className="auth-field md:col-span-2">
                <span className="auth-label">Cliente</span>
                <input className="auth-input" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} />
              </label>
            )}
            <label className="auth-field">
              <span className="auth-label">Forma prevista</span>
              <select className="auth-input" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
                {Object.entries(paymentMethods).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="auth-field md:col-span-2">
              <span className="auth-label">Observacao</span>
              <input className="auth-input" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Plus size={17} />
              {saving ? 'Salvando...' : 'Salvar lancamento'}
            </button>
          </form>
        )}

        <div className="panel-body">
          <div className="toolbar mb-4">
            <div>
              <h2 className="panel-title">{activeTab === 'receivables' ? 'Entradas de dinheiro' : 'Saidas de dinheiro'}</h2>
              <p className="panel-subtitle">
                {activeTab === 'receivables'
                  ? 'Receba parcelas, contratos e projetos somente apos confirmar a baixa.'
                  : 'Controle custos com fornecedor, vencimento, metodo previsto e comprovacao da baixa.'}
              </p>
            </div>
          </div>

          <div className="data-card-list">
            {activeTab === 'receivables' && filteredReceivables.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum recebimento encontrado</div>}
            {activeTab === 'payables' && filteredPayables.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum custo encontrado</div>}

            {activeTab === 'receivables' && filteredReceivables.map((entry) => (
              <article className="data-card" key={entry.id}>
                <div className="toolbar">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">{entry.description}</h3>
                      {renderStatus(entry.status, entry.dueDate)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{receivableClient(entry)} - {receivableSale(entry)}</p>
                  </div>
                  <strong className="text-xl text-green-600">{formatCurrency(entry.amount)}</strong>
                </div>

                <div className="financial-entry-grid">
                  <span><Calendar className="h-4 w-4" /> Vence {formatDate(entry.dueDate)}</span>
                  <span><ShieldCheck className="h-4 w-4" /> Recebido: {entry.paymentDate ? formatDate(entry.paymentDate) : 'Ainda nao'}</span>
                  <span><CreditCard className="h-4 w-4" /> Metodo: {entry.paymentMethod ? paymentMethods[entry.paymentMethod as keyof typeof paymentMethods] : 'Nao informado'}</span>
                </div>

                <div className="flex gap-2 flex-wrap mt-4">
                  {entry.status !== 'paid' && (
                    <button className="btn btn-primary" type="button" onClick={() => openSettlement('receivables', entry)}>
                      <CheckCircle2 size={16} />
                      Receber
                    </button>
                  )}
                  <button className="btn btn-secondary" type="button" onClick={() => updateEntry('receivables', entry.id, { status: 'cancelled' })}>
                    <XCircle size={16} />
                    Cancelar
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => deleteEntry('receivables', entry.id)}>
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </article>
            ))}

            {activeTab === 'payables' && filteredPayables.map((entry) => (
              <article className="data-card" key={entry.id}>
                <div className="toolbar">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Receipt className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-bold text-gray-900">{entry.description}</h3>
                      {renderStatus(entry.status, entry.dueDate)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.supplier || 'Fornecedor nao informado'} - {entry.category || 'Sem categoria'}</p>
                  </div>
                  <strong className="text-xl text-red-600">{formatCurrency(entry.amount)}</strong>
                </div>

                <div className="financial-entry-grid">
                  <span><Calendar className="h-4 w-4" /> Vence {formatDate(entry.dueDate)}</span>
                  <span><ShieldCheck className="h-4 w-4" /> Pago: {entry.paymentDate ? formatDate(entry.paymentDate) : 'Ainda nao'}</span>
                  <span><CreditCard className="h-4 w-4" /> Metodo: {entry.paymentMethod ? paymentMethods[entry.paymentMethod as keyof typeof paymentMethods] : 'Nao informado'}</span>
                </div>

                <div className="flex gap-2 flex-wrap mt-4">
                  {entry.status !== 'paid' && (
                    <button className="btn btn-primary" type="button" onClick={() => openSettlement('payables', entry)}>
                      <CheckCircle2 size={16} />
                      Pagar
                    </button>
                  )}
                  <button className="btn btn-secondary" type="button" onClick={() => updateEntry('payables', entry.id, { status: 'cancelled' })}>
                    <XCircle size={16} />
                    Cancelar
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => deleteEntry('payables', entry.id)}>
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {settlement && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="settlement-modal">
            <div className="settlement-modal-header">
              <div>
                <p className="eyebrow">{settlement.type === 'payables' ? 'Confirmar pagamento' : 'Confirmar recebimento'}</p>
                <h2>{settlement.entry.description}</h2>
              </div>
              <button className="btn btn-secondary btn-icon" type="button" onClick={() => setSettlement(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="settlement-summary">
              <div>
                <span>Valor</span>
                <strong>{formatCurrency(settlement.entry.amount)}</strong>
              </div>
              <div>
                <span>Vencimento</span>
                <strong>{formatDate(settlement.entry.dueDate)}</strong>
              </div>
              <div>
                <span>Status atual</span>
                <strong>{statusInfo[settlement.entry.status].label}</strong>
              </div>
            </div>

            <div className="site-form-grid">
              <label className="auth-field">
                <span className="auth-label">Forma de pagamento</span>
                <select
                  className="auth-input"
                  value={settlement.paymentMethod}
                  onChange={(event) => setSettlement({ ...settlement, paymentMethod: event.target.value as keyof typeof paymentMethods })}
                >
                  {Object.entries(paymentMethods).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="auth-field">
                <span className="auth-label">{settlement.type === 'payables' ? 'Data do pagamento' : 'Data do recebimento'}</span>
                <input
                  className="auth-input"
                  type="date"
                  value={settlement.paymentDate}
                  onChange={(event) => setSettlement({ ...settlement, paymentDate: event.target.value })}
                />
              </label>
              <label className="auth-field md:col-span-2">
                <span className="auth-label">Observacao / comprovante</span>
                <textarea
                  className="auth-input"
                  rows={3}
                  value={settlement.notes}
                  onChange={(event) => setSettlement({ ...settlement, notes: event.target.value })}
                  placeholder="Ex: pago via Pix, comprovante enviado, banco usado, observacao interna..."
                />
              </label>
            </div>

            <div className="settlement-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setSettlement(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="button" onClick={settleEntry}>
                <CheckCircle2 size={17} />
                {settlement.type === 'payables' ? 'Confirmar pagamento' : 'Confirmar recebimento'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
