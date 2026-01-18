import { brandColors } from './email'

export type EmailAction = {
  label: string
  url: string
}

export type EmailLayoutOptions = {
  subject: string
  heading: string
  preheader?: string
  contentHtml: string
  action?: EmailAction
  footerNote?: string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheader = options.preheader ? escapeHtml(options.preheader) : ''
  const footerNote =
    options.footerNote ??
    'You are receiving this email because you have a Trash Panda account. If this feels unexpected, reply to this email.'

  const actionBlock = options.action
    ? `
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 24px auto 0 auto;">
          <tr>
            <td align="center" bgcolor="${brandColors.primary}" style="border-radius: 999px;">
              <a href="${options.action.url}" style="display: inline-block; padding: 12px 26px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; color: #ffffff; text-decoration: none; text-transform: uppercase;">
                ${escapeHtml(options.action.label)}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 18px 0 0 0; font-size: 12px; color: #475569; line-height: 18px; text-align: center;">
          Having trouble with the button? Copy and paste this link into your browser:<br />
          <a href="${options.action.url}" style="color: ${brandColors.primary}; text-decoration: none; word-break: break-word;">
            ${options.action.url}
          </a>
        </p>
      `
    : ''

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(options.subject)}</title>
    </head>
    <body style="margin:0; padding:0; background:${brandColors.light}; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:${brandColors.slate};">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        ${preheader}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColors.light}; padding: 24px 0;">
        <tr>
          <td align="center">
            <center>
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" align="center" style="width: 560px; max-width: 560px; margin: 0 auto; background:#ffffff; border-radius: 16px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px 28px; background:${brandColors.dark}; color:#ecfdf3;">
                    <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; color:${brandColors.light};">Trash Panda</div>
                    <div style="margin-top: 6px; font-size: 24px; font-weight: 800;">${escapeHtml(options.heading)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 28px 28px 28px;">
                    ${options.contentHtml}
                    ${actionBlock}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" align="center" style="width: 560px; max-width: 560px; margin: 12px auto 0; color:#64748b; font-size: 12px;">
                <tr>
                  <td align="center" style="padding: 8px 16px;">${escapeHtml(footerNote)}</td>
                </tr>
              </table>
            </center>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}
