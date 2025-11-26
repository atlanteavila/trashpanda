import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import Credentials from 'next-auth/providers/credentials'

import prisma from './prisma'

const credentials = Credentials({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(rawCredentials) {
    if (!rawCredentials || typeof rawCredentials !== 'object' || Array.isArray(rawCredentials)) {
      return null
    }

    const credentialRecord = rawCredentials as Record<string, unknown>
    const emailValue = credentialRecord.email
    const passwordValue = credentialRecord.password

    const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : ''
    const password = typeof passwordValue === 'string' ? passwordValue : ''

    if (!email || !password) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.hashedPassword) {
      return null
    }

    const isValid = await compare(password, user.hashedPassword)

    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
    }
  },
})

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [credentials],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.firstName = (user as unknown as { firstName?: string }).firstName
        token.lastName = (user as unknown as { lastName?: string }).lastName
        token.email = user.email
        token.phone = (user as unknown as { phone?: string | null }).phone ?? null
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        if (token.email && !session.user.email) {
          session.user.email = token.email as string
        }
        if ('phone' in token) {
          session.user.phone = (token.phone as string | null | undefined) ?? null
        }
      }

      return session
    },
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions)
