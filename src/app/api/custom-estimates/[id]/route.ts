import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { getSiteUrl } from '@/lib/email'
import { sendCustomEstimateEmail } from '@/lib/notificationEmails'
import type { CustomEstimateAddress, CustomEstimateLineItem } from '@/lib/notificationEmails'
import { cancelStripeSubscription, updateStripeSubscriptionItems } from '@/lib/stripe'
import prisma from '@/lib/prisma'

type UpdatePayload = {
  status?: 'SENT' | 'ACCEPTED' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'DELETE'
  paymentStatus?: 'PAID_ON_FILE'
  addresses?: CustomEstimateAddress[]
  lineItems?: CustomEstimateLineItem[]
  monthlyAdjustment?: number
  preferredServiceDay?: string | null
  notes?: string | null
  adminNotes?: string | null
}

const allowedStatusUpdates = new Set([
  'SENT',
  'ACCEPTED',
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
  'DELETE',
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

function normalizeLineItems(items: CustomEstimateLineItem[] | undefined) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const description = String(item.description ?? '').trim()
      const frequency = String(item.frequency ?? '').trim()
      const quantity = Number(item.quantity ?? 1)
      const monthlyRate = Number(item.monthlyRate ?? 0)
      const notes = typeof item.notes === 'string' ? item.notes.trim() : null

      if (!description || !Number.isFinite(quantity) || !Number.isFinite(monthlyRate)) {
        return null
      }

      const normalizedQuantity = Math.max(1, Math.round(quantity))
      const normalizedRate = Math.max(0, Math.round(monthlyRate * 100) / 100)

      return {
        id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `line-${index + 1}`,
        description,
        frequency,
        quantity: normalizedQuantity,
        monthlyRate: normalizedRate,
        notes,
        lineTotal: Math.round(normalizedQuantity * normalizedRate * 100) / 100,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function normalizeAddresses(addresses: CustomEstimateAddress[] | undefined) {
  if (!Array.isArray(addresses)) {
    return []
  }

  return addresses
    .map((address) => {
      if (!address || typeof address !== 'object') {
        return null
      }

      const street = String(address.street ?? '').trim()
      const city = String(address.city ?? '').trim()
      const state = String(address.state ?? '').trim().toUpperCase()
      const postalCode = String(address.postalCode ?? '').trim()
      const label = typeof address.label === 'string' ? address.label.trim() : null

      if (!street || !city || !state || !postalCode) {
        return null
      }

      return {
        id: String(address.id ?? ''),
        label,
        street,
        city,
        state,
        postalCode,
      }
    })
    .filter((address): address is NonNullable<typeof address> => Boolean(address))
}

function buildStripeItems(
  estimateId: string,
  lineItems: ReturnType<typeof normalizeLineItems>,
  monthlyAdjustment: number,
) {
  const stripeItems = lineItems
    .filter((item) => Number(item.monthlyRate ?? 0) > 0)
    .map((item) => ({
      id: item.id ?? estimateId,
      name: item.description ?? 'Custom service',
      quantity: item.quantity ?? 1,
      monthlyRate: item.monthlyRate ?? 0,
      frequency: item.frequency ?? 'Monthly',
      notes: item.notes ?? null,
    }))

  if (monthlyAdjustment > 0) {
    stripeItems.push({
      id: `adjustment-${estimateId}`,
      name: 'Custom adjustment',
      quantity: 1,
      monthlyRate: monthlyAdjustment,
      frequency: 'Monthly',
      notes: null,
    })
  }

  return stripeItems
}

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
  const hasEstimateEdits =
    'addresses' in payload ||
    'lineItems' in payload ||
    'monthlyAdjustment' in payload ||
    'preferredServiceDay' in payload ||
    'notes' in payload ||
    'adminNotes' in payload

  if (payload.status && allowedStatusUpdates.has(payload.status)) {
    const nextStatus = payload.status

    if (!isAdmin && nextStatus !== 'ACCEPTED' && nextStatus !== 'PAUSED' && nextStatus !== 'CANCELLED' && nextStatus !== 'DELETE') {
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

  if (hasEstimateEdits) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can edit custom estimates.' }, { status: 403 })
    }

    const addresses = normalizeAddresses(payload.addresses)
    const lineItems = normalizeLineItems(payload.lineItems)

    if (addresses.length === 0) {
      return NextResponse.json({ error: 'Select at least one address.' }, { status: 400 })
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'Add at least one line item.' }, { status: 400 })
    }

    const monthlyAdjustment = Number.isFinite(payload.monthlyAdjustment)
      ? Number(payload.monthlyAdjustment)
      : 0
    const normalizedAdjustment = Math.round(monthlyAdjustment * 100) / 100

    const subtotal =
      Math.round(
        (lineItems.reduce((sum, item) => sum + item.lineTotal, 0) + normalizedAdjustment) * 100,
      ) / 100
    const total = subtotal

    const preferredServiceDay =
      typeof payload.preferredServiceDay === 'string'
        ? payload.preferredServiceDay.trim().toUpperCase()
        : null

    updates.addresses = addresses
    updates.lineItems = lineItems
    updates.monthlyAdjustment = normalizedAdjustment
    updates.subtotal = subtotal
    updates.total = total
    updates.preferredServiceDay = preferredServiceDay || null
    updates.notes = typeof payload.notes === 'string' ? payload.notes.trim().slice(0, 2000) : null
    updates.adminNotes =
      typeof payload.adminNotes === 'string' ? payload.adminNotes.trim().slice(0, 2000) : null
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

  if (hasEstimateEdits && updated.status === 'ACTIVE' && updated.stripeSubscriptionId) {
    try {
      await updateStripeSubscriptionItems(
        updated.stripeSubscriptionId,
        buildStripeItems(
          updated.id,
          normalizeLineItems(updated.lineItems as CustomEstimateLineItem[]),
          Number(updated.monthlyAdjustment ?? 0),
        ),
      )
    } catch (error) {
      console.error('Failed to update Stripe subscription items', error)
      return NextResponse.json(
        { error: 'We could not update billing for this custom estimate.' },
        { status: 500 },
      )
    }
  }

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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  // 1️⃣ Authentication
  if (!session?.user) {
    return NextResponse.json(
      { error: 'You must be signed in to delete an estimate.' },
      { status: 401 },
    )
  }

  // 2️⃣ Authorization — ADMIN ONLY
  if (!isAdminUser(session.user)) {
    return NextResponse.json(
      { error: 'Only administrators can delete estimates.' },
      { status: 403 },
    )
  }

  const params = await context.params
  const estimateId = params?.id?.trim()

  // 3️⃣ Validate ID
  if (!estimateId) {
    return NextResponse.json(
      { error: 'Estimate id is required.' },
      { status: 400 },
    )
  }

  // 4️⃣ Ensure estimate exists (clean 404 instead of Prisma throw)
  const estimate = await prisma.customEstimate.findUnique({
    where: { id: estimateId },
    select: { id: true, stripeSubscriptionId: true },
  })

  if (!estimate) {
    return NextResponse.json(
      { error: 'Estimate not found.' },
      { status: 404 },
    )
  }

  if (estimate.stripeSubscriptionId) {
    try {
      await cancelStripeSubscription(estimate.stripeSubscriptionId)
    } catch (error) {
      console.error('Failed to cancel Stripe subscription', error)
      return NextResponse.json(
        { error: 'Unable to cancel the Stripe subscription for this estimate.' },
        { status: 502 },
      )
    }
  }

  // 5️⃣ Hard delete
  await prisma.customEstimate.delete({
    where: { id: estimateId },
  })

  return NextResponse.json({
    estimate: estimateId,
    message: 'Estimate has been permanently deleted',
  })
}
