import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Add subscription',
}

export default async function AddSubscriptionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      addresses: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          label: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
        },
      },
    },
  })

  const addresses =
    userRecord?.addresses.map((address) => ({
      id: address.id,
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    })) ?? []

  return <DashboardShell user={session.user} initialAddresses={addresses} mode="create" />
}
