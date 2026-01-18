import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { getSiteUrl } from '@/lib/email'
import { sendCustomEstimateEmail } from '@/lib/notificationEmails'
import prisma from '@/lib/prisma'

type UpdatePayload = {
  status?: 'SENT' | 'ACCEPTED' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  paymentStatus?: 'PAID_ON_FILE'
}

const allowedStatusUpdates = new Set([
  'SENT',
  'ACCEPTED',
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
])

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to update an estimate.' }, { status: 401 })
  }

  const params = await context.params
  const estimateId = params?.id?.trim()

  if (!estimateId) {
    return NextResponse.json({ error: 'Estimate id is required.' }, { status: 400 })
  }

  let payload: UpdatePayload
  try {
    payload = (await request.json()) as UpdatePayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const estimate = await prisma.customEstimate.findUnique({
    where: { id: estimateId },
  })

  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found.' }, { status: 404 })
  }

  const isAdmin = isAdminUser(session.user)
  if (!isAdmin && estimate.userId !== session.user.id) {
    return NextResponse.json({ error: 'You do not have access to this estimate.' }, { status: 403 })
  }

  const updates: Record<string, any> = {}

  if (payload.status && allowedStatusUpdates.has(payload.status)) {
    const nextStatus = payload.status

    if (!isAdmin && nextStatus !== 'ACCEPTED' && nextStatus !== 'PAUSED' && nextStatus !== 'CANCELLED') {
      return NextResponse.json({ error: 'Only admins can set that status.' }, { status: 403 })
    }

    updates.status = nextStatus
    if (nextStatus === 'ACCEPTED') {
      updates.acceptedAt = new Date()
    }
  }

  if (payload.paymentStatus === 'PAID_ON_FILE') {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can record payment.' }, { status: 403 })
    }
    updates.paymentStatus = 'PAID_ON_FILE'
    updates.paidAt = new Date()
  }

  const updated = await prisma.customEstimate.update({
    where: { id: estimateId },
    data: updates,
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
  })

  if (updates.status === 'SENT' && updated.user?.email) {
    const reviewUrl = `${getSiteUrl()}/dash/custom-plans?estimate=${updated.id}`

    try {
      await sendCustomEstimateEmail({
        to: updated.user.email,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        estimateId: updated.id,
        addresses: Array.isArray(updated.addresses) ? updated.addresses : [],
        lineItems: Array.isArray(updated.lineItems) ? updated.lineItems : [],
        monthlyAdjustment: updated.monthlyAdjustment ?? null,
        total: Number(updated.total ?? 0),
        preferredServiceDay: updated.preferredServiceDay ?? null,
        notes: updated.notes ?? null,
        reviewUrl,
      })
    } catch (error) {
      console.error('Failed to send custom estimate email', error)
    }
  }

  return NextResponse.json({ estimate: updated })
}
