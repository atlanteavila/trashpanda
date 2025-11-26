import nodemailer from 'nodemailer'

const transporterPromise = (async () => {
  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT ?? '', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || Number.isNaN(port) || !user || !pass) {
    throw new Error(
      'SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.',
    )
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
})()

export async function getEmailTransporter() {
  return transporterPromise
}

export function getFromAddress(): string {
  return (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '').trim()
}

export function getSiteUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetrashpanda.net'
  return baseUrl.replace(/\/$/, '')
}

export const brandColors = {
  primary: '#16a34a',
  dark: '#0f2f24',
  light: '#f0fdf4',
  slate: '#0f172a',
}
