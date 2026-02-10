import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import {
  AdminSubscriptionsDashboard,
  type AdminCustomPlanSubscriptionRecord,
  type AdminSubscriptionRecord,
} from '@/components/dashboard/AdminSubscriptionsDashboard'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import prisma from '@/lib/prisma'
import { mapSubscriptionToSnapshot, normalizeDashboardAddresses } from '@/lib/subscriptionSnapshot'

export const metadata: Metadata = {
  title: 'Admin dashboard',
}

function normalizeCustomPlanAddresses(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((address, index) => {
    if (!address || typeof address !== 'object') {
      return []
    }

    const record = address as Record<string, unknown>
    const id =
      typeof record.id === 'string'
        ? record.id
        : record.id != null
          ? String(record.id)
          : `custom-address-${index}`
    const street = typeof record.street === 'string' ? record.street : ''
    const city = typeof record.city === 'string' ? record.city : ''
    const state = typeof record.state === 'string' ? record.state : ''
    const postalCode =
      typeof record.postalCode === 'string' ? record.postalCode : ''

    if (!street || !city || !state || !postalCode) {
      return []
    }

    return [
      {
        id,
        label: typeof record.label === 'string' ? record.label : null,
        street,
        city,
        state,
        postalCode,
      },
    ]
  })
}

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!isAdminUser(session.user)) {
    redirect('/dash')
  }

  const [subscriptionRecords, customPlanRecords] = await Promise.all([
    prisma.subscription.findMany({
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
    }),
    prisma.customEstimate.findMany({
      where: {
        status: {
          in: ['ACCEPTED', 'ACTIVE', 'PAUSED', 'CANCELLED'],
        },
      },
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
    }),
  ])

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

  const customPlanSubscriptions: AdminCustomPlanSubscriptionRecord[] = customPlanRecords.map(
    (record) => ({
      estimate: {
        id: record.id,
        status: record.status,
        paymentStatus: record.paymentStatus,
        total: record.total,
        preferredServiceDay: record.preferredServiceDay ?? null,
        addresses: normalizeCustomPlanAddresses(record.addresses),
        createdAt: record.createdAt.toISOString(),
      },
      user: {
        id: record.user.id,
        email: record.user.email,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        name: record.user.name,
        phone: record.user.phone,
        addresses: normalizeDashboardAddresses(record.user.addresses),
      },
    }),
  )

  return (
    <AdminSubscriptionsDashboard
      subscriptions={subscriptions}
      customPlanSubscriptions={customPlanSubscriptions}
    />
  )
}
