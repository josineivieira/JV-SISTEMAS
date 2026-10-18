'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Code2,
  Headphones,
  Instagram,
  LifeBuoy,
  Lock,
  MonitorSmartphone,
  PackageCheck,
  Rocket,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'

const featureOptions = [
  { id: 'mobile', label: 'Aplicativo mobile', value: 3500 },
  { id: 'integrations', label: 'Integracoes externas', value: 2500 },
  { id: 'multi_company', label: 'Multiempresa', value: 1800 },
  { id: 'subscription', label: 'Assinaturas/mensalidades', value: 1800 },
  { id: 'fiscal', label: 'Nota fiscal/pagamentos', value: 3000 },
  { id: 'advanced_reports', label: 'Relatorios avancados', value: 1200 },
]

const projectTypes = {
  site: { label: 'Site profissional', base: 500 },
  landing: { label: 'Landing page de vendas', base: 400 },
  essential_system: { label: 'Sistema essencial', base: 4500 },
  complete_system: { label: 'Sistema completo para empresa', base: 7500 },
  ecommerce: { label: 'Loja virtual', base: 5500 },
  app: { label: 'Aplicativo sob medida', base: 12000 },
  automation: { label: 'Automacao de processo', base: 2800 },
}

const whatsappNumber = '5592991166859'

const urgencyLabels: Record<string, string> = {
  '15-30-dias': '15 a 30 dias',
  '30-60-dias': '30 a 60 dias',
  '60-90-dias': '60 a 90 dias',
  planejamento: 'Estou planejando',
}

export default function Home() {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    projectType: 'complete_system',
    budgetRange: 'a-definir',
    urgency: '30-60-dias',
    message: '',
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const services = [
    {
      icon: Truck,
      title: 'Logistica e transportadoras',
      description: 'Controle entregas, motoristas, veiculos, rotas e status em tempo real.',
    },
    {
      icon: MonitorSmartphone,
      title: 'Aplicativos sob medida',
      description: 'Apps web e mobile pensados para sua operacao e para seus clientes.',
    },
    {
      icon: BarChart3,
      title: 'Sistemas completos',
      description: 'Gestao financeira, estoque, vendas, clientes, usuarios e relatorios.',
    },
    {
      icon: Code2,
      title: 'Tudo com sua marca',
      description: 'Sistema personalizado com identidade visual, logo e regras da empresa.',
    },
  ]

  const pillars = [
    { icon: ShieldCheck, title: '100% seguro', text: 'Dados protegidos e acesso por usuario.' },
    { icon: Cloud, title: 'Acesso de onde estiver', text: 'Sistema online, pronto para o dia a dia.' },
    { icon: Lock, title: 'Personalizado', text: 'Do seu jeito, com as regras da sua empresa.' },
    { icon: Headphones, title: 'Suporte especializado', text: 'Atendimento proximo, rapido e humano.' },
  ]

  const workflow = [
    'Entendemos sua operacao e os gargalos do dia a dia.',
    'Desenhamos telas, regras e modulos com foco no seu negocio.',
    'Entregamos, treinamos e acompanhamos a evolucao do sistema.',
  ]

  const estimate = useMemo(() => {
    const project = projectTypes[form.projectType as keyof typeof projectTypes]
    const extras = featureOptions
      .filter((feature) => selectedFeatures.includes(feature.id))
      .reduce((total, feature) => total + feature.value, 0)

    return (project?.base || 2500) + extras
  }, [form.projectType, selectedFeatures])

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((current) =>
      current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId]
    )
  }

  const handleQuoteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuoteStatus('sending')

    try {
      const project = projectTypes[form.projectType as keyof typeof projectTypes]
      const extras = featureOptions
        .filter((feature) => selectedFeatures.includes(feature.id))
        .map((feature) => feature.label)
      const whatsappMessage = [
        '*Nova simulacao de projeto - Site JV Sistemas*',
        '',
        `*Nome:* ${form.name}`,
        `*WhatsApp:* ${form.phone}`,
        `*Empresa:* ${form.companyName || 'Nao informada'}`,
        `*E-mail:* ${form.email || 'Nao informado'}`,
        `*Tipo de projeto:* ${project?.label || form.projectType}`,
        `*Prazo desejado:* ${urgencyLabels[form.urgency] || form.urgency}`,
        `*Extras:* ${extras.length > 0 ? extras.join(', ') : 'Nenhum'}`,
        `*Estimativa inicial:* ${estimate.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        })}`,
        `*Ideia:* ${form.message || 'Nao informada'}`,
      ].join('\n')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiUrl}/leads/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          features: selectedFeatures,
        }),
      })

      if (!response.ok) throw new Error('Erro ao enviar orcamento')

      setQuoteStatus('success')
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    } catch (error) {
      console.error(error)
      setQuoteStatus('error')
    }
  }

  return (
    <main className="site-page">
      <section className="site-hero">
        <nav className="site-nav" aria-label="Principal">
          <Link href="/" className="site-brand">
            <span className="site-brand-logo">
              <img src="/jv-sistemas-mark-transparent.png" alt="JV Sistemas" />
            </span>
            <span className="site-brand-text">
              <strong>JV Sistemas</strong>
              <small>& Tecnologia</small>
            </span>
          </Link>
          <div className="site-nav-actions">
            <Link href="#solucoes" className="site-nav-link">
              Solucoes
            </Link>
            <Link href="#orcamento" className="site-nav-link">
              Orcamento
            </Link>
            <Link href="#suporte" className="site-nav-link">
              Metodo
            </Link>
            <a
              href="https://www.instagram.com/jvsistemas.br?igsh=MWFpMzY3dzcydXRqOA=="
              className="site-nav-icon"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da JV Sistemas"
            >
              <Instagram size={18} aria-hidden="true" />
            </a>
          </div>
        </nav>

        <div className="site-hero-grid">
          <div className="site-hero-copy">
            <p className="site-kicker">
              <Rocket size={18} aria-hidden="true" />
              Tecnologia que transforma empresas
            </p>
            <h1>Sua empresa precisa de um sistema proprio?</h1>
            <p className="site-hero-text">
              Desenvolvemos sites, sistemas e aplicativos personalizados para qualquer tipo de
              empresa, com painel de gestao, controle financeiro, vendas, estoque e atendimento.
            </p>
            <div className="site-hero-actions">
              <Link className="site-primary-cta" href="#orcamento">
                Simular orcamento
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="site-secondary-cta" href="#solucoes">
                Ver solucoes
              </Link>
            </div>
          </div>

          <div className="site-product-visual" aria-label="Previa do sistema JV Sistemas">
            <div className="site-laptop">
              <div className="site-laptop-top">
                <span />
                <strong>Dashboard</strong>
                <small>ao vivo</small>
              </div>
              <div className="site-stat-row">
                <div>
                  <span>Entregas hoje</span>
                  <strong>128</strong>
                </div>
                <div>
                  <span>Em andamento</span>
                  <strong>73</strong>
                </div>
                <div>
                  <span>Concluidas</span>
                  <strong>55</strong>
                </div>
              </div>
              <div className="site-dashboard-grid">
                <div className="site-map-panel">
                  <span className="site-route-point point-a" />
                  <span className="site-route-point point-b" />
                  <span className="site-route-point point-c" />
                  <span className="site-route-line line-a" />
                  <span className="site-route-line line-b" />
                </div>
                <div className="site-list-panel">
                  {['Entrega #1256', 'Venda #4821', 'Cliente aprovado'].map((item) => (
                    <div key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="site-phone">
              <div className="site-phone-bar" />
              <strong>Entrega #1256</strong>
              <span>Em andamento</span>
              <button type="button">Iniciar entrega</button>
            </div>
            <div className="site-truck-card">
              <Truck size={34} aria-hidden="true" />
              <span>Controle completo de rotas e operacoes</span>
            </div>
          </div>
        </div>
      </section>

      <section id="solucoes" className="site-section">
        <div className="site-section-heading">
          <p className="site-kicker">Solucoes sob medida</p>
          <h2>Sistema para sua empresa vender, atender e controlar melhor.</h2>
        </div>
        <div className="site-services">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article className="site-service-card" key={service.title}>
                <span className="site-service-icon">
                  <Icon size={25} aria-hidden="true" />
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="site-trust-band" aria-label="Diferenciais">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div className="site-pillar" key={pillar.title}>
              <Icon size={28} aria-hidden="true" />
              <div>
                <strong>{pillar.title}</strong>
                <span>{pillar.text}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section id="orcamento" className="site-quote-section">
        <div className="site-quote-copy">
          <p className="site-kicker">
            <Sparkles size={18} aria-hidden="true" />
            Simulador de projeto
          </p>
          <h2>Simule seu sistema e envie o pedido direto para a JV.</h2>
          <p>
            Esse valor e uma estimativa inicial. Nossa equipe analisa sua necessidade e retorna
            com uma proposta personalizada pelo seu canal de contato.
          </p>
          <p className="site-quote-note">
            Sistemas ja consideram cadastro, painel, vendas/controle principal e relatorios
            basicos. Marque apenas recursos extras fora do pacote comum.
          </p>
          <div className="site-estimate-box">
            <span>Estimativa inicial</span>
            <strong>
              A partir de{' '}
              {estimate.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })}
            </strong>
          </div>
        </div>

        <form className="site-quote-form" onSubmit={handleQuoteSubmit}>
          <div className="site-form-grid">
            <label>
              Nome
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Seu nome"
              />
            </label>
            <label>
              WhatsApp
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="(92) 99116-6859"
              />
            </label>
            <label>
              Empresa
              <input
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                placeholder="Nome da empresa"
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="contato@empresa.com"
              />
            </label>
            <label>
              Tipo de projeto
              <select
                value={form.projectType}
                onChange={(event) => setForm({ ...form, projectType: event.target.value })}
              >
                {Object.entries(projectTypes).map(([value, project]) => (
                  <option key={value} value={value}>
                    {project.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prazo desejado
              <select
                value={form.urgency}
                onChange={(event) => setForm({ ...form, urgency: event.target.value })}
              >
                <option value="15-30-dias">15 a 30 dias</option>
                <option value="30-60-dias">30 a 60 dias</option>
                <option value="60-90-dias">60 a 90 dias</option>
                <option value="planejamento">Estou planejando</option>
              </select>
            </label>
          </div>

          <p className="site-form-section-label">Extras opcionais</p>
          <div className="site-feature-picker" aria-label="Extras opcionais">
            {featureOptions.map((feature) => (
              <button
                type="button"
                key={feature.id}
                className={selectedFeatures.includes(feature.id) ? 'active' : ''}
                onClick={() => toggleFeature(feature.id)}
              >
                {feature.label}
              </button>
            ))}
          </div>

          <label>
            Descreva sua ideia
            <textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Ex: preciso controlar vendas, clientes, mensalidades, contratos e chamados..."
            />
          </label>

          <button className="site-primary-cta site-submit-quote" type="submit" disabled={quoteStatus === 'sending'}>
            {quoteStatus === 'sending' ? 'Enviando...' : 'Enviar pelo WhatsApp'}
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          {quoteStatus === 'success' && (
            <p className="site-form-success">Pedido recebido. Em breve a JV Sistemas entra em contato.</p>
          )}
          {quoteStatus === 'error' && (
            <p className="site-form-error">Nao foi possivel enviar agora. Confira a API e tente novamente.</p>
          )}
        </form>
      </section>

      <section className="site-client-section">
        <div className="site-client-copy">
          <p className="site-kicker">Atendimento personalizado</p>
          <h2>Da primeira ideia ao sistema pronto para sua empresa usar.</h2>
          <p>
            A JV Sistemas entende sua rotina, identifica o que precisa ser automatizado e cria
            uma solucao sob medida para sua operacao crescer com mais controle.
          </p>
        </div>
        <div className="site-client-grid">
          <Link href="#orcamento" className="site-client-card">
            <Sparkles size={28} aria-hidden="true" />
            <strong>Diagnostico inicial</strong>
            <span>Voce envia sua ideia e recebe uma avaliacao clara do melhor caminho.</span>
          </Link>
          <a className="site-client-card" href="https://wa.me/5592991166859" target="_blank" rel="noreferrer">
            <LifeBuoy size={28} aria-hidden="true" />
            <strong>Contato direto</strong>
            <span>Atendimento pelo WhatsApp para tirar duvidas e alinhar detalhes.</span>
          </a>
          <a
            className="site-client-card"
            href="https://www.instagram.com/jvsistemas.br?igsh=MWFpMzY3dzcydXRqOA=="
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={28} aria-hidden="true" />
            <strong>Instagram</strong>
            <span>Acompanhe novidades, projetos e solucoes da JV Sistemas.</span>
          </a>
        </div>
      </section>

      <section id="suporte" className="site-process-section">
        <div>
          <p className="site-kicker">Metodo JV</p>
          <h2>Do primeiro contato ao sistema rodando.</h2>
        </div>
        <div className="site-process-list">
          {workflow.map((item, index) => (
            <article className="site-process-item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-final-cta">
        <PackageCheck size={34} aria-hidden="true" />
        <h2>Vamos criar juntos a solucao ideal para sua empresa.</h2>
        <Link className="site-primary-cta" href="#orcamento">
          Simular projeto
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <footer className="site-footer">
        <div className="site-footer-brand">
          <img src="/jv-sistemas-logo-transparent.png" alt="JV Sistemas & Tecnologia" />
          <div>
            <strong>JV Sistemas & Tecnologia</strong>
            <span>Solucoes inteligentes para o seu negocio.</span>
          </div>
        </div>
        <div className="site-footer-links">
          <Link href="#orcamento">Orcamento</Link>
          <a href="https://wa.me/5592991166859" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a
            href="https://www.instagram.com/jvsistemas.br?igsh=MWFpMzY3dzcydXRqOA=="
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <Link href="/login" aria-label="Acesso administrativo JV Sistemas">
            Acesso JV
          </Link>
        </div>
      </footer>
    </main>
  )
}
