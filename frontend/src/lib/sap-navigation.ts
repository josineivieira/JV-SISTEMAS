import { FileText, FolderCog, PackageCheck, Receipt, ShoppingCart, Truck, Users, Warehouse } from 'lucide-react'
import { erpTransactions, transactionPath, transactionSections } from './erp-transactions'

const moduleIcons = {
  Recebimento: PackageCheck,
  Compras: ShoppingCart,
  Estoque: Warehouse,
  Comercial: ShoppingCart,
  Expedicao: PackageCheck,
  Transporte: Truck,
  Fiscal: FileText,
  Financeiro: Receipt,
  Administracao: FolderCog,
} as const

const moduleOrder = ['Compras', 'Recebimento', 'Estoque', 'Comercial', 'Expedicao', 'Transporte', 'Fiscal', 'Financeiro', 'Administracao']

export const sapNavigationGroups = [
  {
    name: 'Favoritos',
    defaultOpen: true,
    items: ['VA05', 'VL10A', 'MB52', 'FI03'].map((code) => {
      const item = erpTransactions.find((transaction) => transaction.code === code)!
      return { name: `${item.code} ${item.title}`, code: item.code, href: transactionPath(item.code), icon: moduleIcons[item.module as keyof typeof moduleIcons] || Users, section: 'Favoritos' }
    }),
  },
  ...moduleOrder.map((module) => ({
    name: module,
    defaultOpen: ['Comercial', 'Expedicao'].includes(module),
    items: erpTransactions
      .filter((item) => item.module === module)
      .map((item) => ({
        name: item.title,
        code: item.code,
        href: transactionPath(item.code),
        icon: moduleIcons[module as keyof typeof moduleIcons] || Users,
        section: transactionSections[item.code] || item.phase,
      })),
  })),
]

export const sapTransactions = erpTransactions.reduce<Record<string, string>>((routes, item) => {
  routes[item.code] = transactionPath(item.code)
  return routes
}, { DASHBOARD: '/dashboard' })

export const sapTransactionByPath = erpTransactions.reduce<Record<string, string>>((transactions, item) => {
  transactions[transactionPath(item.code)] = `/n ${item.code}`
  return transactions
}, { '/dashboard': '/n SAP_MENU' })

export type SapNavigationItem = (typeof sapNavigationGroups)[number]['items'][number]
