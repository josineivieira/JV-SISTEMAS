'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Copy, CreditCard, FileText, PauseCircle, Plus, RefreshCw, Save, WalletCards, XCircle } from 'lucide-react'

type ContractStatus = 'active' | 'paused' | 'late' | 'cancelled'

interface Contract {
  id: string
  clientName: string
  title: string
  recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time'
  amount: string
  nextBillingDate?: string
  status: ContractStatus
  notes?: string
}

const statusInfo = {
  active: { label: 'Ativo', variant: 'success' as const, icon: CreditCard },
  paused: { label: 'Pausado', variant: 'warning' as const, icon: PauseCircle },
  late: { label: 'Em atraso', variant: 'destructive' as const, icon: XCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
}

const recurrenceLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  one_time: 'Unico',
}

const blankForm = {
  clientName: '',
  title: 'Suporte e manutencao',
  recurrence: 'monthly',
  amount: '',
  nextBillingDate: '',
  notes: '',
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [form, setForm] = useState(blankForm)
  const [showForm, setShowForm] = useState(false)
  const [contractDocument, setContractDocument] = useState<{ title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!response.ok) {
        console.error('Erro ao carregar contratos:', response.status)
        return
      }

      const data = await response.json()
      setContracts(data.contracts || [])
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = useMemo(() => {
    const activeContracts = contracts.filter((contract) => contract.status === 'active')
    const monthlyRevenue = activeContracts.reduce((total, contract) => {
      const amount = Number(contract.amount || 0)
      if (contract.recurrence === 'yearly') return total + amount / 12
      if (contract.recurrence === 'quarterly') return total + amount / 3
      if (contract.recurrence === 'one_time') return total
      return total + amount
    }, 0)

    return [
      { title: 'Contratos ativos', value: activeContracts.length, note: 'Clientes recorrentes' },
      { title: 'Receita mensal', value: monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), note: 'Estimativa recorrente' },
      { title: 'Atrasados', value: contracts.filter((contract) => contract.status === 'late').length, note: 'Precisa cobrar' },
      { title: 'Pausados', value: contracts.filter((contract) => contract.status === 'paused').length, note: 'Acompanhar retorno' },
    ]
  }, [contracts])

  const createContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount || 0),
        nextBillingDate: form.nextBillingDate || null,
      }),
    })

    if (response.ok) {
      const contract = await response.json()
      setContracts((current) => [contract, ...current])
      setForm(blankForm)
      setShowForm(false)
    }

    setSaving(false)
  }

  const updateContract = async (id: string, patch: Partial<Contract>) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      const contract = await response.json()
      setContracts((current) => current.map((item) => (item.id === id ? contract : item)))
    }
  }

  const generateReceivable = async (id: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}/receivable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      setContracts((current) => current.map((item) => (item.id === id ? data.contract : item)))
    }
  }

  const generateDocument = async (id: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}/document`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      setContractDocument(await response.json())
    }
  }

  const copyDocument = async () => {
    if (contractDocument) {
      await navigator.clipboard.writeText(contractDocument.content)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">Receita recorrente</p>
            <h1 className="page-title">Contratos e mensalidades</h1>
            <p className="page-subtitle">
              Cadastre suporte, manutencao, hospedagem, automacoes e planos mensais para nao perder cobrança.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setShowForm((current) => !current)}>
            <Plus size={17} />
            Novo contrato
          </button>
        </div>
      </section>

      <section className="workflow-strip">
        <button type="button" onClick={() => router.push('/dashboard/products')}>1. Servicos</button>
        <button type="button" onClick={() => router.push('/dashboard/leads')}>2. Comercial</button>
        <button type="button" className="active">3. Contratos</button>
        <button type="button" onClick={() => router.push('/dashboard/projects')}>4. Projetos</button>
        <button type="button" onClick={() => router.push('/dashboard/financial')}>5. Financeiro</button>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Fluxo VA41 - receita recorrente</strong>
          <div><span>Contrato vira cobranca e contas a receber</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['VA41', 'Contrato', 'Recorrencia e valor'],
            ['VF04', 'Plano faturamento', 'Competencia'],
            ['VF01', 'Fatura', 'Documento de venda'],
            ['FBL5N', 'Titulo', 'Contas a receber'],
            ['F-28', 'Baixa', 'Recebimento'],
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
        {metrics.map((metric) => (
          <article className="sap-card metric-card" key={metric.title}>
            <div className="metric-top">
              <span>{metric.title}</span>
              <span className="metric-icon">
                <RefreshCw size={18} />
              </span>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">{metric.note}</div>
          </article>
        ))}
      </section>

      {showForm && (
        <form className="sap-card panel-body site-form-grid" onSubmit={createContract}>
          <label className="auth-field">
            <span className="auth-label">Cliente</span>
            <input className="auth-input" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Contrato</span>
            <input className="auth-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Recorrencia</span>
            <select className="auth-input" value={form.recurrence} onChange={(event) => setForm({ ...form, recurrence: event.target.value })}>
              {Object.entries(recurrenceLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            <span className="auth-label">Valor</span>
            <input className="auth-input" type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Proxima cobranca</span>
            <input className="auth-input" type="date" value={form.nextBillingDate} onChange={(event) => setForm({ ...form, nextBillingDate: event.target.value })} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Observacao</span>
            <input className="auth-input" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={17} />
            {saving ? 'Salvando...' : 'Salvar contrato'}
          </button>
        </form>
      )}

      <section className="data-card-list">
        {contracts.length === 0 ? (
          <article className="data-card text-center text-gray-500">Nenhum contrato cadastrado ainda.</article>
        ) : (
          contracts.map((contract) => {
            const status = statusInfo[contract.status]
            const Icon = status.icon
            return (
              <article className="data-card" key={contract.id}>
                <div className="toolbar">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900">{contract.title}</h2>
                      <Badge variant={status.variant}>
                        <Icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {contract.clientName} - {recurrenceLabels[contract.recurrence]}
                    </p>
                  </div>
                  <strong className="text-xl text-primary">
                    {Number(contract.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <label className="auth-field">
                    <span className="auth-label">Status</span>
                    <select className="auth-input" value={contract.status} onChange={(event) => updateContract(contract.id, { status: event.target.value as ContractStatus })}>
                      {Object.entries(statusInfo).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="auth-field">
                    <span className="auth-label">Proxima cobranca</span>
                    <input className="auth-input" type="date" value={contract.nextBillingDate || ''} onChange={(event) => updateContract(contract.id, { nextBillingDate: event.target.value })} />
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    {contract.nextBillingDate ? new Date(contract.nextBillingDate).toLocaleDateString('pt-BR') : 'Sem vencimento'}
                  </div>
                </div>

                {contract.notes && <p className="mt-4 text-sm text-slate-700 bg-blue-50 p-4 rounded-lg">{contract.notes}</p>}

                <div className="flex gap-2 flex-wrap mt-4">
                  <button className="btn btn-primary" type="button" onClick={() => generateReceivable(contract.id)}>
                    <WalletCards size={16} />
                    Gerar cobranca
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => generateDocument(contract.id)}>
                    <FileText size={16} />
                    Gerar contrato
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => updateContract(contract.id, { status: 'cancelled' })}>
                    <XCircle size={16} />
                    Cancelar
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>

      {contractDocument && (
        <section className="sap-card panel">
          <div className="panel-header toolbar">
            <div>
              <h2 className="panel-title">{contractDocument.title}</h2>
              <p className="panel-subtitle">Modelo gerado para revisar, copiar e enviar ao cliente.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" type="button" onClick={copyDocument}>
                <Copy size={16} />
                Copiar
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setContractDocument(null)}>
                Fechar
              </button>
            </div>
          </div>
          <pre className="panel-body contract-preview">{contractDocument.content}</pre>
        </section>
      )}
    </main>
  )
}
