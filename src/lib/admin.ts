import type { Session } from 'next-auth'

function getAdminEmailList() {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminUser(user: Session['user'] | null | undefined): boolean {
  if (!user?.email) {
    return false
  }

  const email = user.email.trim().toLowerCase()
  const adminEmails = getAdminEmailList()

  return adminEmails.includes(email)
}
