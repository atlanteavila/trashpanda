import { NextResponse } from 'next/server'
import { SubscriptionStatus } from '@prisma/client'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { requireSubscriptionDelegate } from '@/lib/prisma'
import { sendSubscriptionUpdateEmail } from '@/lib/subscriptionEmails'
import { updateStripeSubscriptionItems } from '@/lib/stripe'

const SERVICE_DAY_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

type ServiceDayValue = (typeof SERVICE_DAY_VALUES)[number]

const serviceDaySet = new Set<string>(SERVICE_DAY_VALUES)

function normalizeServiceDay(value: unknown): ServiceDayValue | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (!normalized || !serviceDaySet.has(normalized)) {
    return null
  }

  return normalized as ServiceDayValue
}

type ServicePayload = {
  id?: string
  name?: string
  quantity?: number
  monthlyRate?: number
  frequency?: string
  notes?: string | null
}

type AddressPayload = {
  id?: string | null
  label?: string | null
  street?: string
  city?: string
  state?: string
  postalCode?: string
}

type UpdateSubscriptionPayload = {
  services?: ServicePayload[]
  address?: AddressPayload
  planId?: string | null
  planName?: string | null
  total?: number | null
  status?: SubscriptionStatus | string | null
  serviceDay?: string | null
  accessNotes?: string | null
}

function normalizeStatus(value: string | SubscriptionStatus | null | undefined): SubscriptionStatus | null {
  if (!value) {
    return null
  }

  const normalized = typeof value === 'string' ? value.toUpperCase() : value
  if (normalized === 'ACTIVE' || normalized === 'PAUSED' || normalized === 'CANCELLED') {
    return normalized as SubscriptionStatus
  }
  return null
}

function validateServices(services: ServicePayload[] | undefined) {
  if (!services || services.length === 0) {
    return null
  }

  return services.map((service) => ({
    id: typeof service.id === 'string' ? service.id : '',
    name: typeof service.name === 'string' ? service.name : '',
    quantity: Number.isFinite(service.quantity) && (service.quantity as number) > 0 ? Number(service.quantity) : 1,
    monthlyRate: Number.isFinite(service.monthlyRate) ? Number(service.monthlyRate) : 0,
    frequency: typeof service.frequency === 'string' ? service.frequency : '',
    notes: typeof service.notes === 'string' ? service.notes : null,
  }))
}

function normalizeAddress(address: AddressPayload | undefined) {
  if (!address) {
    return null
  }

  const street = address.street?.trim() ?? ''
  const city = address.city?.trim() ?? ''
  const state = address.state?.trim().toUpperCase() ?? ''
  const postalCode = address.postalCode?.trim() ?? ''
  const label = address.label?.trim() ?? null

  if (!street || !city || !state || !postalCode) {
    return null
  }

  return {
    id: address.id ?? null,
    label,
    street,
    city,
    state,
    postalCode,
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to update a subscription.' }, { status: 401 })
  }

  const params = await context.params
  const subscriptionId = params?.id?.trim()

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Subscription id is required.' }, { status: 400 })
  }

  let payload: UpdateSubscriptionPayload
  try {
    payload = (await request.json()) as UpdateSubscriptionPayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const services = validateServices(payload.services)

  if (!services || services.length === 0) {
    return NextResponse.json({ error: 'At least one service is required.' }, { status: 400 })
  }

  const address = normalizeAddress(payload.address)

  if (!address) {
    return NextResponse.json({ error: 'Provide a complete address before updating the subscription.' }, { status: 400 })
  }

  let subscriptions: ReturnType<typeof requireSubscriptionDelegate>
  try {
    subscriptions = requireSubscriptionDelegate()
  } catch (error) {
    console.error('Subscription delegate unavailable', error)
    return NextResponse.json(
      {
        error:
          'Subscriptions are temporarily unavailable while the database client updates. Run `npx prisma generate` and restart the server.',
      },
      { status: 503 },
    )
  }

  const isAdmin = isAdminUser(session.user)

  const existing = await subscriptions.findFirst({
    where: {
      id: subscriptionId,
      ...(isAdmin
        ? {}
        : {
            userId: session.user.id,
          }),
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 })
  }

  const normalizedStatus = normalizeStatus(payload.status) ?? existing.status
  const safeTotal = Number.isFinite(payload.total) ? Number(payload.total) : existing.monthlyTotal ?? null
  const hasServiceDay = Object.prototype.hasOwnProperty.call(payload, 'serviceDay')
  const preferredServiceDay = hasServiceDay
    ? normalizeServiceDay(payload.serviceDay) ?? null
    : existing.preferredServiceDay ?? null
  const normalizedAccessNotes =
    typeof payload.accessNotes === 'string'
      ? payload.accessNotes.trim().slice(0, 1000)
      : payload.accessNotes === null
        ? null
        : existing.accessNotes ?? null

  let stripeStatus = existing.stripeStatus ?? null
  let stripePaymentStatus = existing.stripePaymentStatus ?? null

  if (existing.stripeSubscriptionId) {
    try {
      const result = await updateStripeSubscriptionItems(
        existing.stripeSubscriptionId,
        services.map((service) => ({
          id: service.id,
          name: service.name,
          quantity: service.quantity,
          monthlyRate: service.monthlyRate,
          frequency: service.frequency,
          notes: service.notes,
        })),
      )

      stripeStatus = result.status ?? stripeStatus
      stripePaymentStatus = result.paymentStatus ?? stripePaymentStatus
    } catch (error) {
      console.error('Failed to update Stripe subscription items', error)
      return NextResponse.json(
        {
          error:
            'We could not update billing for this subscription. Please try again or verify your Stripe settings.',
        },
        { status: 502 },
      )
    }
  }

  const updated = await subscriptions.update({
    where: { id: existing.id },
    data: {
      planId: payload.planId ?? null,
      planName: payload.planName ?? null,
      addressId: address.id,
      addressLabel: address.label,
      addressStreet: address.street,
      addressCity: address.city,
      addressState: address.state,
      addressPostalCode: address.postalCode,
      preferredServiceDay,
      services,
      monthlyTotal: safeTotal,
      status: normalizedStatus,
      accessNotes: normalizedAccessNotes && normalizedAccessNotes.length > 0 ? normalizedAccessNotes : null,
      stripeStatus,
      stripePaymentStatus,
    },
  })

  let emailDispatched = true
  try {
    await sendSubscriptionUpdateEmail({
      to: existing.user.email,
      firstName: existing.user.firstName,
      lastName: existing.user.lastName,
      services,
      address: {
        label: address.label,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      },
      serviceDay: updated.preferredServiceDay ?? null,
      planName: updated.planName ?? null,
      monthlyTotal: updated.monthlyTotal ?? null,
      accessNotes: updated.accessNotes ?? null,
      supportEmail: process.env.CONTACT_RECIPIENT ?? undefined,
      supportPhone: process.env.CONTACT_PHONE ?? undefined,
    })
  } catch (error) {
    emailDispatched = false
    console.error('Failed to send subscription update email', error)
  }

  return NextResponse.json({
    message: emailDispatched
      ? 'Subscription updated successfully.'
      : 'Subscription updated, but we could not send the confirmation email. Please check SMTP settings.',
    emailDispatched,
    subscription: {
      id: updated.id,
      planId: updated.planId,
      planName: updated.planName,
      addressId: updated.addressId,
      addressLabel: updated.addressLabel,
      addressStreet: updated.addressStreet,
      addressCity: updated.addressCity,
      addressState: updated.addressState,
      addressPostalCode: updated.addressPostalCode,
      preferredServiceDay: updated.preferredServiceDay,
      services: updated.services,
      monthlyTotal: updated.monthlyTotal,
      accessNotes: updated.accessNotes,
      status: updated.status,
      stripeStatus: updated.stripeStatus,
      stripePaymentStatus: updated.stripePaymentStatus,
      stripeSubscriptionId: updated.stripeSubscriptionId,
    },
  })
}
