import type { SentMessageInfo } from 'nodemailer'

import {
  brandColors,
  getEmailAssetBaseUrl,
  getEmailTransporter,
  getFromAddress,
  getSiteUrl,
} from './email'

export type SubscriptionServiceLine = {
  id?: string
  name?: string
  frequency?: string
  monthlyRate?: number
  quantity?: number
  notes?: string | null
}

type AddressSnapshot = {
  street: string
  city: string
  state: string
  postalCode: string
  label?: string | null
}

type SubscriptionEmailPayload = {
  to: string
  firstName?: string | null
  lastName?: string | null
  services: SubscriptionServiceLine[]
  address: AddressSnapshot
  serviceDay?: string | null
  planName?: string | null
  monthlyTotal?: number | null
  accessNotes?: string | null
  manageUrl?: string
  supportEmail?: string
  supportPhone?: string
}

type SubscriptionEmailContentOptions = {
  subject: string
  statusLabel?: string
  introLine?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function normalizeServiceDay(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function normalizeServices(rawServices: SubscriptionServiceLine[]): Array<Required<SubscriptionServiceLine>> {
  const services: Array<Required<SubscriptionServiceLine>> = []

  for (const item of rawServices) {
    const name = typeof item.name === 'string' ? item.name : ''
    const frequency = typeof item.frequency === 'string' ? item.frequency : ''
    const monthlyRate = Number.isFinite(item.monthlyRate) ? Number(item.monthlyRate) : NaN
    const quantity = Number.isFinite(item.quantity) ? Number(item.quantity) : NaN

    if (!name || !frequency || Number.isNaN(monthlyRate) || Number.isNaN(quantity)) {
      continue
    }

    services.push({
      id: typeof item.id === 'string' ? item.id : '',
      name,
      frequency,
      monthlyRate,
      quantity,
      notes: typeof item.notes === 'string' ? item.notes : item.notes === null ? null : '',
    })
  }

  return services
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function buildServiceTableRows(services: Array<Required<SubscriptionServiceLine>>): string {
  return services
    .map((service) => {
      const lineTotal = service.monthlyRate * service.quantity
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(service.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(service.frequency)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #0f172a;">${service.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a;">${formatCurrency(lineTotal)}</td>
        </tr>`
    })
    .join('\n')
}

function buildServicesText(services: Array<Required<SubscriptionServiceLine>>): string {
  return services
    .map((service) => {
      const lineTotal = service.monthlyRate * service.quantity
      return `- ${service.name} (${service.frequency}) x${service.quantity}: ${formatCurrency(lineTotal)}`
    })
    .join('\n')
}

function buildSubscriptionEmailHtml(
  payload: SubscriptionEmailPayload,
  options: SubscriptionEmailContentOptions,
): string {
  const siteUrl = getSiteUrl()
  const services = normalizeServices(payload.services)
  const serviceDay = normalizeServiceDay(payload.serviceDay)
  const userName = payload.firstName?.trim() || payload.lastName?.trim() || 'Trash Panda friend'
  const statusLabel = options.statusLabel || 'Subscription confirmed'
  const introLine =
    options.introLine ||
    'Thanks for choosing The Trash Panda. Your subscription is set! Here are the details we have on file.'
  const manageUrl = payload.manageUrl || `${siteUrl}/dash/manage`
  const supportEmail = payload.supportEmail || 'support@thetrashpanda.net'
  const supportPhone = payload.supportPhone || process.env.CONTACT_PHONE?.trim()
  const logoUrl = `https://catholic-web-hosting.nyc3.cdn.digitaloceanspaces.com/trash-panda-logo.png`
  const supportPhoneHref = supportPhone ? supportPhone.replace(/[^+\d]/g, '') || supportPhone : null
  const planName = payload.planName?.trim()
  const monthlyTotal = formatCurrency(payload.monthlyTotal ?? 0)
  const addressLabel = payload.address.label?.trim() ?? 'Service address'
  const addressLines = `${escapeHtml(payload.address.street)}, ${escapeHtml(payload.address.city)}, ${escapeHtml(payload.address.state)} ${escapeHtml(payload.address.postalCode)}`

  const serviceRows = buildServiceTableRows(services)

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(options.subject)}</title>
    </head>
    <body style="margin:0; padding:0; background:${brandColors.light}; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:${brandColors.slate};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColors.light}; padding: 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius: 16px; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 24px; background: linear-gradient(120deg, ${brandColors.primary}, #34d399);">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 64px;" align="left">
                        <img src="${logoUrl}" alt="The Trash Panda" width="56" height="56" style="display:block; border-radius: 14px; background:#ffffff; padding: 4px;" />
                      </td>
                      <td align="left" style="padding-left: 12px; color:#ecfdf3;">
                        <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9;">${escapeHtml(statusLabel)}</div>
                        <div style="font-size: 26px; font-weight: 800; margin-top: 6px;">Welcome to The Trash Panda!</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 32px 12px 32px;">
                  <h1 style="margin:0; font-size: 22px; font-weight: 800; color:${brandColors.slate};">Hi ${escapeHtml(userName)},</h1>
                  <p style="margin:12px 0 0 0; font-size: 15px; line-height: 24px; color:#0f172a;">
                    ${escapeHtml(introLine)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 32px 0 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="background:${brandColors.light}; padding: 14px 16px; font-weight: 700; color:${brandColors.slate}; border-bottom: 1px solid #e2e8f0;">Your services</td>
                    </tr>
                    <tr>
                      <td style="padding: 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                          <thead>
                            <tr style="background:#f8fafc; color:${brandColors.slate}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">
                              <th align="left" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Service</th>
                              <th align="left" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Frequency</th>
                              <th align="center" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Qty</th>
                              <th align="right" style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">Monthly</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${serviceRows || `<tr><td colspan="4" style="padding: 12px; text-align: center; color:#475569;">We will confirm your services shortly.</td></tr>`}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; text-align: right; font-weight: 700; color:${brandColors.slate};">Estimated monthly total: ${monthlyTotal}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 32px 8px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="width: 50%; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background:#f8fafc;">
                        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color:${brandColors.slate};">Service day</div>
                        <div style="margin-top: 6px; font-size: 15px; color:#0f172a;">${serviceDay ? escapeHtml(serviceDay) : 'We will coordinate your preferred day.'}</div>
                      </td>
                      <td style="width: 50%; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background:#f8fafc;">
                        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color:${brandColors.slate};">${escapeHtml(addressLabel)}</div>
                        <div style="margin-top: 6px; font-size: 15px; color:#0f172a; line-height: 1.6;">${addressLines}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 32px 8px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background:${brandColors.light}; color:#0f172a;">
                        <div style="font-size: 14px; line-height: 22px;">
                          ${payload.accessNotes ? `<strong style="color:${brandColors.slate};">Access notes:</strong> ${escapeHtml(payload.accessNotes)}` : 'Need to add gate codes, pet notes, or parking tips? You can update your access instructions anytime.'}
                        </div>
                        <div style="margin-top: 14px;">
                          <a href="${manageUrl}" style="display: inline-block; padding: 12px 18px; background:${brandColors.primary}; color:#ffffff; text-decoration: none; border-radius: 999px; font-weight: 700; box-shadow: 0 8px 24px rgba(22, 163, 74, 0.25);">Manage my subscription</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 32px 32px 32px;">
                  <p style="margin: 0; font-size: 14px; color:#475569; line-height: 22px;">
                    If anything looks off, reply to this email, call us${supportPhone ? ` at <a href="tel:${supportPhoneHref}" style="color:${brandColors.primary}; text-decoration: none; font-weight: 600;">${escapeHtml(supportPhone)}</a>` : ''}, or reach us at <a href="mailto:${supportEmail}" style="color:${brandColors.primary}; text-decoration: none; font-weight: 600;">${supportEmail}</a>. We are here to help keep pickup day effortless.
                  </p>
                  <p style="margin: 12px 0 0 0; font-size: 14px; color:#475569;">See you soon!<br />The Trash Panda team</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="margin-top: 12px; color:#64748b; font-size: 12px;">
              <tr>
                <td align="center" style="padding: 8px 16px;">You are receiving this message because you signed up for Trash Panda services. Manage preferences at <a href="${manageUrl}" style="color:${brandColors.primary}; text-decoration: none;">your dashboard</a>.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

function buildSubscriptionEmailText(
  payload: SubscriptionEmailPayload,
  options: SubscriptionEmailContentOptions,
): string {
  const siteUrl = getSiteUrl()
  const services = normalizeServices(payload.services)
  const serviceDay = normalizeServiceDay(payload.serviceDay)
  const planName = payload.planName?.trim()
  const manageUrl = payload.manageUrl || `${siteUrl}/dash/manage`
  const supportEmail = payload.supportEmail || 'support@thetrashpanda.net'
  const supportPhone = payload.supportPhone || process.env.CONTACT_PHONE?.trim()
  const name = payload.firstName?.trim() || payload.lastName?.trim() || 'there'
  const addressLabel = payload.address.label?.trim() ?? 'Service address'
  const addressLines = `${payload.address.street}, ${payload.address.city}, ${payload.address.state} ${payload.address.postalCode}`

  const serviceText = services.length ? buildServicesText(services) : 'We will confirm your service list shortly.'
  const accessNotesText = payload.accessNotes
    ? `Access notes: ${payload.accessNotes}`
    : 'Add access notes anytime from your dashboard.'

  const introLine =
    options.introLine ||
    `Thanks for choosing The Trash Panda!${planName ? ` Your ${planName} plan is set.` : ''}`

  return `Hi ${name},

${introLine}

Services:
${serviceText}
Estimated monthly total: ${formatCurrency(payload.monthlyTotal ?? 0)}

Service day: ${serviceDay || 'We will coordinate with you.'}
${addressLabel}: ${addressLines}
${accessNotesText}

Manage your subscription: ${manageUrl}
Questions? Email ${supportEmail}${supportPhone ? ` or call ${supportPhone}` : ''}.

See you soon,
The Trash Panda team`
}

function buildSubscriptionEmail(
  payload: SubscriptionEmailPayload,
  options: SubscriptionEmailContentOptions,
) {
  return {
    subject: options.subject,
    html: buildSubscriptionEmailHtml(payload, options),
    text: buildSubscriptionEmailText(payload, options),
  }
}

export function buildSubscriptionConfirmationEmail(payload: SubscriptionEmailPayload) {
  return buildSubscriptionEmail(payload, {
    subject: 'Your Trash Panda subscription is confirmed',
    statusLabel: 'Subscription confirmed',
    introLine: `Thanks for choosing The Trash Panda.${
      payload.planName ? ` Your ${payload.planName} plan is set.` : ''
    } Here are the details we have on file.`,
  })
}

export function buildSubscriptionUpdateEmail(payload: SubscriptionEmailPayload) {
  return buildSubscriptionEmail(payload, {
    subject: 'Your Trash Panda subscription was updated',
    statusLabel: 'Subscription updated',
    introLine:
      'We updated your subscription with the latest details below. Please review and reach out if anything needs attention.',
  })
}

export async function sendSubscriptionConfirmationEmail(payload: SubscriptionEmailPayload): Promise<SentMessageInfo> {
  const transporter = await getEmailTransporter()
  const fromAddress = getFromAddress()

  if (!fromAddress) {
    throw new Error('Email routing is not configured. Please set SMTP_FROM (or SMTP_USER).')
  }

  const { subject, html, text } = buildSubscriptionConfirmationEmail(payload)

  return transporter.sendMail({
    from: `The Trash Panda <${fromAddress}>`,
    to: payload.to,
    subject,
    html,
    text,
  })
}

export async function sendSubscriptionUpdateEmail(payload: SubscriptionEmailPayload): Promise<SentMessageInfo> {
  const transporter = await getEmailTransporter()
  const fromAddress = getFromAddress()

  if (!fromAddress) {
    throw new Error('Email routing is not configured. Please set SMTP_FROM (or SMTP_USER).')
  }

  const { subject, html, text } = buildSubscriptionUpdateEmail(payload)

  return transporter.sendMail({
    from: `The Trash Panda <${fromAddress}>`,
    to: payload.to,
    subject,
    html,
    text,
  })
}
