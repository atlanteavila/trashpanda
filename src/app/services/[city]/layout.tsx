import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import type { ReactNode } from 'react'

export default function CityServicesLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main className="bg-white">{children}</main>
      <Footer />
    </div>
  )
}
