import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { CustomPlansDashboard } from '@/components/dashboard/CustomPlansDashboard'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Custom plans',
}

export default async function CustomPlansPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const estimates = await prisma.customEstimate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <CustomPlansDashboard
      estimates={estimates.map((estimate) => ({
        ...estimate,
        addresses: Array.isArray(estimate.addresses) ? estimate.addresses : [],
        lineItems: Array.isArray(estimate.lineItems) ? estimate.lineItems : [],
        monthlyAdjustment: estimate.monthlyAdjustment ?? 0,
        notes: estimate.notes ?? null,
        adminNotes: estimate.adminNotes ?? null,
        acceptedAt: estimate.acceptedAt?.toISOString() ?? null,
        paidAt: estimate.paidAt?.toISOString() ?? null,
        createdAt: estimate.createdAt.toISOString(),
      }))}
    />
  )
}
