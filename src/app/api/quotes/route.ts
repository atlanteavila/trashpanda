import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

type QuoteServiceInput = {
  serviceId?: string
  quantity?: number
}

type QuoteRequestBody = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  notes?: string
  services?: QuoteServiceInput[]
}

const QUOTE_COOKIE = 'quoteId'

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET() {
  const quoteId = cookies().get(QUOTE_COOKIE)?.value

  if (!quoteId) {
    return NextResponse.json({ quote: null })
  }

  try {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } })

    if (!quote) {
      const response = NextResponse.json({ quote: null })
      response.cookies.set(QUOTE_COOKIE, '', { path: '/', maxAge: 0 })
      return response
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Failed to fetch saved quote', error)
    return NextResponse.json({ quote: null }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: QuoteRequestBody

  try {
    body = (await request.json()) as QuoteRequestBody
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const firstName = sanitizeString(body.firstName)
  const lastName = sanitizeString(body.lastName)
  const email = sanitizeString(body.email)
  const phone = sanitizeString(body.phone)
  const street = sanitizeString(body.street)
  const city = sanitizeString(body.city)
  const state = sanitizeString(body.state)
  const postalCode = sanitizeString(body.postalCode)
  const notes = sanitizeString(body.notes)
  const serviceSelections = Array.isArray(body.services)
    ? body.services
    : []

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: 'First name, last name, and email are required.' },
      { status: 400 },
    )
  }

  const validServiceIds = serviceSelections
    .map((service) => {
      const parsedQuantity = Number(service.quantity)

      return {
        serviceId: sanitizeString(service.serviceId),
        quantity:
          Number.isFinite(parsedQuantity) && parsedQuantity > 0
            ? parsedQuantity
            : 1,
      }
    })
    .filter((service) => Boolean(service.serviceId))

  if (validServiceIds.length === 0) {
    return NextResponse.json(
      { error: 'Please select at least one service.' },
      { status: 400 },
    )
  }

  try {
    const services = await prisma.service.findMany({
      where: {
        id: { in: validServiceIds.map((service) => service.serviceId) },
        active: true,
      },
    })

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Selected services could not be found.' },
        { status: 400 },
      )
    }

    const pricedServices = services.map((service) => {
      const quantity =
        validServiceIds.find((selection) => selection.serviceId === service.id)
          ?.quantity ?? 1

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        savings: service.savings,
        price: service.price,
        unit: service.unit,
        quantity,
        lineTotal: Math.round(service.price * quantity * 100) / 100,
      }
    })

    const estimatedTotal = pricedServices.reduce(
      (sum, service) => sum + service.lineTotal,
      0,
    )

    const quote = await prisma.quote.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        street: street || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        notes: notes || null,
        services: pricedServices,
        estimatedTotal,
      },
    })

    const response = NextResponse.json({ quote })
    response.cookies.set(QUOTE_COOKIE, quote.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('Failed to create quote', error)
    return NextResponse.json(
      { error: 'Unable to save your quote right now. Please try again later.' },
      { status: 500 },
    )
  }
}
