import NextAuth, { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string
      firstName: string
      lastName: string
      phone?: string | null
    }
  }

  interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string | null
  }
}
