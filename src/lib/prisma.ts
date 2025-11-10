import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

type PrismaWithDashboardModels = PrismaClient & {
  checkoutSession?: Prisma.CheckoutSessionDelegate
  subscription?: Prisma.SubscriptionDelegate
}

export function requireCheckoutSessionDelegate() {
  const delegate = (prisma as PrismaWithDashboardModels).checkoutSession

  if (!delegate) {
    throw new Error(
      'Prisma client is missing the CheckoutSession model. Run `npx prisma generate` and restart the server.',
    )
  }

  return delegate
}

export function requireSubscriptionDelegate() {
  const delegate = (prisma as PrismaWithDashboardModels).subscription

  if (!delegate) {
    throw new Error(
      'Prisma client is missing the Subscription model. Run `npx prisma generate` and restart the server.',
    )
  }

  return delegate
}
