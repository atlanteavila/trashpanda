import type { Prisma } from '@prisma/client'

import type {
  DashboardAddress,
  SubscriptionSnapshot,
} from '@/components/dashboard/DashboardShell'

const VALID_SERVICE_IDS = new Set<SubscriptionSnapshot['services'][number]['id']>([
  'trash',
  'bin-wash',
  'poop-scoop',
  'porch-blow',
  'yard-rake',
])

export function parseSubscriptionServices(
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

type NormalizedAddress = {
  id: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

export function normalizeDashboardAddresses(
  addresses: NormalizedAddress[],
): DashboardAddress[] {
  return addresses.map((address, index) => ({
    id: address.id,
    label: address.label?.trim() ?? (index === 0 ? 'Home' : `Location ${index + 1}`),
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
  }))
}

export function mapSubscriptionToSnapshot(
  subscription: Prisma.Subscription,
): SubscriptionSnapshot {
  return {
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
    accessNotes: subscription.accessNotes ?? null,
    status: subscription.status,
    stripeStatus: subscription.stripeStatus,
    stripePaymentStatus: subscription.stripePaymentStatus,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  }
}
