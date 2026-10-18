'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react'

interface DashboardData {
  monthlyRevenue: number
  monthlyCosts?: number
  netCash?: number
  pendingPayables: number
  pendingReceivables: number
  totalClients: number
  totalSales: number
  openProjects?: number
  activeContracts?: number
  newLeads?: number
  lowStockProducts?: number
  recentSales: Array<{
    id: string
    total: number
    status: string
    saleDate: string
    clientName: string
    userName: string
  }>
}

const demoData: DashboardData = {
  monthlyRevenue: 28450.9,
  monthlyCosts: 11200,
  netCash: 17250.9,
  pendingPayables: 6430,
  pendingReceivables: 18680,
  totalClients: 34,
  totalSales: 12,
  openProjects: 7,
  activeContracts: 4,
  newLeads: 6,
  recentSales: [
    {
      id: 'PROP-10084',
      total: 8420,
      status: 'confirmed',
      saleDate: new Date().toISOString(),
      clientName: 'Transportadora Norte',
      userName: 'Equipe Comercial',
    },
    {
      id: 'PROP-10083',
      total: 3190,
      status: 'pending',
      saleDate: new Date().toISOString(),
      clientName: 'Clinica Sao Lucas',
      userName: 'Josinei',
    },
  ],
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const dashboardData = await response.json()
        setData({
          ...demoData,
          ...dashboardData,
          openProjects: dashboardData.openProjects ?? dashboardData.lowStockProducts ?? demoData.openProjects,
          recentSales: dashboardData.recentSales?.length ? dashboardData.recentSales : demoData.recentSales,
        })
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        setData(demoData)
      }
    } catch {
      setData(demoData)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR')

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'warning' as const },
      confirmed: { label: 'Aprovada', variant: 'success' as const },
      shipped: { label: 'Em implantacao', variant: 'info' as const },
      delivered: { label: 'Entregue', variant: 'success' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: 'secondary' as const,
    }

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="font-semibold text-gray-700">Carregando indicadores...</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Recebido no mes',
      value: formatCurrency(data.monthlyRevenue),
      note: 'Baixas confirmadas no financeiro',
      icon: DollarSign,
    },
    {
      label: 'Custos pagos',
      value: formatCurrency(data.monthlyCosts || 0),
      note: 'Saidas confirmadas no mes',
      icon: CreditCard,
    },
    {
      label: 'Resultado do mes',
      value: formatCurrency(data.netCash ?? data.monthlyRevenue - (data.monthlyCosts || 0)),
      note: (data.netCash ?? 0) < 0 ? 'Negativo: custos acima das entradas' : 'Entradas menos custos pagos',
      icon: Receipt,
    },
    {
      label: 'Leads em aberto',
      value: String(data.newLeads ?? 0),
      note: 'Orcamentos para trabalhar',
      icon: Users,
    },
  ]

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">JV Sistemas & Tecnologia</p>
            <h1 className="page-title">Painel comercial</h1>
            <p className="page-subtitle">
              Visao da JV com orcamentos, propostas, projetos, clientes e financeiro.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard/leads')}>
            <Send size={17} />
            Ver orcamentos
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article className="sap-card metric-card" key={metric.label}>
            <div className="metric-top">
              <span>{metric.label}</span>
              <span className="metric-icon">
                <metric.icon size={18} />
              </span>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">
              <span className="status-dot" />
              <span>{metric.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="metrics-grid">
        <article className="sap-card metric-card">
          <div className="metric-top">
            <span>Propostas do mes</span>
            <span className="metric-icon">
              <FileText size={18} />
            </span>
          </div>
          <div className="metric-value">{data.totalSales}</div>
          <div className="metric-note">Negociacoes registradas no periodo</div>
        </article>

        <article className="sap-card metric-card">
          <div className="metric-top">
            <span>Projetos ativos</span>
            <span className="metric-icon">
              <Briefcase size={18} />
            </span>
          </div>
          <div className="metric-value">{data.openProjects ?? 0}</div>
          <div className="metric-note">Sites, sistemas e apps em andamento</div>
        </article>

        <article className="sap-card metric-card">
          <div className="metric-top">
            <span>Lucro estimado</span>
            <span className="metric-icon">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="metric-value">{formatCurrency(data.netCash ?? data.monthlyRevenue - (data.monthlyCosts || 0))}</div>
          <div className="metric-note">Resultado financeiro real do mes</div>
        </article>

        <article className="sap-card metric-card">
          <div className="metric-top">
            <span>Contratos ativos</span>
            <span className="metric-icon">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <div className="metric-value">{data.activeContracts ?? 0}</div>
          <div className="metric-note">Mensalidades e recorrencias</div>
        </article>
      </section>

      <section className="content-grid">
        <article className="sap-card panel">
          <div className="panel-header">
            <h2 className="panel-title">Propostas recentes</h2>
            <p className="panel-subtitle">Ultimas negociacoes registradas no ERP</p>
          </div>
          <div className="table-wrap">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Proposta</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Responsavel</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-mono">{sale.id.slice(-8)}</td>
                    <td className="font-semibold">{sale.clientName}</td>
                    <td>{formatDate(sale.saleDate)}</td>
                    <td>{getStatusBadge(sale.status)}</td>
                    <td className="font-bold">{formatCurrency(sale.total)}</td>
                    <td>{sale.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="sap-card panel">
          <div className="panel-header">
            <h2 className="panel-title">Prioridades de hoje</h2>
            <p className="panel-subtitle">Pontos que merecem atencao comercial</p>
          </div>
          <div className="panel-body data-card-list">
            <div className="data-card">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-warning" size={18} />
                <strong>Follow-up comercial</strong>
              </div>
              <p className="text-sm text-gray-600">
                Revise orcamentos novos e propostas pendentes para nao perder oportunidades.
              </p>
            </div>

            <div className="data-card">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="text-destructive" size={18} />
                <strong>Financeiro aberto</strong>
              </div>
              <p className="text-sm text-gray-600">
                Existem {formatCurrency(data.pendingPayables)} em obrigacoes abertas.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
