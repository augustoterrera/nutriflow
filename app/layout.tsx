import '@/app/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'NutriFlow',
    template: '%s · NutriFlow',
  },
  description: 'Gestión nutricional y seguimiento de pacientes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  )
}
