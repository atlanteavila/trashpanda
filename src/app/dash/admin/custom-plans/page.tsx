import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import {
  AdminCustomPlansDashboard,
  type CustomEstimate,
  type DashboardAddress,
} from '@/components/dashboard/AdminCustomPlansDashboard'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Admin custom plans',
}

function normalizeDashboardAddresses(value: unknown): DashboardAddress[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((address) => {
    if (!address || typeof address !== 'object') {
      return []
    }

    const record = address as Record<string, unknown>
    const id =
      typeof record.id === 'string'
        ? record.id
        : record.id != null
          ? String(record.id)
          : ''
    const street = typeof record.street === 'string' ? record.street : ''
    const city = typeof record.city === 'string' ? record.city : ''
    const state = typeof record.state === 'string' ? record.state : ''
    const postalCode =
      typeof record.postalCode === 'string' ? record.postalCode : ''

    if (!id || !street || !city || !state || !postalCode) {
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

function normalizeLineItems(
  value: unknown,
  fallbackPrefix: string,
): CustomEstimate['lineItems'] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const record = item as Record<string, unknown>
    const quantity = Number(record.quantity ?? 0)
    const monthlyRate = Number(record.monthlyRate ?? 0)
    const lineTotal = Math.round(quantity * monthlyRate * 100) / 100
    const id =
      typeof record.id === 'string'
        ? record.id
        : `${fallbackPrefix}-item-${index}`

    return [
      {
        id,
        description:
          typeof record.description === 'string' ? record.description : '',
        frequency: typeof record.frequency === 'string' ? record.frequency : 'Monthly',
        quantity: Number.isFinite(quantity) ? quantity : 0,
        monthlyRate: Number.isFinite(monthlyRate) ? monthlyRate : 0,
        notes: typeof record.notes === 'string' ? record.notes : undefined,
        lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
      },
    ]
  })
}

export default async function AdminCustomPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ estimate?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user) {
    redirect('/login')
  }

  if (!isAdminUser(session.user)) {
    redirect('/dash')
  }

  const [users, customEstimates] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
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
    }),
    prisma.customEstimate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    }),
  ])

  const normalizedEstimates: CustomEstimate[] = customEstimates.map((estimate: any ) => ({
    ...estimate,
    addresses: normalizeDashboardAddresses(estimate.addresses),
    lineItems: normalizeLineItems(estimate.lineItems, estimate.id),
    monthlyAdjustment: estimate.monthlyAdjustment ?? 0,
    notes: estimate.notes ?? null,
    adminNotes: estimate.adminNotes ?? null,
    acceptedAt: estimate.acceptedAt?.toISOString() ?? null,
    paidAt: estimate.paidAt?.toISOString() ?? null,
    createdAt: estimate.createdAt.toISOString(),
    user: estimate.user,
  }))

  return (
    <AdminCustomPlansDashboard
      users={users}
      initialEstimates={normalizedEstimates}
      initialEditingEstimateId={
        typeof params.estimate === 'string' ? params.estimate : null
      }
    />
  )
}
