'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Edit, Plus, Search, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  salePrice?: number
  price?: number
  costPrice: number
  code?: string
  sku?: string
  category: string
  isActive: boolean
  createdAt: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.products)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao carregar servicos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este servico?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setServices(services.filter((service) => service.id !== id))
      }
    } catch (error) {
      console.error('Erro ao excluir servico:', error)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.code || service.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando servicos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="sap-transaction">
      <section className="sap-transaction-title">
        <div>
          <span>MM/SD - Mestre de servicos</span>
          <h1>Catalogo de servicos</h1>
          <p>Servicos, pacotes, categorias e precos usados na criacao de propostas e contratos.</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary">
            <span className="sap-light green" />
            <strong>{services.filter((service) => service.isActive).length}</strong>
            <span className="sap-light yellow" />
            <strong>{services.filter((service) => !service.code && !service.sku).length}</strong>
            <span className="sap-light red" />
            <strong>{services.filter((service) => !service.isActive).length}</strong>
          </div>
          <strong>MM03 / ZJV_SERV</strong>
        </div>
      </section>

      <section className="sap-kpi-strip">
        <article className="sap-kpi sap-kpi-info"><span>Total servicos</span><strong>{services.length}</strong></article>
        <article className="sap-kpi sap-kpi-ok"><span>Ativos</span><strong>{services.filter((service) => service.isActive).length}</strong></article>
        <article className="sap-kpi sap-kpi-warn"><span>Sem codigo</span><strong>{services.filter((service) => !service.code && !service.sku).length}</strong></article>
        <article className="sap-kpi sap-kpi-info"><span>Filtrados</span><strong>{filteredServices.length}</strong></article>
      </section>

      <section className="sap-application-toolbar">
        <button type="button" onClick={() => router.push('/dashboard/products/new')}>Criar F5</button>
        <button type="button" onClick={() => router.push('/dashboard/sales/new')}>Usar em VA01</button>
        <button type="button" onClick={() => router.push('/dashboard/leads')}>Comercial</button>
        <button type="button" onClick={fetchServices}>Atualizar</button>
        <span>Modo exibicao | Mestre servico</span>
      </section>

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Tela de selecao</strong>
          <div><Search size={15} /></div>
        </div>
        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label className="wide">
              <span>Servico / codigo / categoria</span>
              <div className="sap-input-icon">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Buscar por servico, codigo ou categoria..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </label>
            <label><span>Tipo material</span><input defaultValue="SERV" /></label>
            <label><span>Organizacao vendas</span><input defaultValue="JV01" /></label>
          </div>
          <div className="sap-filter-actions">
            <button type="button" onClick={fetchServices}><CheckCircle2 size={15} />Executar</button>
            <button type="button" onClick={() => setSearchTerm('')}>Limpar</button>
            <button type="button" onClick={() => router.push('/dashboard/products/new')}><Plus size={15} />Novo servico</button>
          </div>
        </div>
      </section>

      <section className="sap-result-window">
        <div className="sap-window-header">
          <strong>Lista ALV - {filteredServices.length} servicos</strong>
          <div><span>Layout: JV_MM_MARA</span></div>
        </div>
        <div className="sap-alv-toolbar">
          <button type="button">Ordenar</button>
          <button type="button">Layout</button>
          <button type="button" onClick={() => router.push('/dashboard/sales/new')}>Criar proposta</button>
        </div>
        <div className="sap-table-wrap">
          <table className="sap-alv-table">
            <thead>
              <tr>
                <th>Sem.</th>
                <th>Codigo</th>
                <th>Servico</th>
                <th>Categoria</th>
                <th>Preco venda</th>
                <th>Custo</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const salePrice = service.salePrice ?? service.price ?? 0
                const code = service.code || service.sku || 'Sem codigo'
                return (
                  <tr key={service.id}>
                    <td><span className={`sap-light ${service.isActive ? 'green' : 'red'}`} /></td>
                    <td>{code}</td>
                    <td>{service.name}</td>
                    <td>{service.category || 'Geral'}</td>
                    <td>{formatCurrency(Number(salePrice))}</td>
                    <td>{formatCurrency(Number(service.costPrice || 0))}</td>
                    <td><Badge variant={service.isActive ? 'success' : 'secondary'}>{service.isActive ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td>
                      <div className="sap-inline-actions">
                        <button type="button" onClick={() => router.push('/dashboard/sales/new')} title="Usar em proposta"><Plus size={14} /></button>
                        <button type="button" onClick={() => router.push(`/dashboard/products/${service.id}/edit`)} title="Modificar"><Edit size={14} /></button>
                        <button type="button" onClick={() => handleDelete(service.id)} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Processo servico MM-SD-FI</strong>
          <div><span>Preco usado no documento comercial</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['MM01', 'Servico', 'Cadastro e categoria'],
            ['VK11', 'Preco', 'Condicao comercial'],
            ['VA01', 'Proposta', 'Item de venda'],
            ['VA41', 'Contrato', 'Recorrencia'],
            ['VF01', 'Faturamento', 'Cobranca'],
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
