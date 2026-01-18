import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { getSiteUrl } from '@/lib/email'
import { sendCustomEstimateEmail } from '@/lib/notificationEmails'
import prisma from '@/lib/prisma'

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

type CustomEstimatePayload = {
  userId?: string
  addresses?: AddressPayload[]
  lineItems?: LineItemPayload[]
  monthlyAdjustment?: number
  notes?: string | null
  adminNotes?: string | null
  preferredServiceDay?: string | null
  status?: 'DRAFT' | 'SENT'
}

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

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to create an estimate.' }, { status: 401 })
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: 'Only admins can create custom estimates.' }, { status: 403 })
  }

  let payload: CustomEstimatePayload
  try {
    payload = (await request.json()) as CustomEstimatePayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'Select a customer before saving.' }, { status: 400 })
  }

  const addresses = normalizeAddresses(payload.addresses)
  if (addresses.length === 0) {
    return NextResponse.json({ error: 'Select at least one address.' }, { status: 400 })
  }

  const lineItems = normalizeLineItems(payload.lineItems)
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

  const status = payload.status === 'SENT' ? 'SENT' : 'DRAFT'

  const estimate = await prisma.customEstimate.create({
    data: {
      userId,
      createdByEmail: session.user.email ?? null,
      status,
      preferredServiceDay: preferredServiceDay || null,
      addresses,
      lineItems,
      monthlyAdjustment: normalizedAdjustment,
      subtotal,
      total,
      notes: typeof payload.notes === 'string' ? payload.notes.trim().slice(0, 2000) : null,
      adminNotes:
        typeof payload.adminNotes === 'string' ? payload.adminNotes.trim().slice(0, 2000) : null,
    },
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

  if (status === 'SENT' && estimate.user?.email) {
    const reviewUrl = `${getSiteUrl()}/dash/custom-plans?estimate=${estimate.id}`

    try {
      await sendCustomEstimateEmail({
        to: estimate.user.email,
        firstName: estimate.user.firstName,
        lastName: estimate.user.lastName,
        estimateId: estimate.id,
        addresses: Array.isArray(estimate.addresses) ? estimate.addresses : [],
        lineItems: Array.isArray(estimate.lineItems) ? estimate.lineItems : [],
        monthlyAdjustment: estimate.monthlyAdjustment ?? null,
        total: Number(estimate.total ?? 0),
        preferredServiceDay: estimate.preferredServiceDay ?? null,
        notes: estimate.notes ?? null,
        reviewUrl,
      })
    } catch (error) {
      console.error('Failed to send custom estimate email', error)
    }
  }

  return NextResponse.json({ estimate })
}
