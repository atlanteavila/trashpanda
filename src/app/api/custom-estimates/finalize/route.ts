import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { retrieveStripeCheckoutSession } from '@/lib/stripe'

type FinalizePayload = {
  sessionId?: string
  outcome?: 'success' | 'cancelled'
}

function normalizeEstimateIds(value: unknown) {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to finalize checkout.' }, { status: 401 })
  }

  let payload: FinalizePayload
  try {
    payload = (await request.json()) as FinalizePayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const outcome = payload.outcome === 'success' ? 'success' : 'cancelled'
  if (outcome === 'cancelled') {
    return NextResponse.json({
      status: 'cancelled',
      message: 'Checkout was cancelled. Your plans are still available.',
    })
  }

  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : ''
  if (!sessionId) {
    return NextResponse.json({ error: 'Stripe session id is required.' }, { status: 400 })
  }

  try {
    const stripeSession = await retrieveStripeCheckoutSession(sessionId)
    const estimateIds = normalizeEstimateIds(stripeSession.metadata?.estimateIds)
    const stripeSubscriptionId =
      typeof stripeSession.subscription === 'string' ? stripeSession.subscription : null

    if (estimateIds.length === 0) {
      return NextResponse.json({ error: 'No estimate metadata found.' }, { status: 400 })
    }

    await prisma.customEstimate.updateMany({
      where: {
        id: { in: estimateIds },
        userId: session.user.id,
      },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'ACTIVE',
        stripeSubscriptionId,
      },
    })

    return NextResponse.json({
      status: 'completed',
      message: 'Payment received. Your custom plan is now active.',
      estimateIds,
    })
  } catch (error) {
    console.error('Failed to finalize custom estimate checkout', error)
    return NextResponse.json(
      { error: 'We could not finalize your checkout. Please contact support.' },
      { status: 500 },
    )
  }
}
