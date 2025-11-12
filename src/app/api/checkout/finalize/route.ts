import { CheckoutStatus, SubscriptionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { requireCheckoutSessionDelegate, requireSubscriptionDelegate } from '@/lib/prisma'
import { retrieveStripeCheckoutSession } from '@/lib/stripe'

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

type FinalizeOutcome = 'success' | 'cancelled'

type FinalizeRequestPayload = {
  sessionId?: string
  outcome?: FinalizeOutcome
}

function normalizeSessionId(value: string | undefined | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to finalize checkout.' }, { status: 401 })
  }

  let payload: FinalizeRequestPayload

  try {
    payload = (await request.json()) as FinalizeRequestPayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const outcome = payload.outcome

  if (outcome !== 'success' && outcome !== 'cancelled') {
    return NextResponse.json({ error: 'Provide a valid checkout outcome.' }, { status: 400 })
  }

  const sessionId = normalizeSessionId(payload.sessionId)

  if (!sessionId) {
    const message =
      outcome === 'success'
        ? 'Missing Stripe session identifier. Please contact support to confirm your checkout.'
        : 'Checkout was cancelled before a session could be created.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  let checkoutSessions: ReturnType<typeof requireCheckoutSessionDelegate>
  try {
    checkoutSessions = requireCheckoutSessionDelegate()
  } catch (error) {
    console.error('CheckoutSession delegate unavailable', error)
    return NextResponse.json(
      {
        error:
          'We could not finalize checkout because the database client is outdated. Run `npx prisma generate` and restart the server.',
      },
      { status: 503 },
    )
  }

  let checkoutRecord = await checkoutSessions.findFirst({
    where: {
      userId: session.user.id,
      stripeSessionId: sessionId,
    },
  })

  let stripeSession: Awaited<ReturnType<typeof retrieveStripeCheckoutSession>> | null = null

  if (!checkoutRecord || outcome === 'success') {
    try {
      stripeSession = await retrieveStripeCheckoutSession(sessionId)
    } catch (error) {
      console.error('Failed to retrieve Stripe checkout session', error)
      if (outcome === 'success') {
        return NextResponse.json(
          {
            error:
              'We could not verify your checkout with Stripe. Please reach out to support so we can confirm your subscription.',
          },
          { status: 502 },
        )
      }
    }
  }

  const metadataCheckoutId = stripeSession?.metadata?.checkoutSessionId

  if (!checkoutRecord && metadataCheckoutId) {
    checkoutRecord = await checkoutSessions.findFirst({
      where: {
        id: metadataCheckoutId,
        userId: session.user.id,
      },
    })

    if (checkoutRecord && !checkoutRecord.stripeSessionId) {
      checkoutRecord = await checkoutSessions.update({
        where: { id: checkoutRecord.id },
        data: { stripeSessionId: sessionId },
      })
    }
  }

  if (!checkoutRecord) {
    return NextResponse.json(
      { error: 'We could not locate the checkout session you attempted to finalize.' },
      { status: 404 },
    )
  }

  if (outcome === 'cancelled') {
    if (checkoutRecord.status !== CheckoutStatus.COMPLETED) {
      await checkoutSessions.update({
        where: { id: checkoutRecord.id },
        data: {
          status: CheckoutStatus.CANCELLED,
          completedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      status: 'cancelled',
      message: 'Checkout was cancelled. Your selections are still saved so you can try again anytime.',
    })
  }

  if (checkoutRecord.status === CheckoutStatus.COMPLETED) {
    return NextResponse.json({
      status: 'completed',
      message: 'Your subscription details are already confirmed. We will be in touch shortly!',
    })
  }

  const stripeStatus = stripeSession?.status ?? null
  const stripePaymentStatus = stripeSession?.payment_status ?? null
  const stripeCustomerId =
    stripeSession && typeof stripeSession.customer === 'string' ? stripeSession.customer : null
  const stripeSubscriptionId =
    stripeSession && typeof stripeSession.subscription === 'string' ? stripeSession.subscription : null
  const stripeAccessNotes =
    typeof stripeSession?.metadata?.accessNotes === 'string'
      ? stripeSession.metadata.accessNotes.trim().slice(0, 1000)
      : ''

  await checkoutSessions.update({
    where: { id: checkoutRecord.id },
    data: {
      status: CheckoutStatus.COMPLETED,
      completedAt: new Date(),
      stripeStatus,
      stripePaymentStatus,
      stripeCustomerId,
      stripeSubscriptionId,
    },
  })

  try {
    const subscriptions = requireSubscriptionDelegate()
    const services = Array.isArray(checkoutRecord.services) ? checkoutRecord.services : []
    const normalizedServiceDay =
      normalizeServiceDay(checkoutRecord.preferredServiceDay) ??
      normalizeServiceDay(stripeSession?.metadata?.preferredServiceDay) ??
      null
    const normalizedCheckoutAccessNotes =
      typeof checkoutRecord.accessNotes === 'string'
        ? checkoutRecord.accessNotes.trim()
        : ''
    const accessNotes = normalizedCheckoutAccessNotes || stripeAccessNotes || null
    const subscriptionPayload = {
      userId: session.user.id,
      planId: checkoutRecord.planId ?? null,
      planName: checkoutRecord.planName ?? null,
      addressId: checkoutRecord.addressId ?? null,
      addressLabel: checkoutRecord.addressLabel ?? null,
      addressStreet: checkoutRecord.addressStreet,
      addressCity: checkoutRecord.addressCity,
      addressState: checkoutRecord.addressState,
      addressPostalCode: checkoutRecord.addressPostalCode,
      preferredServiceDay: normalizedServiceDay,
      services,
      monthlyTotal: checkoutRecord.monthlyTotal ?? null,
      accessNotes,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeStatus,
      stripePaymentStatus,
    }

    if (stripeSubscriptionId) {
      const existing = await subscriptions.findFirst({
        where: { stripeSubscriptionId },
      })

      if (existing) {
        await subscriptions.update({
          where: { id: existing.id },
          data: subscriptionPayload,
        })
      } else {
        await subscriptions.create({ data: subscriptionPayload })
      }
    } else {
      await subscriptions.create({ data: subscriptionPayload })
    }
  } catch (error) {
    console.error('Failed to sync subscription data after checkout completion', error)
  }

  return NextResponse.json({
    status: 'completed',
    message: 'Thanks! Your subscription is confirmed. We will follow up with scheduling details soon.',
    stripeStatus,
    stripePaymentStatus,
  })
}
