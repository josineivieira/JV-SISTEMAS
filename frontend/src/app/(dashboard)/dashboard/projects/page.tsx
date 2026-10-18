'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, CheckCircle2, Clock3, Code2, FolderKanban, Headphones, Plus, Save, UserRound } from 'lucide-react'

type ProjectStatus = 'briefing' | 'development' | 'client_waiting' | 'testing' | 'delivered' | 'support'

interface Project {
  id: string
  title: string
  clientName: string
  projectType: string
  status: ProjectStatus
  progress: number
  value: string
  deadline?: string
  nextStep?: string
  notes?: string
  updatedAt: string
}

const statusInfo = {
  briefing: { label: 'Briefing', variant: 'warning' as const, icon: Clock3 },
  development: { label: 'Em desenvolvimento', variant: 'info' as const, icon: Code2 },
  client_waiting: { label: 'Aguardando cliente', variant: 'warning' as const, icon: UserRound },
  testing: { label: 'Testes e ajustes', variant: 'info' as const, icon: CheckCircle2 },
  delivered: { label: 'Entregue', variant: 'success' as const, icon: CheckCircle2 },
  support: { label: 'Suporte ativo', variant: 'success' as const, icon: Headphones },
}

const projectTypes: Record<string, string> = {
  site: 'Site profissional',
  landing: 'Landing page',
  essential_system: 'Sistema essencial',
  complete_system: 'Sistema completo',
  system: 'Sistema completo',
  ecommerce: 'Loja virtual',
  app: 'Aplicativo',
  automation: 'Automacao',
  support: 'Suporte recorrente',
}

const blankForm = {
  title: '',
  clientName: '',
  projectType: 'complete_system',
  value: '',
  deadline: '',
  nextStep: '',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState(blankForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!response.ok) {
        console.error('Erro ao carregar projetos:', response.status)
        return
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = useMemo(() => {
    const active = projects.filter((project) => !['delivered', 'support'].includes(project.status)).length
    const waiting = projects.filter((project) => project.status === 'client_waiting').length
    const support = projects.filter((project) => project.status === 'support').length
    const revenue = projects.reduce((total, project) => total + Number(project.value || 0), 0)

    return [
      { title: 'Em andamento', value: active, note: 'Projetos para entregar' },
      { title: 'Aguardando cliente', value: waiting, note: 'Precisa retorno ou material' },
      { title: 'Suporte ativo', value: support, note: 'Clientes no pos-entrega' },
      {
        title: 'Valor em projetos',
        value: revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        note: 'Pipeline de entrega',
      },
    ]
  }, [projects])

  const createProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        value: Number(form.value || 0),
        deadline: form.deadline || null,
      }),
    })

    if (response.ok) {
      const project = await response.json()
      setProjects((current) => [project, ...current])
      setForm(blankForm)
      setShowForm(false)
    }

    setSaving(false)
  }

  const updateProject = async (id: string, patch: Partial<Project>) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      const project = await response.json()
      setProjects((current) => current.map((item) => (item.id === id ? project : item)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">Operacao de entrega</p>
            <h1 className="page-title">Projetos JV</h1>
            <p className="page-subtitle">
              Controle briefing, desenvolvimento, revisao do cliente, entrega e suporte dos sites e sistemas vendidos.
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setShowForm((current) => !current)}>
            <Plus size={17} />
            Novo projeto
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article className="sap-card metric-card" key={metric.title}>
            <div className="metric-top">
              <span>{metric.title}</span>
              <span className="metric-icon">
                <FolderKanban size={18} />
              </span>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">{metric.note}</div>
          </article>
        ))}
      </section>

      {showForm && (
        <form className="sap-card panel-body site-form-grid" onSubmit={createProject}>
          <label className="auth-field">
            <span className="auth-label">Titulo do projeto</span>
            <input className="auth-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Cliente</span>
            <input className="auth-input" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Tipo</span>
            <select className="auth-input" value={form.projectType} onChange={(event) => setForm({ ...form, projectType: event.target.value })}>
              {Object.entries(projectTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            <span className="auth-label">Valor</span>
            <input className="auth-input" type="number" min="0" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Prazo</span>
            <input className="auth-input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Proximo passo</span>
            <input className="auth-input" value={form.nextStep} onChange={(event) => setForm({ ...form, nextStep: event.target.value })} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={17} />
            {saving ? 'Salvando...' : 'Salvar projeto'}
          </button>
        </form>
      )}

      <section className="data-card-list">
        {projects.length === 0 ? (
          <article className="data-card text-center text-gray-500">Nenhum projeto cadastrado ainda.</article>
        ) : (
          projects.map((project) => {
            const status = statusInfo[project.status]
            const Icon = status.icon
            return (
              <article className="data-card" key={project.id}>
                <div className="toolbar">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900">{project.title}</h2>
                      <Badge variant={status.variant}>
                        <Icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.clientName} - {projectTypes[project.projectType] || project.projectType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </div>
                </div>

                <div className="project-progress" aria-label={`Progresso ${project.progress}%`}>
                  <span style={{ width: `${project.progress}%` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <label className="auth-field">
                    <span className="auth-label">Status</span>
                    <select className="auth-input" value={project.status} onChange={(event) => updateProject(project.id, { status: event.target.value as ProjectStatus })}>
                      {Object.entries(statusInfo).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="auth-field">
                    <span className="auth-label">Progresso</span>
                    <input className="auth-input" type="number" min="0" max="100" value={project.progress} onChange={(event) => updateProject(project.id, { progress: Number(event.target.value) })} />
                  </label>
                  <label className="auth-field">
                    <span className="auth-label">Proximo passo</span>
                    <input className="auth-input" value={project.nextStep || ''} onChange={(event) => updateProject(project.id, { nextStep: event.target.value })} />
                  </label>
                </div>

                <div className="toolbar mt-4">
                  <strong className="text-primary">
                    {Number(project.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                  <span className="text-sm text-gray-500">Atualizado em {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}
