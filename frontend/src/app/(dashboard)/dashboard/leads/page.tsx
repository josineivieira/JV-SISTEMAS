'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle2, ClipboardEdit, Eye, FileText, FolderKanban, Mail, MessageCircle, MessageSquare, Phone, Plus, Search, Trash2, XCircle } from 'lucide-react'

type LeadStatus = 'new' | 'contacted' | 'proposal' | 'won' | 'lost'

interface Lead {
  id: string
  name: string
  companyName?: string
  email?: string
  phone: string
  projectType: string
  urgency?: string
  estimatedValue: string
  message?: string
  status: LeadStatus
  createdAt: string
}

interface Proposal {
  id: string
  saleNumber: string
  total: number
  status: string
  saleDate: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  userName: string
  notes?: string
}

const statusLabels = {
  new: 'Novo orçamento',
  contacted: 'Cliente contatado',
  proposal: 'Proposta enviada',
  won: 'Fechado',
  lost: 'Perdido',
}

const statusHelp = {
  new: 'Entrou pelo site e ainda precisa do primeiro atendimento.',
  contacted: 'Você já falou com o cliente pelo WhatsApp, telefone ou e-mail.',
  proposal: 'Já existe proposta enviada ou em negociação.',
  won: 'Cliente fechou. Pode iniciar projeto ou contrato.',
  lost: 'Cliente não seguiu ou oportunidade foi descartada.',
}

const statusVariants = {
  new: 'info',
  contacted: 'warning',
  proposal: 'default',
  won: 'success',
  lost: 'destructive',
} as const

const nextActions: Record<LeadStatus, { label: string; next?: LeadStatus }> = {
  new: { label: 'Marcar contato feito', next: 'contacted' },
  contacted: { label: 'Marcar proposta enviada', next: 'proposal' },
  proposal: { label: 'Fechar e iniciar projeto', next: 'won' },
  won: { label: 'Projeto iniciado' },
  lost: { label: 'Oportunidade perdida' },
}

const projectLabels: Record<string, string> = {
  site: 'Site profissional',
  landing: 'Landing page de vendas',
  essential_system: 'Sistema essencial',
  complete_system: 'Sistema completo para empresa',
  system: 'Sistema completo para empresa',
  ecommerce: 'Loja virtual',
  app: 'Aplicativo sob medida',
  automation: 'Automação de processo',
}

const cleanPhone = (phone: string) => phone.replace(/\D/g, '')
const whatsappUrl = (lead: Lead) => {
  const phone = cleanPhone(lead.phone)
  const normalized = phone.startsWith('55') ? phone : `55${phone}`
  const text = encodeURIComponent(`Oi ${lead.name}, tudo bem? Aqui é da JV Sistemas. Recebi seu pedido de orçamento pelo site e queria entender melhor seu projeto.`)
  return `https://wa.me/${normalized}?text=${text}`
}

const proposalWhatsappUrl = (proposal: Proposal) => {
  const phone = cleanPhone(proposal.clientPhone || '')
  if (!phone) return ''
  const normalized = phone.startsWith('55') ? phone : `55${phone}`
  const text = encodeURIComponent(`Oi ${proposal.clientName}, tudo bem? Aqui é da JV Sistemas. Estou passando sobre a proposta #${proposal.saleNumber} no valor de ${Number(proposal.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`)
  return `https://wa.me/${normalized}?text=${text}`
}

export default function CommercialPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [proposalFilter, setProposalFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [actionLead, setActionLead] = useState<{ lead: Lead; status: LeadStatus } | null>(null)
  const [actionProposal, setActionProposal] = useState<{ proposal: Proposal; status?: string; title: string; defaultNote: string } | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [savingAction, setSavingAction] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCommercial()
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const fetchCommercial = async () => {
    try {
      const token = localStorage.getItem('token')
      const [leadsResponse, proposalsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if ([leadsResponse.status, proposalsResponse.status].some((status) => status === 401 || status === 403)) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (leadsResponse.ok) {
        const data = await leadsResponse.json()
        setLeads(data.leads || [])
      }

      if (proposalsResponse.ok) {
        const data = await proposalsResponse.json()
        setProposals(data.sales || [])
      }
    } catch (error) {
      console.error('Erro ao carregar comercial:', error)
      showToast('Erro de conexão ao carregar comercial.')
    } finally {
      setLoading(false)
    }
  }

  const metrics = useMemo(() => {
    const openLeads = leads.filter((lead) => ['new', 'contacted', 'proposal'].includes(lead.status))
    const leadValue = openLeads.reduce((sum, lead) => sum + Number(lead.estimatedValue || 0), 0)
    const proposalValue = proposals
      .filter((proposal) => proposal.status !== 'cancelled')
      .reduce((sum, proposal) => sum + Number(proposal.total || 0), 0)

    return [
      { title: 'Orçamentos novos', value: leads.filter((lead) => lead.status === 'new').length, note: 'Entraram pelo site' },
      { title: 'Em atendimento', value: leads.filter((lead) => lead.status === 'contacted').length, note: 'Com conversa iniciada' },
      { title: 'Propostas salvas', value: proposals.length, note: 'Documentos comerciais' },
      { title: 'Pipeline aberto', value: (leadValue + proposalValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), note: 'Orçamentos + propostas' },
    ]
  }, [leads, proposals])

  const filteredLeads = leads.filter((lead) => {
    const query = searchTerm.toLowerCase()
    return (
      lead.name.toLowerCase().includes(query) ||
      (lead.companyName || '').toLowerCase().includes(query) ||
      cleanPhone(lead.phone).includes(cleanPhone(searchTerm)) ||
      (lead.email || '').toLowerCase().includes(query)
    )
  })

  const filteredProposals = proposals.filter((proposal) => {
    const query = searchTerm.toLowerCase()
    const matchesSearch = (
      (proposal.saleNumber || '').toLowerCase().includes(query) ||
      (proposal.clientName || '').toLowerCase().includes(query) ||
      (proposal.userName || '').toLowerCase().includes(query)
    )
    const matchesStatus = proposalFilter === 'all' || proposal.status === proposalFilter
    return matchesSearch && matchesStatus
  })

  const proposalStages = [
    { key: 'all', label: 'Todas', count: proposals.length },
    { key: 'pending', label: 'Em negociação', count: proposals.filter((proposal) => proposal.status === 'pending').length },
    { key: 'confirmed', label: 'Aprovadas', count: proposals.filter((proposal) => proposal.status === 'confirmed').length },
    { key: 'cancelled', label: 'Perdidas', count: proposals.filter((proposal) => proposal.status === 'cancelled').length },
  ]

  const updateStatus = async (lead: Lead, status: LeadStatus, note?: string) => {
    setSavingAction(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    })

    if (response.ok) {
      const updated = await response.json()
      setLeads((current) => current.map((item) => (item.id === lead.id ? updated : item)))
      showToast(`Status atualizado: ${statusLabels[status]}`)
      setActionLead(null)
      setActionNote('')
    } else {
      showToast('Não consegui atualizar esse orçamento.')
    }

    setSavingAction(false)
  }

  const createProject = async (lead: Lead) => {
    setSavingAction(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status: 'won' } : item)))
      showToast('Projeto criado. Abrindo tela de Projetos...')
      window.setTimeout(() => router.push('/dashboard/projects'), 650)
    } else {
      showToast(response.status === 409 ? 'Esse orçamento já possui projeto criado.' : 'Não consegui criar o projeto agora.')
    }

    setSavingAction(false)
  }

  const deleteLead = async (lead: Lead) => {
    if (!confirm(`Remover o orçamento de ${lead.name}?`)) return
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      setLeads((current) => current.filter((item) => item.id !== lead.id))
      showToast('Orçamento removido.')
    } else {
      showToast('Não consegui remover esse orçamento.')
    }
  }

  const proposalStatus = (status: string) => {
    const labels: Record<string, { label: string; variant: 'warning' | 'success' | 'info' | 'destructive' | 'secondary' }> = {
      pending: { label: 'Em negociação', variant: 'warning' },
      confirmed: { label: 'Aprovada', variant: 'success' },
      shipped: { label: 'Virou projeto', variant: 'info' },
      delivered: { label: 'Entregue', variant: 'success' },
      cancelled: { label: 'Perdida', variant: 'destructive' },
    }
    const current = labels[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={current.variant}>{current.label}</Badge>
  }

  const proposalLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Em negociação',
      confirmed: 'Aprovada',
      shipped: 'Virou projeto',
      delivered: 'Entregue',
      cancelled: 'Perdida',
    }
    return labels[status] || status
  }

  const updateProposal = async (proposal: Proposal, patch: Record<string, unknown>, message: string) => {
    setSavingAction(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${proposal.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      const updated = await response.json()
      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id
            ? {
                ...item,
                status: updated.status || item.status,
                notes: updated.notes || item.notes,
              }
            : item
        )
      )
      showToast(message)
      setActionProposal(null)
      setActionNote('')
    } else {
      showToast('Não consegui atualizar essa proposta.')
    }
    setSavingAction(false)
  }

  const confirmProposalAction = () => {
    if (!actionProposal) return
    const patch: Record<string, unknown> = {
      note: actionNote || actionProposal.defaultNote,
    }
    if (actionProposal.status) patch.status = actionProposal.status

    updateProposal(
      actionProposal.proposal,
      patch,
      actionProposal.status ? `Proposta atualizada: ${proposalLabel(actionProposal.status)}` : 'Observação registrada na proposta.'
    )
  }

  const createContractFromProposal = async (proposal: Proposal) => {
    if (proposal.status !== 'confirmed') {
      showToast('Feche a proposta antes de gerar contrato.')
      return
    }

    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${proposal.id}/contract`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recurrence: 'one_time', nextBillingDate: new Date() }),
    })

    if (response.ok) {
      showToast('Contrato gerado a partir da proposta fechada.')
      window.setTimeout(() => router.push('/dashboard/contracts'), 650)
    } else {
      showToast('Não consegui gerar o contrato agora.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando comercial...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="page-shell">
      {toast && <div className="app-toast"><CheckCircle2 size={17} />{toast}</div>}

      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">Comercial interno</p>
            <h1 className="page-title">Comercial JV</h1>
            <p className="page-subtitle">
              Orçamentos recebidos e propostas comerciais na mesma tela, do primeiro contato ao fechamento.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => router.push('/dashboard/sales/new')}>
            <Plus size={17} />
            Nova proposta
          </button>
        </div>
      </section>

      <section className="workflow-strip">
        <button type="button" onClick={() => router.push('/dashboard/products')}>1. Serviços</button>
        <button type="button" className="active">2. Comercial</button>
        <button type="button" onClick={() => router.push('/dashboard/contracts')}>3. Contratos</button>
        <button type="button" onClick={() => router.push('/dashboard/projects')}>4. Projetos</button>
        <button type="button" onClick={() => router.push('/dashboard/financial')}>5. Financeiro</button>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Fluxo SD comercial</strong>
          <div><span>VA01 - VA05 - VA41 - VF01 - FBL5N</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['ZLEAD', 'Lead', 'Entrada do site'],
            ['VA01', 'Proposta', 'Itens e condicoes'],
            ['VA02', 'Negociacao', 'Status e follow-up'],
            ['VA41', 'Contrato', 'Fechamento'],
            ['FBL5N', 'Financeiro', 'Recebimento'],
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
            <div className="metric-top"><span>{metric.title}</span><span className="metric-icon"><MessageSquare size={18} /></span></div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">{metric.note}</div>
          </article>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div className="toolbar">
            <div>
              <CardTitle>Orçamentos do site</CardTitle>
              <p className="panel-subtitle">Novo é o status automático de todo orçamento que entra pelo site.</p>
            </div>
            <div className="search-box">
              <Search />
              <input
                type="text"
                placeholder="Buscar por nome, empresa, telefone, e-mail ou proposta..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="lead-board">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-8"><p className="text-gray-500">Nenhum orçamento encontrado</p></div>
            ) : (
              filteredLeads.map((lead) => {
                const next = nextActions[lead.status]
                return (
                  <article key={lead.id} className="lead-card">
                    <div className="toolbar">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
                          <Badge variant={statusVariants[lead.status]}>{statusLabels[lead.status]}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {lead.companyName || 'Empresa não informada'} - {projectLabels[lead.projectType] || lead.projectType}
                        </p>
                        <p className="lead-status-help">{statusHelp[lead.status]}</p>
                      </div>
                      <strong className="text-xl text-primary">
                        {Number(lead.estimatedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </strong>
                    </div>

                    <div className="lead-contact-grid">
                      <span><Phone className="h-4 w-4" />{lead.phone}</span>
                      <span><Mail className="h-4 w-4" />{lead.email || 'Sem e-mail'}</span>
                      <span><Calendar className="h-4 w-4" />{lead.urgency || 'Prazo não informado'}</span>
                      <span><MessageSquare className="h-4 w-4" />{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {lead.message && <pre className="lead-notes">{lead.message}</pre>}

                    <div className="lead-actions">
                      <a className="btn btn-primary" href={whatsappUrl(lead)} target="_blank" rel="noreferrer">
                        <MessageCircle size={16} />
                        Chamar no WhatsApp
                      </a>
                      <button className="btn btn-secondary" type="button" onClick={() => router.push('/dashboard/sales/new')}>
                        <FileText size={16} />
                        Criar proposta
                      </button>
                      {next.next && (
                        <button className="btn btn-secondary" type="button" onClick={() => setActionLead({ lead, status: next.next! })}>
                          <ClipboardEdit size={16} />
                          {next.label}
                        </button>
                      )}
                      {lead.status === 'proposal' && (
                        <button className="btn btn-primary" type="button" disabled={savingAction} onClick={() => createProject(lead)}>
                          <FolderKanban size={16} />
                          Fechar e iniciar projeto
                        </button>
                      )}
                      {lead.status !== 'lost' && (
                        <button className="btn btn-secondary" type="button" onClick={() => setActionLead({ lead, status: 'lost' })}>
                          <XCircle size={16} />
                          Marcar perdido
                        </button>
                      )}
                      <button className="btn btn-secondary" type="button" onClick={() => deleteLead(lead)}>
                        <Trash2 size={16} />
                        Remover
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="toolbar">
            <div>
              <CardTitle>Propostas comerciais</CardTitle>
              <p className="panel-subtitle">Acompanhe envio, negociação, aprovação e perda sem sair do Comercial.</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => router.push('/dashboard/sales/new')}>
              <FileText size={17} />
              Criar proposta
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="commercial-stage-tabs">
            {proposalStages.map((stage) => (
              <button
                key={stage.key}
                type="button"
                className={proposalFilter === stage.key ? 'active' : ''}
                onClick={() => setProposalFilter(stage.key)}
              >
                <span>{stage.label}</span>
                <strong>{stage.count}</strong>
              </button>
            ))}
          </div>

          {filteredProposals.length === 0 ? (
            <div className="text-center py-8"><p className="text-gray-500">Nenhuma proposta encontrada</p></div>
          ) : (
            <div className="data-card-list">
              {filteredProposals.map((proposal) => (
                <article className="data-card" key={proposal.id}>
                  <div className="toolbar">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">#{proposal.saleNumber}</h3>
                        {proposalStatus(proposal.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {proposal.clientName || 'Cliente não informado'} - {new Date(proposal.saleDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <strong className="text-xl text-primary">
                      {Number(proposal.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>
                  <div className="lead-actions">
                    {proposal.clientPhone ? (
                      <a className="btn btn-primary" href={proposalWhatsappUrl(proposal)} target="_blank" rel="noreferrer">
                        <MessageCircle size={16} />
                        WhatsApp
                      </a>
                    ) : null}
                    <button className="btn btn-secondary" type="button" onClick={() => router.push(`/dashboard/sales/${proposal.id}`)}>
                      <Eye size={16} />
                      Ver proposta
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setActionProposal({
                        proposal,
                        title: 'Marcar proposta enviada',
                        defaultNote: 'Proposta enviada ao cliente.',
                      })}
                    >
                      <FileText size={16} />
                      Marcar enviada
                    </button>
                    {proposal.status !== 'confirmed' && (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => setActionProposal({
                          proposal,
                          status: 'confirmed',
                          title: 'Fechar proposta',
                          defaultNote: 'Cliente aprovou a proposta.',
                        })}
                      >
                        <CheckCircle2 size={16} />
                        Fechar proposta
                      </button>
                    )}
                    {proposal.status !== 'cancelled' && (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => setActionProposal({
                          proposal,
                          status: 'cancelled',
                          title: 'Marcar proposta perdida',
                          defaultNote: 'Proposta marcada como perdida.',
                        })}
                      >
                        <XCircle size={16} />
                        Perdida
                      </button>
                    )}
                    <button className={proposal.status === 'confirmed' ? 'btn btn-primary' : 'btn btn-secondary'} type="button" onClick={() => createContractFromProposal(proposal)}>
                      <CheckCircle2 size={16} />
                      Gerar contrato
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {actionLead && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="settlement-modal">
            <div className="settlement-modal-header">
              <div>
                <p className="eyebrow">Atualizar atendimento</p>
                <h2>{actionLead.lead.name}</h2>
              </div>
              <button className="btn btn-secondary btn-icon" type="button" onClick={() => setActionLead(null)}>
                <XCircle size={18} />
              </button>
            </div>
            <div className="settlement-summary">
              <div><span>Status atual</span><strong>{statusLabels[actionLead.lead.status]}</strong></div>
              <div><span>Novo status</span><strong>{statusLabels[actionLead.status]}</strong></div>
              <div><span>Valor estimado</span><strong>{Number(actionLead.lead.estimatedValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            </div>
            <div className="panel-body">
              <label className="auth-field">
                <span className="auth-label">Observação desta etapa</span>
                <textarea
                  className="auth-input"
                  rows={4}
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder="Ex: chamei no WhatsApp, pediu proposta até sexta, quer sistema com financeiro e área do cliente..."
                />
              </label>
            </div>
            <div className="settlement-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setActionLead(null)}>Cancelar</button>
              <button className="btn btn-primary" type="button" disabled={savingAction} onClick={() => updateStatus(actionLead.lead, actionLead.status, actionNote)}>
                <CheckCircle2 size={17} />
                {savingAction ? 'Salvando...' : 'Confirmar etapa'}
              </button>
            </div>
          </section>
        </div>
      )}

      {actionProposal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="settlement-modal">
            <div className="settlement-modal-header">
              <div>
                <p className="eyebrow">Atualizar proposta</p>
                <h2>{actionProposal.title}</h2>
              </div>
              <button className="btn btn-secondary btn-icon" type="button" onClick={() => setActionProposal(null)}>
                <XCircle size={18} />
              </button>
            </div>
            <div className="settlement-summary">
              <div><span>Proposta</span><strong>#{actionProposal.proposal.saleNumber}</strong></div>
              <div><span>Status atual</span><strong>{proposalLabel(actionProposal.proposal.status)}</strong></div>
              <div><span>Novo status</span><strong>{actionProposal.status ? proposalLabel(actionProposal.status) : 'Registrar envio'}</strong></div>
            </div>
            <div className="panel-body">
              <div className="settlement-summary" style={{ marginBottom: '1rem' }}>
                <div><span>Cliente</span><strong>{actionProposal.proposal.clientName || 'Cliente não informado'}</strong></div>
                <div><span>Valor</span><strong>{Number(actionProposal.proposal.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                <div><span>Data</span><strong>{new Date(actionProposal.proposal.saleDate).toLocaleDateString('pt-BR')}</strong></div>
              </div>
              <label className="auth-field">
                <span className="auth-label">Observação desta etapa</span>
                <textarea
                  className="auth-input"
                  rows={4}
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder={actionProposal.defaultNote}
                />
              </label>
            </div>
            <div className="settlement-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setActionProposal(null)}>Cancelar</button>
              <button className="btn btn-primary" type="button" disabled={savingAction} onClick={confirmProposalAction}>
                <CheckCircle2 size={17} />
                {savingAction ? 'Salvando...' : 'Confirmar etapa'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
