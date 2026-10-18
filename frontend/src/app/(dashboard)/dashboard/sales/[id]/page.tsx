'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileText, GitBranch, RefreshCw, Save } from 'lucide-react'

interface Sale {
  id: string
  saleNumber: string
  total: number
  subtotal?: number
  tax?: number
  discount?: number
  status: string
  paymentStatus: string
  saleDate: string
  notes?: string
  client?: {
    id: string
    name: string
    cpfCnpj?: string
    email?: string
    phone?: string
  }
  user?: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    total: number
    product?: {
      id: string
      name: string
      code?: string
      salePrice?: number
    }
  }>
  receivables?: Array<{
    id: string
    amount: string
    dueDate: string
    status: string
  }>
}

const statusInfo: Record<string, { label: string; variant: 'warning' | 'success' | 'info' | 'destructive' | 'secondary'; light: string }> = {
  pending: { label: 'Aberta', variant: 'warning', light: 'yellow' },
  confirmed: { label: 'Aprovada', variant: 'success', light: 'green' },
  shipped: { label: 'Projeto gerado', variant: 'info', light: 'green' },
  delivered: { label: 'Concluida', variant: 'success', light: 'green' },
  cancelled: { label: 'Cancelada', variant: 'destructive', light: 'red' },
}

export default function Va03DisplaySalesDocumentPage() {
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'conditions' | 'texts' | 'flow'>('overview')
  const router = useRouter()
  const params = useParams()
  const saleId = params?.id as string

  useEffect(() => {
    fetchSale()
  }, [saleId])

  const fetchSale = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setSale(await response.json())
      } else {
        router.push('/dashboard/sales')
      }
    } catch (error) {
      console.error('Erro ao carregar VA03:', error)
      router.push('/dashboard/sales')
    } finally {
      setLoading(false)
    }
  }

  const updateSale = async (patch: Record<string, unknown>, message: string) => {
    if (!sale) return
    setSaving(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${sale.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      setSale(await response.json())
      window.dispatchEvent(new CustomEvent('sap-message', { detail: message }))
    }
    setSaving(false)
  }

  const createContract = async () => {
    if (!sale) return
    setSaving(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${sale.id}/contract`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recurrence: 'one_time', nextBillingDate: new Date() }),
    })
    if (response.ok) router.push('/dashboard/contracts')
    setSaving(false)
  }

  const createProject = async () => {
    if (!sale) return
    setSaving(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${sale.id}/project`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) router.push('/dashboard/projects')
    setSaving(false)
  }

  const subtotal = useMemo(
    () => sale?.items?.reduce((sum, item) => sum + Number(item.total || 0), 0) || Number(sale?.subtotal || 0),
    [sale]
  )
  const tax = Number(sale?.tax || 0)
  const discount = Number(sale?.discount || 0)
  const total = Number(sale?.total || subtotal + tax - discount)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando VA03...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button className="btn btn-secondary" type="button" onClick={() => router.push('/dashboard/sales')}>Voltar VA05</button>
      </div>
    )
  }

  const status = statusInfo[sale.status] || { label: sale.status, variant: 'secondary' as const, light: 'yellow' }

  return (
    <main className="sap-transaction">
      <section className="sap-transaction-title">
        <div>
          <span>SD - Exibir documento de venda</span>
          <h1>VA03 - Ordem {sale.saleNumber}</h1>
          <p>Consulta do documento comercial com parceiros, itens, condicoes, textos e fluxo.</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary">
            <span className={`sap-light ${status.light}`} />
            <strong>{status.label}</strong>
          </div>
          <strong>VA03</strong>
        </div>
      </section>

      <section className="sap-application-toolbar">
        <button type="button" onClick={() => router.push('/dashboard/sales')}>VA05</button>
        <button type="button" onClick={() => router.push('/dashboard/sales/new')}>VA01</button>
        <button type="button" onClick={() => updateSale({ status: 'confirmed', note: 'Documento aprovado via VA03.' }, 'VA02: documento aprovado')} disabled={saving}>
          <Save size={14} />Aprovar VA02
        </button>
        <button type="button" onClick={createContract} disabled={saving}>VA41 Contrato</button>
        <button type="button" onClick={createProject} disabled={saving}>CJ20N Projeto</button>
        <button type="button" onClick={fetchSale}><RefreshCw size={14} />Atualizar</button>
        <span>Modo exibicao | {saving ? 'Processando...' : 'Gravado'}</span>
      </section>

      <section className="sap-kpi-strip">
        <article className="sap-kpi sap-kpi-info"><span>Documento</span><strong>{sale.saleNumber}</strong></article>
        <article className="sap-kpi sap-kpi-ok"><span>Emissor</span><strong>{sale.client?.name || 'Cliente'}</strong></article>
        <article className="sap-kpi sap-kpi-warn"><span>Status</span><strong>{status.label}</strong></article>
        <article className="sap-kpi sap-kpi-info"><span>Total</span><strong>{formatCurrency(total)}</strong></article>
      </section>

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Dados cabecalho</strong>
          <div><Badge variant={status.variant}>{status.label}</Badge></div>
        </div>
        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label><span>Tipo ordem</span><input value="ZOR" readOnly /></label>
            <label><span>Documento venda</span><input value={sale.saleNumber} readOnly /></label>
            <label><span>Org. vendas</span><input value="JV01" readOnly /></label>
            <label><span>Canal</span><input value="01" readOnly /></label>
            <label><span>Data documento</span><input value={new Date(sale.saleDate).toLocaleDateString('pt-BR')} readOnly /></label>
            <label><span>Vendedor</span><input value={sale.user?.name || 'JV Sistemas'} readOnly /></label>
            <label><span>Status pagamento</span><input value={sale.paymentStatus} readOnly /></label>
            <label><span>Valor liquido</span><input value={formatCurrency(total)} readOnly /></label>
          </div>
        </div>
      </section>

      <section className="sap-detail-dock">
        <div className="sap-tab-strip">
          {[
            ['overview', 'Sintese'],
            ['partners', 'Parceiros'],
            ['conditions', 'Condicoes'],
            ['texts', 'Textos'],
            ['flow', 'Fluxo'],
          ].map(([key, label]) => (
            <button type="button" key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key as typeof activeTab)}>
              {key === 'flow' ? <GitBranch size={14} /> : <FileText size={14} />}
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="sap-table-wrap">
            <table className="sap-alv-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Material</th>
                  <th>Descricao</th>
                  <th>Qtd.</th>
                  <th>Centro</th>
                  <th>Cat.item</th>
                  <th>Preco PR00</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{String((index + 1) * 10).padStart(6, '0')}</td>
                    <td>{item.product?.code || item.product?.name || item.id}</td>
                    <td>{item.product?.name || 'Servico'}</td>
                    <td>{item.quantity}</td>
                    <td>JV01</td>
                    <td>TAD</td>
                    <td>{formatCurrency(Number(item.unitPrice || 0))}</td>
                    <td>{formatCurrency(Number(item.total || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="sap-detail-grid">
            <label><span>AG Emissor ordem</span><input value={sale.client?.name || ''} readOnly /></label>
            <label><span>WE Recebedor merc.</span><input value={sale.client?.name || ''} readOnly /></label>
            <label><span>RE Recebedor fatura</span><input value={sale.client?.name || ''} readOnly /></label>
            <label><span>RG Pagador</span><input value={sale.client?.name || ''} readOnly /></label>
            <label><span>CNPJ/CPF</span><input value={sale.client?.cpfCnpj || ''} readOnly /></label>
            <label><span>Email</span><input value={sale.client?.email || ''} readOnly /></label>
            <label><span>Telefone</span><input value={sale.client?.phone || ''} readOnly /></label>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="sap-detail-grid">
            <label><span>PR00 Subtotal</span><input value={formatCurrency(subtotal)} readOnly /></label>
            <label><span>K004 Desconto</span><input value={formatCurrency(discount)} readOnly /></label>
            <label><span>MWST Imposto</span><input value={formatCurrency(tax)} readOnly /></label>
            <label><span>Valor liquido</span><input value={formatCurrency(total)} readOnly /></label>
            <label><span>Cond.pagamento</span><input value="Z001" readOnly /></label>
            <label><span>Incoterms</span><input value="CIF" readOnly /></label>
          </div>
        )}

        {activeTab === 'texts' && (
          <div className="sap-detail-grid">
            <label className="span-4"><span>Texto cabecalho</span><textarea value={sale.notes || ''} readOnly rows={8} /></label>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="sap-chain-grid sap-chain-grid-compact">
            {[
              ['VA01', sale.saleNumber, status.label, true],
              ['VA41', sale.status === 'confirmed' ? `CTR-${sale.saleNumber}` : 'Contrato', sale.status === 'confirmed' ? 'Criado/possivel' : 'Pendente', sale.status === 'confirmed'],
              ['CJ20N', sale.status === 'shipped' ? `PRJ-${sale.saleNumber}` : 'Projeto', sale.status === 'shipped' ? 'Criado' : 'Pendente', sale.status === 'shipped'],
              ['VF01', sale.receivables?.length ? `FAT-${sale.saleNumber}` : 'Fatura', sale.receivables?.length ? 'Faturado' : 'Pendente', Boolean(sale.receivables?.length)],
              ['FBL5N', sale.receivables?.[0]?.id?.slice(0, 8) || 'Receber', sale.receivables?.[0]?.status || 'Pendente', Boolean(sale.receivables?.length)],
            ].map(([step, id, text, current]) => (
              <article key={String(step)} className={current ? 'current' : ''}>
                <span>{step}</span>
                <strong>{id}</strong>
                <p>{text}</p>
                <small>{current ? 'Existe' : 'Previsto'}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}
