import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const DEFAULT_SERVICES = [
  {
    name: 'Home Care Basic',
    price: 44.99,
    savings: 'Save $5.00 each month',
    unit: 'mo',
    description: 'Weekly trash service plus twice-monthly poop scoop visits.',
  },
  {
    name: 'Home Care Plus',
    price: 57.59,
    savings: 'Save $6.40 each month',
    unit: 'mo',
    description:
      'Trash pickup with bin washing (two cans) and porch blowing twice per month.',
  },
  {
    name: 'Trash Can Take-Out & Return',
    price: 19.99,
    unit: 'mo',
    description: 'Weekly base subscription; final pricing confirmed after visit.',
  },
  {
    name: 'Bin Washing',
    price: 7.0,
    unit: 'can',
    description: 'Monthly or bi-monthly; billed per can.',
  },
  {
    name: 'Poop Scoop',
    price: 15.0,
    unit: 'visit / month',
    description: 'Bi-weekly (2 visits per month); final pricing confirmed after visit.',
  },
  {
    name: 'Porch / Driveway Blowing',
    price: 15.0,
    unit: 'visit / month',
    description: 'As needed; ideal before hosting or after storms.',
  },
  {
    name: 'Yard Raking',
    price: 8.33,
    unit: 'visit / season',
    description: 'Seasonal autumn service averaged across 3-month fall season.',
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
