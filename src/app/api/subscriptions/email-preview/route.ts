import { NextResponse } from 'next/server'

import { sendSubscriptionConfirmationEmail } from '@/lib/subscriptionEmails'
import { getSiteUrl } from '@/lib/email'

type PreviewRequestBody = {
  email?: string
  firstName?: string
  lastName?: string
  token?: string
}

const previewServices = [
  {
    id: 'trash',
    name: 'Trash Can Take-Out & Return',
    frequency: 'Weekly',
    monthlyRate: 19.99,
    quantity: 1,
  },
  {
    id: 'bin-wash',
    name: 'Bin Washing',
    frequency: 'Monthly or bi-monthly',
    monthlyRate: 7,
    quantity: 2,
  },
  {
    id: 'poop-scoop',
    name: 'Poop Scoop',
    frequency: 'Bi-weekly (2 visits per month)',
    monthlyRate: 25,
    quantity: 1,
  },
]

const previewAddress = {
  label: 'Service address',
  street: '123 Greenway Lane',
  city: 'Seattle',
  state: 'WA',
  postalCode: '98101',
}

function normalizeEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export async function POST(request: Request) {
  let body: PreviewRequestBody

  try {
    body = (await request.json()) as PreviewRequestBody
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)

  if (!email) {
    return NextResponse.json(
      { error: 'Provide an email address to send the preview to.' },
      { status: 400 },
    )
  }

  const previewToken = process.env.EMAIL_PREVIEW_TOKEN?.trim()

  if (process.env.NODE_ENV === 'production') {
    if (!previewToken) {
      return NextResponse.json({ error: 'Email previews are disabled in production.' }, { status: 403 })
    }

    if (body.token !== previewToken) {
      return NextResponse.json({ error: 'Invalid preview token.' }, { status: 403 })
    }
  }

  try {
    const siteUrl = getSiteUrl()

    const result = await sendSubscriptionConfirmationEmail({
      to: email,
      firstName: body.firstName ?? 'Trash Panda friend',
      lastName: body.lastName ?? '',
      services: previewServices,
      address: previewAddress,
      serviceDay: 'MONDAY',
      planName: 'Curbside Essentials',
      monthlyTotal: 58.0,
      accessNotes: 'Gate code is 1234; bins are on the right side of the garage.',
      manageUrl: `${siteUrl}/dash/manage`,
      supportEmail: process.env.CONTACT_RECIPIENT ?? undefined,
      supportPhone: process.env.CONTACT_PHONE ?? undefined,
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('Failed to send preview subscription email', error)
    return NextResponse.json(
      { error: 'Could not send preview email. Check SMTP settings and try again.' },
      { status: 500 },
    )
  }
}
