'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, Instagram, Menu, X } from 'lucide-react'
import './public-site.css'
import PlanetIntro from '@/components/planet-intro'
import BuildText from '@/components/build-text'
import TerminalBuild from '@/components/terminal-build'

const featureOptions = [
  { id: 'mobile', label: 'Aplicativo mobile', value: 400 },
  { id: 'integrations', label: 'Integrações externas', value: 400 },
  { id: 'multi_company', label: 'Multiempresa', value: 400 },
  { id: 'subscription', label: 'Assinaturas/mensalidades', value: 400 },
  { id: 'fiscal', label: 'Nota fiscal/pagamentos', value: 400 },
  { id: 'advanced_reports', label: 'Relatórios avançados', value: 400 },
]

const projectTypes = {
  site: { label: 'Site profissional', base: 400 },
  landing: { label: 'Landing page de vendas', base: 400 },
  essential_system: { label: 'Sistema essencial', base: 400 },
  complete_system: { label: 'Sistema completo para empresa', base: 400 },
  ecommerce: { label: 'Loja virtual', base: 400 },
  app: { label: 'Aplicativo sob medida', base: 400 },
  automation: { label: 'Automação de processo', base: 400 },
}

const projectDescriptions: Record<string, string> = {
  site: 'Apresente sua empresa com identidade própria',
  landing: 'Uma página focada na sua oferta',
  essential_system: 'Organize o processo que mais precisa de atenção',
  complete_system: 'Conecte as áreas da sua operação',
  ecommerce: 'Venda seus produtos pela internet',
  app: 'Aproxime sua equipe e seus clientes',
  automation: 'Simplifique tarefas repetitivas',
}

const whatsappNumber = '5592991166859'

const urgencyLabels: Record<string, string> = {
  '15-30-dias': '15 a 30 dias',
  '30-60-dias': '30 a 60 dias',
  '60-90-dias': '60 a 90 dias',
  planejamento: 'Estou planejando',
}

export default function Home() {
  const [heroPhase, setHeroPhase] = useState<'static' | 'waiting' | 'running'>('static')
  const [heroElapsed, setHeroElapsed] = useState(0)
  const textElapsed = heroPhase === 'static' ? Infinity : heroElapsed
  const terminalReady = heroPhase === 'static' || (heroPhase === 'running' && heroElapsed >= 3900)
  useEffect(() => {
    if (heroPhase !== 'running') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setHeroElapsed(3900); return }
    const started = performance.now()
    const timer = window.setInterval(() => {
      const elapsed = Math.min(3900, performance.now() - started)
      setHeroElapsed(elapsed)
      if (elapsed === 3900) window.clearInterval(timer)
    }, 32)
    return () => window.clearInterval(timer)
  }, [heroPhase])
  const startHero = useCallback(() => setHeroPhase('running'), [])
  useEffect(() => { setHeroPhase(current => current === 'static' ? 'waiting' : current) }, [])
  const [quoteStep, setQuoteStep] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    projectType: 'essential_system',
    budgetRange: 'a-definir',
    urgency: '30-60-dias',
    message: '',
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

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
        '*Novo pedido de proposta - Site JV Sistemas*',
        '',
        `*Nome:* ${form.name}`,
        `*WhatsApp:* ${form.phone}`,
        `*Empresa:* ${form.companyName || 'Nao informada'}`,
        `*E-mail:* ${form.email || 'Nao informado'}`,
        `*Tipo de projeto:* ${project?.label || form.projectType}`,
        `*Prazo desejado:* ${urgencyLabels[form.urgency] || form.urgency}`,
        `*Extras:* ${extras.length > 0 ? extras.join(', ') : 'Nenhum'}`,
        '*Proposta:* A definir após alinhamento do escopo',
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
    <main className="jv-public" data-hero-phase={heroPhase}>
      <PlanetIntro onComplete={startHero} />
      <header className="jv-header">
        <Link href="/" className="jv-brand" aria-label="JV Sistemas & Tecnologia — início"><img src="/jv-sistemas-mark-transparent.png" alt="" /><span>JV SISTEMAS<small>& TECNOLOGIA</small></span></Link>
        <button className="jv-menu" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav id="public-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Navegação principal">
          <a href="#solucoes" onClick={() => setMenuOpen(false)}>O que fazemos</a><a href="#metodo" onClick={() => setMenuOpen(false)}>Como trabalhamos</a><a className="jv-nav-contact" href="#orcamento" onClick={() => setMenuOpen(false)}>Vamos conversar <ArrowUpRight size={16}/></a>
        </nav>
      </header>
      <section className="jv-hero">
        <div className="jv-grid-art" aria-hidden="true"><span>01 / ENGINEERING</span><span>JV_SYSTEMS :: BUILDING</span></div>
        <div className="jv-hero-copy"><p className="jv-eyebrow"><i/> <BuildText elapsed={textElapsed} text="SOFTWARE SOB MEDIDA. NEGÓCIOS EM MOVIMENTO." speed={12} /></p>
          <h1><BuildText elapsed={textElapsed} text="Seu próximo" delay={650} speed={35}/><br/><BuildText elapsed={textElapsed} text="nível começa" delay={1035} speed={35}/><br/><BuildText elapsed={textElapsed} text="com " delay={1490} speed={35}/><em><BuildText elapsed={textElapsed} text="código." delay={1630} speed={35}/></em><span className="jv-cursor" aria-hidden="true">_</span></h1>
          <p className="jv-intro"><BuildText elapsed={textElapsed} text="Transformamos processos complexos em sistemas que fazem sentido. Sites, aplicativos e software feitos para a realidade da sua empresa." delay={2100} speed={12}/></p>
          <a className="jv-button" href="#orcamento">Tirar meu projeto do papel <ArrowUpRight size={20}/></a>
        </div>
        <div className="jv-terminal" data-ready={terminalReady} aria-hidden={!terminalReady} aria-label="Animação ilustrativa de desenvolvimento de software">
          <div className="jv-terminal-bar"><span><i/><i/><i/></span><span>jv / seu-proximo-projeto</span><span>⌘</span></div>
          <TerminalBuild active={terminalReady && heroPhase === 'running'} />
          <div className="jv-terminal-footer"><span><i/> CONCEITO DE DESENVOLVIMENTO</span><span>UTF-8 / BR</span></div>
        </div>
        <div className="jv-hero-bottom"><span>DESENVOLVIMENTO COM PROPÓSITO</span><a href="#solucoes">Explore as possibilidades ↓</a><span>MANAUS · PORTO ALEGRE · BRASIL</span></div>
      </section>
      <div className="jv-stack" aria-label="Áreas de atuação"><span>WEB DEVELOPMENT</span><b>/</b><span>SISTEMAS DE GESTÃO</span><b>/</b><span>APLICATIVOS</span><b>/</b><span>AUTOMAÇÃO</span></div>
      <section className="jv-section" id="solucoes"><div className="jv-section-head"><p className="jv-eyebrow">01 — O QUE FAZEMOS</p><h2>Menos tarefas manuais.<br/><span>Mais espaço para crescer.</span></h2><p>Da presença digital ao controle da operação, desenvolvemos a tecnologia que acompanha o seu negócio.</p></div>
        <div className="jv-service-list">{[
          ['01','Sites & experiências digitais','Uma presença à altura da sua empresa. Sites institucionais, landing pages e lojas virtuais com identidade própria.','PRESENÇA DIGITAL'],
          ['02','Sistemas que conectam sua empresa','Financeiro, vendas, estoque e clientes no mesmo fluxo. Regras e módulos desenhados para a sua operação.','GESTÃO & ERP'],
          ['03','Aplicativos & integrações','Conecte sua equipe e seus clientes. Aplicações web e mobile, integrações entre ferramentas e automação de processos.','CONEXÃO & AUTOMAÇÃO'],
          ['04','Tecnologia para logística','Controle de entregas, motoristas, veículos e rotas. Uma visão mais clara de cada etapa da operação.','LOGÍSTICA & TRANSPORTE']
        ].map(([number,title,description,tag])=><a href="#orcamento" className="jv-service" key={number}><span className="jv-service-number">/{number}</span><div><span className="jv-service-tag">{tag}</span><h3>{title}</h3><p>{description}</p></div><ArrowUpRight aria-hidden="true"/></a>)}</div>
      </section>
      <section id="metodo" className="jv-method jv-section"><div><p className="jv-eyebrow">02 — NOSSO PROCESSO</p><h2>Gente que entende.<br/><span>Código que resolve.</span></h2><p>Você participa das decisões. A gente cuida da tecnologia e mantém a conversa clara, do primeiro alinhamento à evolução do sistema.</p><a className="jv-text-link" href="https://wa.me/5592991166859" target="_blank" rel="noreferrer">Fale direto com a JV <ArrowUpRight size={18}/></a></div><ol>{[
          ['Escutar antes de programar','Conhecemos sua rotina, os gargalos e o que você quer alcançar.'],
          ['Desenhar o caminho','Alinhamos escopo, telas e prioridades para construir uma solução com direção.'],
          ['Desenvolver e acompanhar','Implementamos, orientamos o uso e acompanhamos os próximos passos.']
        ].map(([title,text],index)=><li key={title}><span>0{index+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
      <section id="orcamento" className="jv-quote jv-section">
        <div className="jv-quote-copy">
          <p className="jv-eyebrow">03 — VAMOS CONSTRUIR</p>
          <h2>Seu desafio.<br/><span>Uma solução com direção.</span></h2>
          <p>Conte o que precisa melhorar na sua empresa. A gente entende a operação e prepara uma proposta com escopo, prazo e investimento definidos.</p>
          <div className="jv-proposal-price"><span>INVESTIMENTO INICIAL</span><p>Projetos a partir de <strong>R$ 400</strong></p><small>Valor para projetos de escopo inicial. A proposta é personalizada conforme as funcionalidades e integrações necessárias.</small></div>
          <div className="jv-proposal-next"><span>DEPOIS DO SEU CONTATO</span><ol><li><b>01</b> Entendemos sua necessidade</li><li><b>02</b> Definimos o escopo e as prioridades</li><li><b>03</b> Apresentamos a proposta para você avaliar</li></ol></div>
          <a className="jv-text-link" href="https://wa.me/5592991166859" target="_blank" rel="noreferrer">Conversar direto pelo WhatsApp <ArrowUpRight size={18}/></a>
        </div>
        <form className="site-quote-form jv-brief" onSubmit={handleQuoteSubmit}>
          <div className="jv-brief-progress" aria-label={`Etapa ${quoteStep} de 2`}><span className={quoteStep === 1 ? 'current' : 'done'}>01 / SEU PROJETO</span><span className={quoteStep === 2 ? 'current' : ''}>02 / VAMOS CONVERSAR</span></div>
          {quoteStep === 1 ? <div className="jv-brief-stage">
            <h3>O que vamos construir?</h3><p className="jv-brief-hint">Selecione o tipo de projeto. Se ainda estiver em dúvida, escolha o mais próximo da sua ideia.</p>
            <div className="jv-project-picker" role="group" aria-label="Tipo de projeto">{Object.entries(projectTypes).map(([value, project]) => <button key={value} type="button" aria-pressed={form.projectType === value} className={form.projectType === value ? 'selected' : ''} onClick={() => setForm({...form, projectType: value})}><span>{project.label}</span><small>{projectDescriptions[value]}</small><ArrowUpRight size={16}/></button>)}</div>
          <p className="site-form-section-label">O que precisa fazer parte? (opcional)</p>
          <div className="site-feature-picker" aria-label="O que precisa fazer parte? (opcional)">
            {featureOptions.map((feature) => (
              <button
                type="button"
                key={feature.id}
                aria-pressed={selectedFeatures.includes(feature.id)}
                className={selectedFeatures.includes(feature.id) ? 'active' : ''}
                onClick={() => toggleFeature(feature.id)}
              >
                {feature.label}
              </button>
            ))}
          </div>

          <label>
            Qual problema você quer resolver?
            <textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Ex.: hoje controlo pedidos em planilhas e preciso acompanhar as entregas em um só lugar."
            />
          </label>


            <button className="site-primary-cta site-submit-quote" type="button" onClick={() => setQuoteStep(2)}>Continuar para contato <ArrowRight size={18}/></button>
          </div> : <div className="jv-brief-stage">
            <h3>Como podemos falar com você?</h3><p className="jv-brief-hint">Seu projeto: {projectTypes[form.projectType as keyof typeof projectTypes].label}. Vamos alinhar o escopo pelo WhatsApp.</p>
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
                type="tel" placeholder="(92) 99116-6859"
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


            <div className="jv-brief-actions"><button type="button" className="jv-back" onClick={() => setQuoteStep(1)}>← Voltar</button><button className="site-primary-cta site-submit-quote" type="submit" disabled={quoteStatus === 'sending'}>{quoteStatus === 'sending' ? 'Enviando...' : 'Solicitar proposta pelo WhatsApp'}<ArrowUpRight size={18}/></button></div>
            <p className="jv-brief-privacy">Usaremos seus dados apenas para responder ao seu pedido. O pedido de proposta é sem compromisso e não gera cobrança.</p>
          {quoteStatus === 'success' && (
            <p className="site-form-success">Pedido recebido. Em breve a JV Sistemas entra em contato.</p>
          )}
          {quoteStatus === 'error' && (
            <p className="site-form-error">Não foi possível enviar agora. Tente novamente ou fale pelo link de WhatsApp ao lado.</p>
          )}
          </div>}
        </form>
      </section>
      <footer className="jv-footer"><div className="jv-footer-top"><p>Seu negócio tem um próximo nível.<br/><a href="#orcamento">Vamos construir. <ArrowUpRight/></a></p><a href="https://www.instagram.com/jvsistemas.br" target="_blank" rel="noreferrer" aria-label="Instagram da JV Sistemas"><Instagram size={22}/></a></div><div className="jv-footer-bottom"><span>© {new Date().getFullYear()} JV Sistemas & Tecnologia</span><span>TECNOLOGIA FEITA PARA A SUA REALIDADE.</span><Link href="/login">Acesso JV ↗</Link></div></footer>
    </main>
  )
}
