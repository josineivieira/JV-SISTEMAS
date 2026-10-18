'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { sapTransactionByPath, sapTransactions } from '@/lib/sap-navigation'
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  FolderPlus,
  Grid3X3,
  HelpCircle,
  Headphones,
  Menu,
  Printer,
  RefreshCw,
  Save,
  Search,
  User,
  X,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const commandRef = useRef<HTMLInputElement>(null)
  const [sapMessage, setSapMessage] = useState('Pronto')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const handleMessage = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      setSapMessage(customEvent.detail || 'Operacao executada')
    }

    window.addEventListener('sap-message', handleMessage)
    return () => window.removeEventListener('sap-message', handleMessage)
  }, [])

  useEffect(() => {
    const desktopApi = (window as typeof window & {
      jvDesktop?: { onLogout?: (callback: () => void) => void }
    }).jvDesktop

    desktopApi?.onLogout?.(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    })
  }, [])

  const runTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const rawCommand = String(formData.get('command') || '')
    const code = rawCommand
      .replace(/^\/n/i, '')
      .replace(/^\/o/i, '')
      .trim()
      .toUpperCase()

    const nextRoute = sapTransactions[code]
    if (nextRoute) {
      router.push(nextRoute)
      setSapMessage(`Transacao ${code} chamada`)
    } else {
      setSapMessage(`Transacao ${code || rawCommand} nao encontrada`)
    }
  }

  const currentCommand = sapTransactionByPath[pathname || '/dashboard'] || '/n ZJV_DASH'

  const setFavorite = () => {
    const favorite = {
      name: document.title?.replace('JV Sistemas - ', '') || 'Transacao atual',
      code: currentCommand.replace(/^\/n\s*/i, ''),
      href: pathname || '/dashboard',
    }
    const stored = localStorage.getItem('jv_sap_favorites')
    const favorites = stored ? JSON.parse(stored) : []
    const nextFavorites = [favorite, ...favorites.filter((item: typeof favorite) => item.href !== favorite.href)].slice(0, 12)
    localStorage.setItem('jv_sap_favorites', JSON.stringify(nextFavorites))
    window.dispatchEvent(new CustomEvent('sap-favorites-changed'))
    setSapMessage(`${favorite.code} salvo em Favoritos`)
  }

  const menuGroups = [
    {
      label: 'Sistema',
      items: [
        ['Nova sessao', () => setSapMessage('Sessao paralela simulada para o mandante 100')],
        ['Criar atalho', setFavorite],
        ['Sair do sistema', () => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
        }],
      ],
    },
    {
      label: 'Editar',
      items: [
        ['Selecionar tudo', () => window.dispatchEvent(new CustomEvent('sap-select-all'))],
        ['Copiar linha', () => window.dispatchEvent(new CustomEvent('sap-copy-row'))],
        ['Modificar', () => setSapMessage('Modo modificacao solicitado')],
      ],
    },
    {
      label: 'Favoritos',
      items: [
        ['Adicionar favorito', setFavorite],
        ['Organizar favoritos', () => setSapMessage('Use o botao direito na arvore para renomear, excluir ou executar')],
        ['Abrir Easy Access', () => router.push('/dashboard')],
      ],
    },
    {
      label: 'Extras',
      items: [
        ['Exportar ALV', () => window.dispatchEvent(new CustomEvent('sap-export'))],
        ['Layout atual', () => setSapMessage('Layout ALV JV_LOG ativo')],
        ['Imprimir', () => window.print()],
      ],
    },
    {
      label: 'Ambiente',
      items: [
        ['Fluxo de documentos', () => window.dispatchEvent(new CustomEvent('sap-show-flow'))],
        ['Dados tecnicos', () => setSapMessage(`Programa SAPL${currentCommand.replace('/n ', '')} | Dynpro 0100`)],
        ['Customizing SPRO', () => router.push('/dashboard/system-config')],
      ],
    },
    {
      label: 'Ajuda',
      items: [
        ['Ajuda da aplicacao', () => setSapMessage('Transacoes: VA01, VA05, VT01N, VF01, FBL5N, SPRO')],
        ['Sobre', () => setSapMessage('JV Sistemas - SAP GUI comercial, mandante 100')],
      ],
    },
  ] as const

  return (
    <div className="erp-shell">
      <header className="erp-topbar">
        <div className="sap-titlebar">
          <div className="erp-brand-block">
            <img src="/jv-sistemas-mark-transparent.png" alt="JV Sistemas" />
            <div>
              <strong>JV Sistemas - SAP GUI</strong>
              <span>ERP comercial</span>
            </div>
          </div>

          <nav className="sap-menu-bar" aria-label="Menu SAP" onMouseLeave={() => setOpenMenu(null)}>
            {menuGroups.map((group) => (
              <div className="sap-menu-root" key={group.label}>
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                  onMouseEnter={() => openMenu && setOpenMenu(group.label)}
                >
                  {group.label}
                </button>
                {openMenu === group.label && (
                  <div className="sap-menu-dropdown">
                    {group.items.map(([label, action]) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => {
                          action()
                          setOpenMenu(null)
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="erp-window-actions" aria-label="Janela">
            <span />
            <Grid3X3 size={16} aria-hidden="true" />
            <X size={21} aria-hidden="true" />
          </div>
        </div>

        <div className="sap-toolbar">
          <form className="sap-command-field" onSubmit={runTransaction}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <input
              ref={commandRef}
              name="command"
              aria-label="Campo de comando"
              defaultValue={currentCommand}
              key={currentCommand}
            />
          </form>

          <div className="erp-top-actions" aria-label="Acoes rapidas">
            <button type="button" aria-label="Menu">
              <Menu size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Adicionar favorito" onClick={setFavorite}>
              <FolderPlus size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Salvar"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('sap-save'))
                setSapMessage('Comando salvar enviado')
              }}
            >
              <Save size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Buscar" onClick={() => commandRef.current?.focus()}>
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Atualizar" onClick={() => router.refresh()}>
              <RefreshCw size={17} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Imprimir" onClick={() => window.print()}>
              <Printer size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Ajuda" onClick={() => alert('Digite /n seguido do codigo da transacao. Ex: /n ZJV_SHIP')}>
              <HelpCircle size={18} aria-hidden="true" />
            </button>
          </div>

          <section className="erp-company-block">
            <ExternalLink size={17} aria-hidden="true" />
            <div>
              <strong>JV SISTEMAS & TECNOLOGIA</strong>
              <span>Mandante 100 - Produção</span>
            </div>
          </section>

          <div className="erp-support-actions" aria-label="Suporte">
            <Headphones size={18} aria-hidden="true" />
            <Bell size={17} aria-hidden="true" />
          </div>

          <section className="erp-user-block">
            <span className="erp-user-avatar">
              <User size={25} aria-hidden="true" />
            </span>
            <div>
              <strong>JOSINEI</strong>
              <span>Usuário online</span>
            </div>
          </section>
        </div>
      </header>

      <div className="erp-body">
        <Sidebar />
        <div className="sap-main erp-main">
          {children}
        </div>
      </div>
      <footer className="sap-statusbar">
        <span />
        <strong>{sapMessage}</strong>
        <small>Mandante 100</small>
        <small>JOSINEI</small>
        <small>INS</small>
      </footer>
    </div>
  )
}
