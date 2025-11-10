import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardShell, type SubscriptionSnapshot, type DashboardAddress } from '@/components/dashboard/DashboardShell'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Manage subscriptions',
}

function mapAddresses(addresses: DashboardAddress[]): DashboardAddress[] {
  return addresses.map((address, index) => ({
    ...address,
    label: address.label?.trim() ?? (index === 0 ? 'Home' : `Location ${index + 1}`),
  }))
}

const VALID_SERVICE_IDS = new Set<SubscriptionSnapshot['services'][number]['id']>([
  'trash',
  'bin-wash',
  'poop-scoop',
  'porch-blow',
  'yard-rake',
])

function parseSubscriptionServices(
  value: Prisma.JsonValue | null,
): SubscriptionSnapshot['services'] {
  if (!Array.isArray(value)) {
    return []
  }

  const services: SubscriptionSnapshot['services'] = []

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue
    }

    const record = item as Record<string, unknown>
    const { id, name, frequency, monthlyRate, quantity, notes } = record

    if (
      typeof id !== 'string' ||
      !VALID_SERVICE_IDS.has(id as SubscriptionSnapshot['services'][number]['id']) ||
      typeof name !== 'string' ||
      typeof frequency !== 'string' ||
      typeof monthlyRate !== 'number' ||
      !Number.isFinite(monthlyRate) ||
      typeof quantity !== 'number' ||
      !Number.isFinite(quantity)
    ) {
      continue
    }

    services.push({
      id: id as SubscriptionSnapshot['services'][number]['id'],
      name,
      frequency,
      monthlyRate,
      quantity,
      notes:
        typeof notes === 'string'
          ? notes
          : notes === null
            ? null
            : undefined,
    })
  }

  return services
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

  const addresses: DashboardAddress[] = mapAddresses(
    (userRecord?.addresses ?? []).map((address) => ({
      id: address.id,
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    })),
  )

  const subscriptions: SubscriptionSnapshot[] = subscriptionRecords.map((subscription) => ({
    id: subscription.id,
    planId: subscription.planId,
    planName: subscription.planName,
    addressId: subscription.addressId,
    addressLabel: subscription.addressLabel,
    street: subscription.addressStreet,
    city: subscription.addressCity,
    state: subscription.addressState,
    postalCode: subscription.addressPostalCode,
    serviceDay: subscription.preferredServiceDay ?? null,
    services: parseSubscriptionServices(subscription.services),
    monthlyTotal: subscription.monthlyTotal,
    status: subscription.status,
    stripeStatus: subscription.stripeStatus,
    stripePaymentStatus: subscription.stripePaymentStatus,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  }))

  return (
    <DashboardShell
      user={session.user}
      initialAddresses={addresses}
      mode="edit"
      subscriptions={subscriptions}
    />
  )
}
