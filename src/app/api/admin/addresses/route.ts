import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import prisma from '@/lib/prisma'

type AddressPayload = {
  userId?: string
  label?: string | null
  street?: string
  city?: string
  state?: string
  postalCode?: string
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to add an address.' }, { status: 401 })
  }

  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: 'Only admins can add addresses.' }, { status: 403 })
  }

  let payload: AddressPayload
  try {
    payload = (await request.json()) as AddressPayload
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : ''
  const street = typeof payload.street === 'string' ? payload.street.trim() : ''
  const city = typeof payload.city === 'string' ? payload.city.trim() : ''
  const state = typeof payload.state === 'string' ? payload.state.trim().toUpperCase() : ''
  const postalCode = typeof payload.postalCode === 'string' ? payload.postalCode.trim() : ''
  const label = typeof payload.label === 'string' ? payload.label.trim() : null

  if (!userId || !street || !city || !state || !postalCode) {
    return NextResponse.json(
      { error: 'Provide user id and a complete address.' },
      { status: 400 },
    )
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label,
      street,
      city,
      state,
      postalCode,
    },
  })

  return NextResponse.json({
    address: {
      id: address.id,
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    },
  })
}
