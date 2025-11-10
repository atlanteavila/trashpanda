import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardShell, type SubscriptionSnapshot, type DashboardAddress } from '@/components/dashboard/DashboardShell'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Manage subscriptions',
}

function mapAddresses(addresses: DashboardAddress[]): DashboardAddress[] {
  return addresses.map((address, index) => ({
    ...address,
    label: address.label?.trim() ?? (index === 0 ? 'Home' : `Location ${index + 1}`),
  }))
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
    services: Array.isArray(subscription.services)
      ? (subscription.services as SubscriptionSnapshot['services'])
      : [],
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
