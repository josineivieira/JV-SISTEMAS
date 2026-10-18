import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JV Sistemas & Tecnologia',
  description: 'Sites, sistemas, aplicativos e ERP personalizado para empresas.',
  icons: {
    icon: [{ url: '/jv-sistemas-mark-transparent.png', type: 'image/png' }],
    apple: '/jv-sistemas-mark-transparent.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
