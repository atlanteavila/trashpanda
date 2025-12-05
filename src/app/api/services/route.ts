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
      orderBy: { name: 'asc' },
    })

    const serviceByName = new Map(services.map((service) => [service.name, service]))

    const mutations = DEFAULT_SERVICES.flatMap((service) => {
      const existing = serviceByName.get(service.name)
      if (!existing) {
        return [prisma.service.create({ data: service })]
      }

      const needsUpdate =
        existing.price !== service.price ||
        existing.description !== service.description ||
        existing.unit !== service.unit ||
        existing.savings !== service.savings ||
        existing.active === false

      return needsUpdate
        ? [
            prisma.service.update({
              where: { id: existing.id },
              data: { ...service, active: true },
            }),
          ]
        : []
    })

    if (mutations.length > 0) {
      await prisma.$transaction(mutations)
      services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
    } else {
      services = services.filter((service) => service.active)
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
