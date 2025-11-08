import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <DashboardShell user={session.user} />
}
