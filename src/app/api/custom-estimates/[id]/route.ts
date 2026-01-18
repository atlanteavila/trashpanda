import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { getSiteUrl } from '@/lib/email'
import { sendCustomEstimateEmail } from '@/lib/notificationEmails'
import type { CustomEstimateAddress, CustomEstimateLineItem } from '@/lib/notificationEmails'
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

const isCustomEstimateAddress = (value: unknown): value is CustomEstimateAddress => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.street === 'string' &&
    typeof record.city === 'string' &&
    typeof record.state === 'string' &&
    typeof record.postalCode === 'string' &&
    (record.label === undefined || record.label === null || typeof record.label === 'string') &&
    (record.id === undefined || typeof record.id === 'string')
  )
}

const getCustomEstimateAddresses = (value: unknown): CustomEstimateAddress[] =>
  Array.isArray(value) ? value.filter(isCustomEstimateAddress) : []

const isCustomEstimateLineItem = (value: unknown): value is CustomEstimateLineItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.description === 'string' &&
    (record.frequency === undefined || record.frequency === null || typeof record.frequency === 'string') &&
    (record.quantity === undefined || record.quantity === null || typeof record.quantity === 'number') &&
    (record.monthlyRate === undefined || record.monthlyRate === null || typeof record.monthlyRate === 'number') &&
    (record.lineTotal === undefined || record.lineTotal === null || typeof record.lineTotal === 'number') &&
    (record.notes === undefined || record.notes === null || typeof record.notes === 'string') &&
    (record.id === undefined || typeof record.id === 'string')
  )
}

const getCustomEstimateLineItems = (value: unknown): CustomEstimateLineItem[] =>
  Array.isArray(value) ? value.filter(isCustomEstimateLineItem) : []

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
        addresses: getCustomEstimateAddresses(updated.addresses),
        lineItems: getCustomEstimateLineItems(updated.lineItems),
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
