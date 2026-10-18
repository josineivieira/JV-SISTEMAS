'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Edit, Plus, Search, Trash2 } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  cpfCnpj?: string
  document?: string
  isActive: boolean
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setClients(clients.filter((client) => client.id !== id))
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone || '').includes(searchTerm) ||
    (client.cpfCnpj || client.document || '').includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="sap-transaction">
      <section className="sap-transaction-title">
        <div>
          <span>SD - Mestre de clientes</span>
          <h1>Clientes e contatos</h1>
          <p>Empresas, leads qualificados, tomadores e pagadores usados no fluxo comercial.</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary">
            <span className="sap-light green" />
            <strong>{clients.filter((client) => client.isActive).length}</strong>
            <span className="sap-light yellow" />
            <strong>{clients.filter((client) => !client.email || !client.phone).length}</strong>
            <span className="sap-light red" />
            <strong>{clients.filter((client) => !client.isActive).length}</strong>
          </div>
          <strong>XD03 / ZJV_CLIENT</strong>
        </div>
      </section>

      <section className="sap-kpi-strip">
        <article className="sap-kpi sap-kpi-info"><span>Total clientes</span><strong>{clients.length}</strong></article>
        <article className="sap-kpi sap-kpi-ok"><span>Ativos</span><strong>{clients.filter((client) => client.isActive).length}</strong></article>
        <article className="sap-kpi sap-kpi-warn"><span>Cadastro incompleto</span><strong>{clients.filter((client) => !client.email || !client.phone).length}</strong></article>
        <article className="sap-kpi sap-kpi-info"><span>Filtrados</span><strong>{filteredClients.length}</strong></article>
      </section>

      <section className="sap-application-toolbar">
        <button type="button" onClick={() => router.push('/dashboard/clients/new')}>Criar F5</button>
        <button type="button" onClick={() => router.push('/dashboard/leads')}>Comercial</button>
        <button type="button" onClick={() => router.push('/dashboard/contracts')}>Contratos</button>
        <button type="button" onClick={fetchClients}>Atualizar</button>
        <span>Modo exibicao | Mestre cliente</span>
      </section>

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Tela de selecao</strong>
          <div><Search size={15} /></div>
        </div>
        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label className="wide">
              <span>Cliente / contato / documento</span>
              <div className="sap-input-icon">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Nome, email, telefone, CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </label>
            <label><span>Organizacao vendas</span><input defaultValue="JV01" /></label>
            <label><span>Canal distribuicao</span><input defaultValue="01 - Direto" /></label>
          </div>
          <div className="sap-filter-actions">
            <button type="button" onClick={fetchClients}><CheckCircle2 size={15} />Executar</button>
            <button type="button" onClick={() => setSearchTerm('')}>Limpar</button>
            <button type="button" onClick={() => router.push('/dashboard/clients/new')}><Plus size={15} />Novo contato</button>
          </div>
        </div>
      </section>

      <section className="sap-result-window">
        <div className="sap-window-header">
          <strong>Lista ALV - {filteredClients.length} clientes</strong>
          <div><span>Layout: JV_SD_KNA1</span></div>
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
                <th>Cliente</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>UF</th>
                <th>CPF/CNPJ</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td><span className={`sap-light ${client.isActive ? 'green' : 'red'}`} /></td>
                  <td>{client.name}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.city || '-'}</td>
                  <td>{client.state || '-'}</td>
                  <td>{client.cpfCnpj || client.document || 'Nao informado'}</td>
                  <td><Badge variant={client.isActive ? 'success' : 'secondary'}>{client.isActive ? 'Ativo' : 'Inativo'}</Badge></td>
                  <td>
                    <div className="sap-inline-actions">
                      <button type="button" onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)} title="Modificar"><Edit size={14} /></button>
                      <button type="button" onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Processo cliente SD-FI</strong>
          <div><span>Cadastro compartilhado</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['BP', 'Business Partner', 'Cadastro unico'],
            ['XD03', 'Cliente SD', 'Vendas e cobranca'],
            ['VA01', 'Proposta', 'Documento comercial'],
            ['VA41', 'Contrato', 'Receita recorrente'],
            ['FBL5N', 'Contas a receber', 'Baixa financeira'],
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
