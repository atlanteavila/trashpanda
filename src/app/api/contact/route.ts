import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

type ContactRequestBody = {
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  phone?: string
  message?: string
  serviceFrequency?: string
}

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

const serviceFrequencyLabels: Record<string, string> = {
  weekly: 'Weekly roll-out and return',
  biweekly: 'Every other week',
  vacation: 'Seasonal or vacation coverage',
  unsure: 'Not sure yet',
}

function sanitize(value: string | undefined): string {
  return value?.toString().trim() ?? ''
}

export async function POST(request: Request) {
  let body: ContactRequestBody

  try {
    body = (await request.json()) as ContactRequestBody
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const firstName = sanitize(body.firstName)
  const lastName = sanitize(body.lastName)
  const email = sanitize(body.email)
  const message = sanitize(body.message)

  if (!firstName || !lastName || !email || !message) {
    return NextResponse.json({ error: 'First name, last name, email, and message are required.' }, { status: 400 })
  }

  if (message.length > 500) {
    return NextResponse.json({ error: 'Message must be 500 characters or fewer.' }, { status: 400 })
  }

  const company = sanitize(body.company)
  const phone = sanitize(body.phone)
  const serviceFrequency = sanitize(body.serviceFrequency)

  const frequencyLabel = serviceFrequencyLabels[serviceFrequency] ?? 'Not specified'

  const fromAddress = sanitize(process.env.SMTP_FROM) || process.env.SMTP_USER || ''
  const recipient = sanitize(process.env.CONTACT_RECIPIENT) || process.env.SMTP_USER || ''

  if (!fromAddress || !recipient) {
    return NextResponse.json(
      { error: 'Email routing is not configured. Please set SMTP_FROM (or SMTP_USER) and CONTACT_RECIPIENT.' },
      { status: 500 },
    )
  }

  const plainMessage = `You received a new message from the Trash Panda website.\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nCompany: ${company || 'Not provided'}\nService frequency: ${frequencyLabel}\n\nMessage:\n${message}`

  const htmlMessage = `
    <p>You received a new message from the Trash Panda website.</p>
    <ul>
      <li><strong>Name:</strong> ${firstName} ${lastName}</li>
      <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
      <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
      <li><strong>Company:</strong> ${company || 'Not provided'}</li>
      <li><strong>Service frequency:</strong> ${frequencyLabel}</li>
    </ul>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br />')}</p>
  `

  try {
    const transporter = await transporterPromise

    await transporter.sendMail({
      from: `Trash Panda Website <${fromAddress}>`,
      to: recipient,
      replyTo: email,
      subject: `New contact request from ${firstName} ${lastName}`,
      text: plainMessage,
      html: htmlMessage,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send contact email', error)
    return NextResponse.json({ error: 'We could not send your message. Please try again later.' }, { status: 500 })
  }
}
