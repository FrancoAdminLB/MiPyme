import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiPyme — Gestión operativa con IA para PyMEs argentinas',
  description: 'Controlá tu producción, inventario y cumplimiento normativo con inteligencia artificial. Diseñado para PyMEs argentinas del interior.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
