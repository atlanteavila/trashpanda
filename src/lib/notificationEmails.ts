import type { SentMessageInfo } from 'nodemailer'

import { brandColors, getEmailTransporter, getFromAddress, getSiteUrl } from './email'
import { escapeHtml, renderEmailLayout } from './emailTemplates'

export type SignupEmailPayload = {
  to: string
  firstName?: string | null
  lastName?: string | null
}

export type CustomEstimateLineItem = {
  id?: string
  description: string
  frequency?: string | null
  quantity?: number | null
  monthlyRate?: number | null
  lineTotal?: number | null
  notes?: string | null
}

export type CustomEstimateAddress = {
  id?: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

export type CustomEstimateEmailPayload = {
  to: string
  firstName?: string | null
  lastName?: string | null
  estimateId: string
  addresses: CustomEstimateAddress[]
  lineItems: CustomEstimateLineItem[]
  monthlyAdjustment?: number | null
  total: number
  preferredServiceDay?: string | null
  notes?: string | null
  reviewUrl?: string
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function buildLineItemRows(items: CustomEstimateLineItem[]): string {
  if (!items.length) {
    return `<tr><td colspan="4" style="padding: 12px; text-align: center; color:#475569;">We will confirm the quote details shortly.</td></tr>`
  }

  return items
    .map((item) => {
      const description = escapeHtml(item.description)
      const frequency = escapeHtml(item.frequency ?? 'Monthly')
      const quantity = item.quantity ?? 1
      const lineTotal =
        typeof item.lineTotal === 'number'
          ? item.lineTotal
          : (item.monthlyRate ?? 0) * quantity

      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${description}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color:#0f172a;">${frequency}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color:#0f172a;">${quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color:#0f172a;">${formatCurrency(lineTotal)}</td>
        </tr>`
    })
    .join('\n')
}

function buildAddressesHtml(addresses: CustomEstimateAddress[]): string {
  if (!addresses.length) {
    return '<p style="margin: 0; font-size: 14px; color:#475569;">We will confirm the service address on your account.</p>'
  }

  const items = addresses
    .map((address) => {
      const label = address.label ? `${escapeHtml(address.label)} — ` : ''
      return `<li style="margin: 0 0 6px 0;">${label}${escapeHtml(
        address.street,
      )}, ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(
        address.postalCode,
      )}</li>`
    })
    .join('')

  return `<ul style="margin: 8px 0 0 18px; padding: 0; font-size: 14px; color:#475569;">${items}</ul>`
}

function buildAddressesText(addresses: CustomEstimateAddress[]): string {
  if (!addresses.length) {
    return 'We will confirm the service address on your account.'
  }

  return addresses
    .map((address) => {
      const label = address.label ? `${address.label}: ` : ''
      return `${label}${address.street}, ${address.city}, ${address.state} ${address.postalCode}`
    })
    .join('\n')
}

export function buildSignupWelcomeEmail(payload: SignupEmailPayload) {
  const siteUrl = getSiteUrl()
  const name = payload.firstName?.trim() || payload.lastName?.trim() || 'there'
  const loginUrl = `${siteUrl}/login`

  const contentHtml = `
    <p style="margin: 0; font-size: 16px; font-weight: 600; color:${brandColors.slate};">Hi ${escapeHtml(
      name,
    )},</p>
    <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 24px; color:#0f172a;">
      Welcome to Trash Panda! We are excited to keep your pickup day effortless. You can sign in to view your account, update service details, or start a custom plan whenever you are ready.
    </p>
  `

  const text = `Hi ${name},\n\nWelcome to Trash Panda! You can sign in to manage your account and start new services.\n\nSign in: ${loginUrl}\n`

  return {
    subject: 'Welcome to Trash Panda',
    html: renderEmailLayout({
      subject: 'Welcome to Trash Panda',
      heading: 'Welcome',
      preheader: 'Thanks for signing up for Trash Panda.',
      contentHtml,
      action: {
        label: 'Sign in',
        url: loginUrl,
      },
    }),
    text,
  }
}

export function buildCustomEstimateEmail(payload: CustomEstimateEmailPayload) {
  const siteUrl = getSiteUrl()
  const name = payload.firstName?.trim() || payload.lastName?.trim() || 'there'
  const reviewUrl = payload.reviewUrl || `${siteUrl}/dash/custom-plans`
  const preferredDay = payload.preferredServiceDay
    ? payload.preferredServiceDay.trim().toUpperCase()
    : null
  const adjustmentText =
    typeof payload.monthlyAdjustment === 'number' && payload.monthlyAdjustment !== 0
      ? `Monthly adjustment: ${formatCurrency(payload.monthlyAdjustment)}`
      : null

  const contentHtml = `
    <p style="margin: 0; font-size: 16px; font-weight: 600; color:${brandColors.slate};">Hi ${escapeHtml(
      name,
    )},</p>
    <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 24px; color:#0f172a;">
      Your custom quote is ready. Review the details below, then approve and checkout when you are ready.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="background:${brandColors.light}; padding: 14px 16px; font-weight: 700; color:${brandColors.slate}; border-bottom: 1px solid #e2e8f0;">Quote details</td>
      </tr>
      <tr>
        <td style="padding: 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr style="background:#f8fafc; color:${brandColors.slate}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">
                <th align="left" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Item</th>
                <th align="left" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Frequency</th>
                <th align="center" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Qty</th>
                <th align="right" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Monthly</th>
              </tr>
            </thead>
            <tbody>
              ${buildLineItemRows(payload.lineItems)}
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; text-align: right; font-weight: 700; color:${brandColors.slate};">Estimated monthly total: ${formatCurrency(
          payload.total,
        )}</td>
      </tr>
    </table>
    ${
      adjustmentText
        ? `<p style="margin: 12px 0 0 0; font-size: 13px; color:#475569;">${adjustmentText}</p>`
        : ''
    }
    <div style="margin-top: 18px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color:${brandColors.slate};">Service addresses</p>
      ${buildAddressesHtml(payload.addresses)}
    </div>
    ${
      preferredDay
        ? `<p style="margin: 12px 0 0 0; font-size: 14px; color:#475569;">Preferred service day: ${escapeHtml(
            preferredDay,
          )}</p>`
        : ''
    }
    ${
      payload.notes
        ? `<div style="margin-top: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background:${brandColors.light}; color:#0f172a;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color:${brandColors.slate};">Notes from your Trash Panda team</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color:#475569;">${escapeHtml(
              payload.notes,
            )}</p>
          </div>`
        : ''
    }
  `

  const lines = payload.lineItems.length
    ? payload.lineItems
        .map((item) => {
          const qty = item.quantity ?? 1
          const total =
            typeof item.lineTotal === 'number'
              ? item.lineTotal
              : (item.monthlyRate ?? 0) * qty
          return `- ${item.description} (${item.frequency ?? 'Monthly'}) x${qty}: ${formatCurrency(
            total,
          )}`
        })
        .join('\n')
    : 'We will confirm your quote details shortly.'

  const text = `Hi ${name},\n\nYour custom quote is ready. Review the details below, then approve and checkout when you are ready.\n\n${lines}\nEstimated monthly total: ${formatCurrency(
    payload.total,
  )}\n${adjustmentText ? `${adjustmentText}\n` : ''}\nService addresses:\n${buildAddressesText(
    payload.addresses,
  )}\n${preferredDay ? `Preferred service day: ${preferredDay}\n` : ''}\n${
    payload.notes ? `Notes: ${payload.notes}\n` : ''
  }\nReview and approve: ${reviewUrl}\n`

  return {
    subject: 'Your Trash Panda custom quote is ready',
    html: renderEmailLayout({
      subject: 'Your Trash Panda custom quote is ready',
      heading: 'Custom quote ready',
      preheader: 'Review your Trash Panda custom quote and approve it online.',
      contentHtml,
      action: {
        label: 'Review & approve quote',
        url: reviewUrl,
      },
    }),
    text,
  }
}

export async function sendSignupWelcomeEmail(payload: SignupEmailPayload): Promise<SentMessageInfo> {
  const transporter = await getEmailTransporter()
  const fromAddress = getFromAddress()

  if (!fromAddress) {
    throw new Error('Email routing is not configured. Please set SMTP_FROM (or SMTP_USER).')
  }

  const { subject, html, text } = buildSignupWelcomeEmail(payload)

  return transporter.sendMail({
    from: fromAddress,
    to: payload.to,
    subject,
    html,
    text,
  })
}

export async function sendCustomEstimateEmail(
  payload: CustomEstimateEmailPayload,
): Promise<SentMessageInfo> {
  const transporter = await getEmailTransporter()
  const fromAddress = getFromAddress()

  if (!fromAddress) {
    throw new Error('Email routing is not configured. Please set SMTP_FROM (or SMTP_USER).')
  }

  const { subject, html, text } = buildCustomEstimateEmail(payload)

  return transporter.sendMail({
    from: fromAddress,
    to: payload.to,
    subject,
    html,
    text,
  })
}
