import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { getSiteUrl } from '@/lib/email'
import { sendCustomEstimateEmail } from '@/lib/notificationEmails'
import type { CustomEstimateAddress, CustomEstimateLineItem } from '@/lib/notificationEmails'
import prisma from '@/lib/prisma'

type UpdatePayload = {
  userId?: string
  addresses?: AddressPayload[]
  lineItems?: LineItemPayload[]
  monthlyAdjustment?: number
  notes?: string | null
  adminNotes?: string | null
  preferredServiceDay?: string | null
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

type AddressPayload = {
  id: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

type LineItemPayload = {
  id?: string
  description: string
  frequency?: string
  quantity?: number
  monthlyRate?: number
  notes?: string | null
}

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

function normalizeLineItems(items: LineItemPayload[] | undefined) {
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

function normalizeAddresses(addresses: AddressPayload[] | undefined) {
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

  const hasAdminOnlyEstimateUpdates =
    payload.userId !== undefined ||
    payload.addresses !== undefined ||
    payload.lineItems !== undefined ||
    payload.monthlyAdjustment !== undefined ||
    payload.notes !== undefined ||
    payload.adminNotes !== undefined ||
    payload.preferredServiceDay !== undefined

  if (!isAdmin && hasAdminOnlyEstimateUpdates) {
    return NextResponse.json(
      { error: 'Only administrators can edit estimate details.' },
      { status: 403 },
    )
  }

  const updates: Record<string, any> = {}

  if (isAdmin) {
    if (payload.userId !== undefined) {
      const userId = typeof payload.userId === 'string' ? payload.userId.trim() : ''
      if (!userId) {
        return NextResponse.json({ error: 'Select a customer before saving.' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'Customer not found.' }, { status: 400 })
      }

      updates.userId = userId
    }

    if (payload.addresses !== undefined) {
      const addresses = normalizeAddresses(payload.addresses)
      if (addresses.length === 0) {
        return NextResponse.json({ error: 'Select at least one address.' }, { status: 400 })
      }
      updates.addresses = addresses
    }

    if (payload.lineItems !== undefined) {
      const lineItems = normalizeLineItems(payload.lineItems)
      if (lineItems.length === 0) {
        return NextResponse.json({ error: 'Add at least one line item.' }, { status: 400 })
      }
      updates.lineItems = lineItems
    }

    if (payload.monthlyAdjustment !== undefined) {
      const adjustment = Number(payload.monthlyAdjustment)
      if (!Number.isFinite(adjustment)) {
        return NextResponse.json({ error: 'Monthly adjustment must be a valid number.' }, { status: 400 })
      }
      updates.monthlyAdjustment = Math.round(adjustment * 100) / 100
    }

    if (payload.preferredServiceDay !== undefined) {
      const preferredServiceDay =
        typeof payload.preferredServiceDay === 'string'
          ? payload.preferredServiceDay.trim().toUpperCase()
          : ''
      updates.preferredServiceDay = preferredServiceDay || null
    }

    if (payload.notes !== undefined) {
      updates.notes = typeof payload.notes === 'string' ? payload.notes.trim().slice(0, 2000) : null
    }

    if (payload.adminNotes !== undefined) {
      updates.adminNotes =
        typeof payload.adminNotes === 'string'
          ? payload.adminNotes.trim().slice(0, 2000)
          : null
    }

    if (payload.lineItems !== undefined || payload.monthlyAdjustment !== undefined) {
      const lineItems =
        payload.lineItems !== undefined
          ? (updates.lineItems as ReturnType<typeof normalizeLineItems>)
          : normalizeLineItems(getCustomEstimateLineItems(estimate.lineItems) as LineItemPayload[])

      if (lineItems.length === 0) {
        return NextResponse.json({ error: 'Add at least one line item.' }, { status: 400 })
      }

      const adjustment =
        payload.monthlyAdjustment !== undefined
          ? Number(updates.monthlyAdjustment ?? 0)
          : Number(estimate.monthlyAdjustment ?? 0)

      const subtotal =
        Math.round(
          (lineItems.reduce((sum, item) => sum + item.lineTotal, 0) + adjustment) * 100,
        ) / 100

      updates.subtotal = subtotal
      updates.total = subtotal
    }
  }

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
    select: { id: true },
  })

  if (!estimate) {
    return NextResponse.json(
      { error: 'Estimate not found.' },
      { status: 404 },
    )
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
