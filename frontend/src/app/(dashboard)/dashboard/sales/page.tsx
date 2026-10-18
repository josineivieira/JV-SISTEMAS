'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileText, Plus, RefreshCw, Search } from 'lucide-react'

type Sale = {
  id: string
  saleNumber: string
  total: number
  status: string
  paymentStatus: string
  saleDate: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  userName: string
  notes?: string
}

const statusInfo: Record<string, { label: string; variant: 'warning' | 'success' | 'info' | 'destructive' | 'secondary'; light: string }> = {
  pending: { label: 'Aberta', variant: 'warning', light: 'yellow' },
  confirmed: { label: 'Aprovada', variant: 'success', light: 'green' },
  shipped: { label: 'Projeto gerado', variant: 'info', light: 'green' },
  delivered: { label: 'Concluida', variant: 'success', light: 'green' },
  cancelled: { label: 'Cancelada', variant: 'destructive', light: 'red' },
}

export default function Va05SalesListPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])
      }
    } catch (error) {
      console.error('Erro ao carregar VA05:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        sale.saleNumber.toLowerCase().includes(query) ||
        (sale.clientName || '').toLowerCase().includes(query) ||
        (sale.userName || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [sales, searchTerm, statusFilter])

  const totals = useMemo(() => {
    const open = sales.filter((sale) => sale.status === 'pending')
    const approved = sales.filter((sale) => sale.status === 'confirmed')
    const revenue = sales
      .filter((sale) => !['cancelled'].includes(sale.status))
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0)

    return [
      { label: 'Documentos', value: String(sales.length), tone: 'info' },
      { label: 'Abertos', value: String(open.length), tone: 'warn' },
      { label: 'Aprovados', value: String(approved.length), tone: 'ok' },
      { label: 'Valor SD', value: formatCurrency(revenue), tone: 'info' },
    ]
  }, [sales])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando VA05...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="sap-transaction">
      <section className="sap-transaction-title">
        <div>
          <span>SD - Lista de documentos de venda</span>
          <h1>VA05 - Ordens de venda</h1>
          <p>Consulta ALV de propostas, ordens, contratos gerados e documentos pendentes de faturamento.</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary">
            <span className="sap-light green" />
            <strong>{sales.filter((sale) => ['confirmed', 'shipped', 'delivered'].includes(sale.status)).length}</strong>
            <span className="sap-light yellow" />
            <strong>{sales.filter((sale) => sale.status === 'pending').length}</strong>
            <span className="sap-light red" />
            <strong>{sales.filter((sale) => sale.status === 'cancelled').length}</strong>
          </div>
          <strong>VA05</strong>
        </div>
      </section>

      <section className="sap-kpi-strip">
        {totals.map((item) => (
          <article className={`sap-kpi sap-kpi-${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="sap-application-toolbar">
        <button type="button" onClick={() => router.push('/dashboard/sales/new')}><Plus size={14} />VA01 Criar</button>
        <button type="button" onClick={fetchSales}><RefreshCw size={14} />Atualizar</button>
        <button type="button" onClick={() => router.push('/dashboard/contracts')}>VA41 Contratos</button>
        <button type="button" onClick={() => router.push('/dashboard/financial')}>FBL5N</button>
        <span>Modo exibicao | Layout JV_SD_VA05</span>
      </section>

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Tela de selecao</strong>
          <div><Search size={15} /></div>
        </div>
        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label className="wide">
              <span>Documento / cliente / vendedor</span>
              <div className="sap-input-icon">
                <Search size={15} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="VA05 pesquisa livre..."
                />
              </div>
            </label>
            <label>
              <span>Status documento</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="pending">Aberta</option>
                <option value="confirmed">Aprovada</option>
                <option value="shipped">Projeto gerado</option>
                <option value="delivered">Concluida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </label>
            <label><span>Org. vendas</span><input defaultValue="JV01" /></label>
            <label><span>Periodo</span><input defaultValue="01/05/2026 - 31/05/2026" /></label>
          </div>
          <div className="sap-filter-actions">
            <button type="button" onClick={fetchSales}><CheckCircle2 size={15} />Executar</button>
            <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all') }}>Limpar</button>
            <button type="button" onClick={() => router.push('/dashboard/sales/new')}><Plus size={15} />Criar VA01</button>
          </div>
        </div>
      </section>

      <section className="sap-result-window">
        <div className="sap-window-header">
          <strong>Lista ALV - {filteredSales.length} documentos</strong>
          <div><span>Layout: JV_SD_VA05</span></div>
        </div>
        <div className="sap-alv-toolbar">
          <button type="button">Ordenar</button>
          <button type="button">Filtro</button>
          <button type="button">Layout</button>
          <button type="button">Exportar</button>
        </div>
        <div className="sap-table-wrap">
          <table className="sap-alv-table">
            <thead>
              <tr>
                <th>Sem.</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Emissor ordem</th>
                <th>Data doc.</th>
                <th>Valor liquido</th>
                <th>Status</th>
                <th>Pgto.</th>
                <th>Vendedor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const status = statusInfo[sale.status] || { label: sale.status, variant: 'secondary' as const, light: 'yellow' }
                return (
                  <tr key={sale.id} onDoubleClick={() => router.push(`/dashboard/sales/${sale.id}`)}>
                    <td><span className={`sap-light ${status.light}`} /></td>
                    <td>{sale.saleNumber}</td>
                    <td>ZOR</td>
                    <td>{sale.clientName || 'Cliente nao informado'}</td>
                    <td>{new Date(sale.saleDate).toLocaleDateString('pt-BR')}</td>
                    <td>{formatCurrency(sale.total)}</td>
                    <td><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td>{sale.paymentStatus}</td>
                    <td>{sale.userName}</td>
                    <td>
                      <div className="sap-inline-actions">
                        <button type="button" title="VA03 Exibir" onClick={() => router.push(`/dashboard/sales/${sale.id}`)}><FileText size={14} /></button>
                        <button type="button" title="VA41 Contrato" onClick={() => router.push('/dashboard/contracts')}><CheckCircle2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10}>Nenhum documento encontrado para a selecao.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Cadeia SD padrao</strong>
          <div><span>Documento de venda para financeiro</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['VA01', 'Criar ordem', 'Documento SD'],
            ['VA02', 'Modificar', 'Negociacao'],
            ['VA03', 'Exibir', 'Consulta'],
            ['VF01', 'Faturar', 'Documento FI'],
            ['FBL5N', 'Receber', 'Cliente'],
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
    </main>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}
