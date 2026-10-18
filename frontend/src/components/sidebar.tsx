'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sapNavigationGroups, type SapNavigationItem } from '@/lib/sap-navigation'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Folder,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'

type FavoriteItem = {
  name: string
  code: string
  href: string
}

type ContextMenuState = {
  x: number
  y: number
  item: FavoriteItem | SapNavigationItem
  favorite: boolean
} | null

interface SidebarProps {
  className?: string
}

const fallbackFavorites: FavoriteItem[] = sapNavigationGroups[0].items.map((item) => ({
  name: item.name,
  code: item.code,
  href: item.href,
}))

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>(fallbackFavorites)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  const loadFavorites = () => {
    const stored = localStorage.getItem('jv_sap_favorites')
    setFavorites(stored ? JSON.parse(stored) : fallbackFavorites)
  }

  useEffect(() => {
    loadFavorites()
    window.addEventListener('sap-favorites-changed', loadFavorites)
    window.addEventListener('click', () => setContextMenu(null))
    return () => {
      window.removeEventListener('sap-favorites-changed', loadFavorites)
    }
  }, [])

  const navigationGroups = useMemo(
    () => [
      {
        ...sapNavigationGroups[0],
        items: favorites.map((favorite) => ({ ...favorite, icon: Star, section: 'Favoritos' })),
      },
      ...sapNavigationGroups.slice(1),
    ],
    [favorites]
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const addFavorite = (item: FavoriteItem | SapNavigationItem) => {
    const favorite = { name: item.name, code: item.code, href: item.href }
    const nextFavorites = [favorite, ...favorites.filter((current) => current.href !== favorite.href)].slice(0, 12)
    localStorage.setItem('jv_sap_favorites', JSON.stringify(nextFavorites))
    setFavorites(nextFavorites)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${favorite.code} salvo em Favoritos` }))
  }

  const removeFavorite = (item: FavoriteItem | SapNavigationItem) => {
    const nextFavorites = favorites.filter((favorite) => favorite.href !== item.href)
    localStorage.setItem('jv_sap_favorites', JSON.stringify(nextFavorites))
    setFavorites(nextFavorites)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${item.code} removido de Favoritos` }))
  }

  const renameFavorite = (item: FavoriteItem | SapNavigationItem) => {
    const nextName = prompt('Novo nome do favorito', item.name)
    if (!nextName) return
    const nextFavorites = favorites.map((favorite) =>
      favorite.href === item.href ? { ...favorite, name: nextName } : favorite
    )
    localStorage.setItem('jv_sap_favorites', JSON.stringify(nextFavorites))
    setFavorites(nextFavorites)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${item.code} renomeado em Favoritos` }))
  }

  const copyTransaction = (item: FavoriteItem | SapNavigationItem) => {
    navigator.clipboard?.writeText(`/n ${item.code}`)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `/n ${item.code} copiado` }))
  }

  const showContextMenu = (
    event: React.MouseEvent,
    item: FavoriteItem | SapNavigationItem,
    favorite: boolean
  ) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, item, favorite })
  }

  return (
    <aside className={cn('sidebar', className)}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo sidebar-logo-image">
            <img src="/jv-sistemas-mark-transparent.png" alt="JV Sistemas" />
          </div>
          <div>
            <h1 className="sidebar-title">SAP Easy Access</h1>
            <p className="sidebar-subtitle">Menu usuario - JV Sistemas</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Menu principal">
        {navigationGroups.map((group, groupIndex) => (
          <details className="sap-menu-folder" key={group.name} open={group.defaultOpen}>
            <summary>
              <ChevronRight className="folder-closed" size={13} aria-hidden="true" />
              <ChevronDown className="folder-open" size={13} aria-hidden="true" />
              <Folder size={14} aria-hidden="true" />
              <span>{group.name}</span>
            </summary>

            <div className="sap-menu-folder-items">
              {Array.from(new Set(group.items.map((item) => item.section))).map((section) => (
                <details className="sap-menu-subfolder" key={section} open={group.name === 'Favoritos'}>
                  <summary>
                    <ChevronRight className="folder-closed" size={12} aria-hidden="true" />
                    <ChevronDown className="folder-open" size={12} aria-hidden="true" />
                    <Folder size={13} aria-hidden="true" />
                    <span>{section}</span>
                  </summary>
                  <div className="sap-menu-subfolder-items">
                  {group.items.filter((item) => item.section === section).map((item) => {
                const currentPath = pathname || ''
                const itemPath = item.href.split('?')[0]
                const isActive = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
                const Icon = item.icon || LayoutDashboard
                return (
                  <Link
                    key={`${group.name}-${item.code}-${item.href}`}
                    href={item.href}
                    className={cn('sidebar-link', isActive && 'active')}
                    onContextMenu={(event) => showContextMenu(event, item, groupIndex === 0)}
                    title="Botao direito: executar, salvar, renomear ou remover favorito"
                  >
                    <Icon className="sidebar-icon" />
                    <span>
                      <small>{item.code}</small>
                      {item.name}
                    </span>
                  </Link>
                )
                  })}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut className="sidebar-icon" />
          <span>Sair do sistema</span>
        </button>
      </div>

      {contextMenu && (
        <div
          className="sap-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => router.push(contextMenu.item.href)}>
            <ExternalLink size={14} />
            Executar
          </button>
          <button type="button" onClick={() => addFavorite(contextMenu.item)}>
            <FolderPlus size={14} />
            Salvar como favorito
          </button>
          <button type="button" onClick={() => copyTransaction(contextMenu.item)}>
            <Copy size={14} />
            Copiar codigo
          </button>
          {contextMenu.favorite && (
            <>
              <button type="button" onClick={() => renameFavorite(contextMenu.item)}>
                <Pencil size={14} />
                Renomear favorito
              </button>
              <button type="button" onClick={() => removeFavorite(contextMenu.item)}>
                <Trash2 size={14} />
                Remover favorito
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
