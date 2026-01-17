import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createStripeCheckoutSession, getAppBaseUrl } from '@/lib/stripe'

type CheckoutRequest = {
  estimateIds?: string[]
}

type Estimate = {
  addresses: any[];
  lineItems: any[];
  monthlyAdjustment: number,
  id: string | number;
}

function normalizeEstimateIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter((id) => id.length > 0)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to checkout.' }, { status: 401 })
  }

  let payload: CheckoutRequest
  try {
    payload = (await request.json()) as CheckoutRequest
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const estimateIds = normalizeEstimateIds(payload.estimateIds)
  if (estimateIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one plan to checkout.' }, { status: 400 })
  }

  const estimates = await prisma.customEstimate.findMany({
    where: {
      id: { in: estimateIds },
      userId: session.user.id,
      paymentStatus: 'PENDING',
      status: {
        in: ['SENT', 'ACCEPTED', 'ACTIVE'],
      },
    },
  })

  if (estimates.length === 0) {
    return NextResponse.json(
      { error: 'No eligible custom plans were found for checkout.' },
      { status: 400 },
    )
  }

  const lineItems = estimates.flatMap((estimate: Estimate) => {
    const addressSummary = Array.isArray(estimate.addresses)
      ? estimate.addresses
          .map((address: any) => address.label || address.street)
          .filter(Boolean)
          .join(', ')
      : ''

    const estimateLabel = addressSummary ? ` (${addressSummary})` : ''

    const items = Array.isArray(estimate.lineItems)
      ? estimate.lineItems.map((item: any) => ({
          id: item.id ?? estimate.id,
          name: `${item.description ?? 'Custom service'}${estimateLabel}`,
          quantity: Number(item.quantity ?? 1),
          monthlyRate: Number(item.monthlyRate ?? 0),
          frequency: item.frequency ?? 'Monthly',
          notes: item.notes ?? undefined,
        }))
      : []

    if (estimate.monthlyAdjustment && Number(estimate.monthlyAdjustment) !== 0) {
      items.push({
        id: `adjustment-${estimate.id}`,
        name: `Custom adjustment${estimateLabel}`,
        quantity: 1,
        monthlyRate: Number(estimate.monthlyAdjustment),
        frequency: 'Monthly',
        notes: undefined,
      })
    }

    return items
  })

  const filteredItems = lineItems.filter(
    (item: any) =>
      Number.isFinite(item.quantity) &&
      Number(item.quantity) > 0 &&
      Number.isFinite(item.monthlyRate) &&
      Number(item.monthlyRate) > 0,
  )

  if (filteredItems.length === 0) {
    return NextResponse.json(
      { error: 'Selected plans are missing billable line items.' },
      { status: 400 },
    )
  }

  const baseUrl = getAppBaseUrl(request)

  try {
    const checkoutSession = await createStripeCheckoutSession({
      items: filteredItems,
      customerEmail: session.user.email ?? null,
      successUrl: `${baseUrl}/dash/custom-plans?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dash/custom-plans?checkout=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        estimateIds: estimates.map((estimate: Estimate) => estimate.id).join(','),
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Failed to create custom estimate checkout', error)
    return NextResponse.json(
      { error: 'Unable to start checkout. Please try again.' },
      { status: 500 },
    )
  }
}
