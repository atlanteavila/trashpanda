const STRIPE_API_BASE = 'https://api.stripe.com/v1'

let cachedSecretKey: string | null = null

function getStripeSecretKey() {
  if (cachedSecretKey) {
    return cachedSecretKey
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  cachedSecretKey = secret
  return cachedSecretKey
}

export interface StripeCheckoutItem {
  id: string
  name: string
  quantity: number
  monthlyRate: number
  frequency: string
  notes?: string
}

export interface StripeCheckoutOptions {
  items: StripeCheckoutItem[]
  customerEmail?: string | null
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string | null | undefined>
}

export async function createStripeCheckoutSession(options: StripeCheckoutOptions) {
  const secretKey = getStripeSecretKey()

  const params = new URLSearchParams()
  params.append('mode', 'subscription')
  params.append('allow_promotion_codes', 'true')
  params.append('success_url', options.successUrl)
  params.append('cancel_url', options.cancelUrl)

  if (options.customerEmail) {
    params.append('customer_email', options.customerEmail)
  }

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      if (typeof value === 'string' && value.length > 0) {
        params.append(`metadata[${key}]`, value)
      }
    }
  }

  options.items.forEach((item, index) => {
    params.append(`line_items[${index}][quantity]`, String(item.quantity))
    params.append(`line_items[${index}][price_data][currency]`, 'usd')
    params.append(
      `line_items[${index}][price_data][unit_amount]`,
      String(Math.round(item.monthlyRate * 100)),
    )
    params.append(`line_items[${index}][price_data][recurring][interval]`, 'month')
    params.append(`line_items[${index}][price_data][product_data][name]`, item.name)
    params.append(`line_items[${index}][price_data][product_data][description]`, item.frequency)
    params.append(
      `line_items[${index}][price_data][product_data][metadata][serviceId]`,
      item.id,
    )
    if (item.notes) {
      params.append(
        `line_items[${index}][price_data][product_data][metadata][notes]`,
        item.notes.slice(0, 500),
      )
    }
  })

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = (await response.json()) as { url?: string; error?: { message?: string } }

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Stripe returned an error response.')
  }

  if (!data.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return data
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
