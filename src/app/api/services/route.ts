import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const DEFAULT_SERVICES = [
  {
    name: 'Curbside Classic',
    description: 'Weekly trash can roll-out and return with reminder texts.',
    price: 19.99,
    unit: 'per month',
  },
  {
    name: 'Home Care Basic',
    description: 'Weekly trash help plus twice-monthly yard freshness.',
    price: 44.99,
    unit: 'per month',
  },
  {
    name: 'Home Care Plus',
    description: 'Premium curbside concierge service with seasonal extras.',
    price: 57.59,
    unit: 'per month',
  },
  {
    name: 'One-Time Deep Clean',
    description: 'Single-visit bin cleaning and sanitation for two cans.',
    price: 29.0,
    unit: 'per visit',
  },
]

export async function GET() {
  try {
    let services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })

    if (services.length === 0) {
      services = await prisma.$transaction(
        DEFAULT_SERVICES.map((service) =>
          prisma.service.create({
            data: service,
          }),
        ),
      )
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Failed to load services', error)
    return NextResponse.json(
      { error: 'Unable to load services right now. Please try again later.' },
      { status: 500 },
    )
  }
}
