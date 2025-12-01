import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardShell, type SubscriptionSnapshot, type DashboardAddress } from '@/components/dashboard/DashboardShell'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { mapSubscriptionToSnapshot, normalizeDashboardAddresses } from '@/lib/subscriptionSnapshot'

export const metadata: Metadata = {
  title: 'Manage subscriptions',
}

export default async function ManageSubscriptionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [userRecord, subscriptionRecords] = await Promise.all([
    prisma.user.findUnique({
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
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const addresses: DashboardAddress[] = normalizeDashboardAddresses(
    (userRecord?.addresses ?? []).map((address) => ({
      id: address.id,
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    })),
  )

  const subscriptions: SubscriptionSnapshot[] = subscriptionRecords.map(
    (subscription) => mapSubscriptionToSnapshot(subscription),
  )

  return (
    <DashboardShell
      user={session.user}
      initialAddresses={addresses}
      mode="edit"
      subscriptions={subscriptions}
    />
  )
}
