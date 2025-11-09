import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

type PrismaWithCheckoutSessions = PrismaClient & {
  checkoutSession?: Prisma.CheckoutSessionDelegate<false>
}

export function requireCheckoutSessionDelegate() {
  const delegate = (prisma as PrismaWithCheckoutSessions).checkoutSession

  if (!delegate) {
    throw new Error(
      'Prisma client is missing the CheckoutSession model. Run `npx prisma generate` and restart the server.',
    )
  }

  return delegate
}
