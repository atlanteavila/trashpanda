import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AdminSubscriptionsDashboard, type AdminSubscriptionRecord } from '@/components/dashboard/AdminSubscriptionsDashboard'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import prisma from '@/lib/prisma'
import { mapSubscriptionToSnapshot, normalizeDashboardAddresses } from '@/lib/subscriptionSnapshot'

export const metadata: Metadata = {
  title: 'Admin dashboard',
}

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!isAdminUser(session.user)) {
    redirect('/dash')
  }

  const subscriptionRecords = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          phone: true,
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
      },
    },
  })

  const subscriptions: AdminSubscriptionRecord[] = subscriptionRecords.map((record) => ({
    subscription: mapSubscriptionToSnapshot(record),
    user: {
      id: record.user.id,
      email: record.user.email,
      firstName: record.user.firstName,
      lastName: record.user.lastName,
      name: record.user.name,
      phone: record.user.phone,
      addresses: normalizeDashboardAddresses(record.user.addresses),
    },
  }))

  return <AdminSubscriptionsDashboard subscriptions={subscriptions} />
}
