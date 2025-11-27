"use client"

import { FormEvent, useMemo, useState } from 'react'

import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'

interface ApiTestEmailFormProps {
  defaultEmail?: string
  defaultFirstName?: string
  defaultLastName?: string
  previewTokenRequired?: boolean
}

type FormStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

export function ApiTestEmailForm({
  defaultEmail = '',
  defaultFirstName = '',
  defaultLastName = '',
  previewTokenRequired = false,
}: ApiTestEmailFormProps) {
  const [status, setStatus] = useState<FormStatus>({ type: 'idle' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const helpText = useMemo(() => {
    if (previewTokenRequired) {
      return 'In production, include the preview token configured on the server.'
    }

    return 'Uses the subscription confirmation preview endpoint with mock services and address.'
  }, [previewTokenRequired])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const token = String(formData.get('token') ?? '').trim()

    if (!email) {
      setStatus({ type: 'error', message: 'Add a recipient email before sending.' })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'idle' })

    const payload: Record<string, string> = { email }
    if (firstName) payload.firstName = firstName
    if (lastName) payload.lastName = lastName
    if (token) payload.token = token

    try {
      const response = await fetch('/api/subscriptions/email-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string; messageId?: string }

      if (!response.ok) {
        const message = data?.error || 'Request failed. Check logs and try again.'
        setStatus({ type: 'error', message })
        return
      }

      const messageId = data?.messageId
      const successMessage = messageId
        ? `Preview email queued successfully (message ID ${messageId}).`
        : 'Preview email requested successfully.'

      setStatus({ type: 'success', message: successMessage })
    } catch (error) {
      console.error('Failed to send preview request', error)
      setStatus({ type: 'error', message: 'Unexpected error sending preview. See console for details.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          label="Recipient email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />
        <TextField
          label="Preview token"
          name="token"
          placeholder={previewTokenRequired ? 'Required in production' : 'Optional'}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          defaultValue={defaultFirstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          defaultValue={defaultLastName}
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{helpText}</p>
      {status.type === 'error' ? (
        <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      ) : null}
      {status.type === 'success' ? (
        <p className="rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status.message}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          variant="solid"
          color="green"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? 'Sending preview…' : 'Send test email'}</span>
        </Button>
      </div>
    </form>
  )
}
