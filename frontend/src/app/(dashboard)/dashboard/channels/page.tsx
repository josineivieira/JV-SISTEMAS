'use client'

import { ExternalLink, Instagram, MessageCircle, Plug, ShieldCheck } from 'lucide-react'

const whatsappUrl = 'https://wa.me/5592991166859'
const instagramUrl = 'https://www.instagram.com/jvsistemas.br?igsh=MWFpMzY3dzcydXRqOA=='

const integrations = [
  {
    title: 'WhatsApp comercial',
    status: 'Pronto para atendimento',
    description: 'Link direto para falar com a JV Sistemas pelo numero 92 99116-6859.',
    href: whatsappUrl,
    icon: MessageCircle,
  },
  {
    title: 'Instagram da JV',
    status: 'Perfil publico conectado',
    description: 'Canal para portfolio, novidades, bastidores de projetos e prova social.',
    href: instagramUrl,
    icon: Instagram,
  },
  {
    title: 'API WhatsApp Business',
    status: 'Aguardando token Meta',
    description: 'Para enviar mensagens automaticas pelo ERP precisa criar app Meta, numero oficial e token.',
    href: 'https://developers.facebook.com/',
    icon: Plug,
  },
  {
    title: 'Instagram Graph API',
    status: 'Aguardando permissao',
    description: 'Para puxar dados reais de midia e mensagens precisa conta profissional e permissoes da Meta.',
    href: 'https://developers.facebook.com/',
    icon: ShieldCheck,
  },
]

export default function ChannelsPage() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-content">
          <div>
            <p className="eyebrow">Atendimento e integracoes</p>
            <h1 className="page-title">Canais JV</h1>
            <p className="page-subtitle">
              Central para seus contatos comerciais, redes sociais e preparacao das APIs oficiais de WhatsApp e Instagram.
            </p>
          </div>
          <a className="btn btn-secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={17} />
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="sap-card metric-card">
          <div className="metric-top"><span>WhatsApp</span><span className="metric-icon"><MessageCircle size={18} /></span></div>
          <div className="metric-value">92 99116-6859</div>
          <div className="metric-note">Contato principal de vendas</div>
        </article>
        <article className="sap-card metric-card">
          <div className="metric-top"><span>Instagram</span><span className="metric-icon"><Instagram size={18} /></span></div>
          <div className="metric-value">@jvsistemas.br</div>
          <div className="metric-note">Portfolio e autoridade</div>
        </article>
        <article className="sap-card metric-card">
          <div className="metric-top"><span>Leads do site</span><span className="metric-icon"><Plug size={18} /></span></div>
          <div className="metric-value">ERP</div>
          <div className="metric-note">Simulador cai em Orcamentos</div>
        </article>
        <article className="sap-card metric-card">
          <div className="metric-top"><span>Automacao</span><span className="metric-icon"><ShieldCheck size={18} /></span></div>
          <div className="metric-value">Meta</div>
          <div className="metric-note">Precisa credenciais oficiais</div>
        </article>
      </section>

      <section className="data-card-list">
        {integrations.map((item) => {
          const Icon = item.icon
          return (
            <article className="data-card" key={item.title}>
              <div className="toolbar">
                <div className="flex items-start gap-4">
                  <span className="metric-icon"><Icon size={20} /></span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                    <p className="text-sm text-primary font-bold mt-1">{item.status}</p>
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  </div>
                </div>
                <a className="btn btn-secondary" href={item.href} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  Abrir
                </a>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
