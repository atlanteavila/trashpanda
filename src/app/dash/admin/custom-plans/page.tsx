import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AdminCustomPlansDashboard } from '@/components/dashboard/AdminCustomPlansDashboard'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Admin custom plans',
}

export default async function AdminCustomPlansPage() {
  const session = await auth()

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

  return (
    <AdminCustomPlansDashboard
      users={users}
      initialEstimates={customEstimates.map((estimate) => ({
        ...estimate,
        addresses: Array.isArray(estimate.addresses) ? estimate.addresses : [],
        lineItems: Array.isArray(estimate.lineItems) ? estimate.lineItems : [],
        monthlyAdjustment: estimate.monthlyAdjustment ?? 0,
        notes: estimate.notes ?? null,
        adminNotes: estimate.adminNotes ?? null,
        acceptedAt: estimate.acceptedAt?.toISOString() ?? null,
        paidAt: estimate.paidAt?.toISOString() ?? null,
        createdAt: estimate.createdAt.toISOString(),
        user: estimate.user,
      }))}
    />
  )
}
