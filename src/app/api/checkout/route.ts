import { CheckoutStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { requireCheckoutSessionDelegate } from '@/lib/prisma'
import { createStripeCheckoutSession, getAppBaseUrl } from '@/lib/stripe'

type CheckoutServicePayload = {
  id: string
  name: string
  quantity: number
  monthlyRate: number
  frequency: string
  notes?: string | null
}

type CheckoutAddressPayload = {
  id?: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

type CheckoutRequestPayload = {
  services?: CheckoutServicePayload[]
  address?: CheckoutAddressPayload
  planId?: string | null
  planName?: string | null
  total?: number
}

type NormalizedService = {
  id: string
  name: string
  frequency: string
  quantity: number
  monthlyRate: number
  notes?: string
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to start checkout.' }, { status: 401 })
  }

  let payload: CheckoutRequestPayload
  try {
    payload = (await request.json()) as CheckoutRequestPayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const servicesPayload = Array.isArray(payload.services) ? payload.services : []

  const services = servicesPayload
    .map((service) => {
      if (!service || typeof service !== 'object') {
        return null
      }

      const { id, name, frequency } = service
      const quantity = Number(service.quantity)
      const monthlyRate = Number(service.monthlyRate)
      const notes = typeof service.notes === 'string' ? service.notes : undefined

      if (
        typeof id !== 'string' ||
        typeof name !== 'string' ||
        typeof frequency !== 'string'
      ) {
        return null
      }

      const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 0
      const normalizedRate = Number.isFinite(monthlyRate) ? Math.max(0, monthlyRate) : 0

      if (!normalizedQuantity || !normalizedRate) {
        return null
      }

      return {
        id,
        name,
        frequency,
        quantity: normalizedQuantity,
        monthlyRate: normalizedRate,
        notes,
      }
    })
    .filter((service): service is NormalizedService => Boolean(service))

  if (services.length === 0) {
    return NextResponse.json({ error: 'Add at least one service before checking out.' }, { status: 400 })
  }

  const addressPayload = payload.address
  if (!addressPayload || typeof addressPayload !== 'object') {
    return NextResponse.json({ error: 'Select a valid service address before checking out.' }, { status: 400 })
  }

  const street = addressPayload.street?.trim()
  const city = addressPayload.city?.trim()
  const state = addressPayload.state?.trim().toUpperCase()
  const postalCode = addressPayload.postalCode?.trim()

  if (!street || !city || !state || !postalCode) {
    return NextResponse.json({ error: 'Service address is incomplete.' }, { status: 400 })
  }

  const addressSummary = `${street}, ${city}, ${state} ${postalCode}`

  const safeTotal =
    typeof payload.total === 'number' && Number.isFinite(payload.total) && payload.total > 0
      ? payload.total
      : null

  const baseUrl = getAppBaseUrl(request)

  const label = addressPayload.label?.trim() ?? null

  let checkoutSessions: ReturnType<typeof requireCheckoutSessionDelegate>
  try {
    checkoutSessions = requireCheckoutSessionDelegate()
  } catch (error) {
    console.error('CheckoutSession delegate unavailable', error)
    return NextResponse.json(
      {
        error:
          'Checkout is temporarily unavailable while the database client updates. Run `npx prisma generate` and restart the server.',
      },
      { status: 503 },
    )
  }

  const checkoutRecord = await checkoutSessions.create({
    data: {
      userId: session.user.id,
      planId: payload.planId ?? null,
      planName: payload.planName ?? null,
      addressLabel: label,
      addressStreet: street,
      addressCity: city,
      addressState: state,
      addressPostalCode: postalCode,
      addressSummary,
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        frequency: service.frequency,
        quantity: service.quantity,
        monthlyRate: service.monthlyRate,
        notes: service.notes ?? null,
      })),
      monthlyTotal: safeTotal,
    },
  })

  try {
    const checkoutSession = await createStripeCheckoutSession({
      items: services.map((service) => ({
        id: service.id,
        name: service.name,
        quantity: service.quantity,
        monthlyRate: service.monthlyRate,
        frequency: service.frequency,
        notes: service.notes,
      })),
      customerEmail: session.user.email ?? null,
      successUrl: `${baseUrl}/dash?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dash?checkout=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: session.user.id,
        planId: payload.planId ?? '',
        planName: payload.planName ?? '',
        addressId: addressPayload.id ?? '',
        addressLabel: label ?? '',
        addressSummary,
        monthlyTotal: safeTotal ? safeTotal.toFixed(2) : '',
        checkoutSessionId: checkoutRecord.id,
      },
    })

    await checkoutSessions.update({
      where: { id: checkoutRecord.id },
      data: {
        stripeSessionId: checkoutSession.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Failed to create checkout session', error)

    await checkoutSessions
      .update({
        where: { id: checkoutRecord.id },
        data: {
          status: CheckoutStatus.CANCELLED,
        },
      })
      .catch(() => undefined)

    const message =
      error instanceof Error && /not configured/i.test(error.message)
        ? 'Checkout is unavailable. Please try again later.'
        : 'Unable to start checkout. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
