'use client'

import { FormEvent, useState } from 'react'
import clsx from 'clsx'

type SubmissionState = 'idle' | 'loading' | 'success' | 'error'

const serviceFrequencyOptions = [
  { value: 'weekly', label: 'Weekly roll-out and return' },
  { value: 'biweekly', label: 'Every other week' },
  { value: 'vacation', label: 'Seasonal or vacation coverage' },
  { value: 'unsure', label: 'Not sure yet' },
]

interface ContactFormProps {
  className?: string
}

export function ContactForm({ className }: ContactFormProps) {
  const [status, setStatus] = useState<SubmissionState>('idle')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (status === 'loading') {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      firstName: formData.get('firstName')?.toString().trim() ?? '',
      lastName: formData.get('lastName')?.toString().trim() ?? '',
      email: formData.get('email')?.toString().trim() ?? '',
      company: formData.get('company')?.toString().trim() ?? '',
      phone: formData.get('phone')?.toString().trim() ?? '',
      message: formData.get('message')?.toString().trim() ?? '',
      serviceFrequency: formData.get('serviceFrequency')?.toString().trim() ?? '',
    }

    setStatus('loading')
    setFeedback('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      let result: { error?: string } | undefined

      try {
        result = (await response.json()) as { error?: string }
      } catch (parseError) {
        console.warn('Could not parse contact response', parseError)
      }

      if (!response.ok) {
        throw new Error(result?.error ?? 'Something went wrong')
      }

      form.reset()
      setStatus('success')
      setFeedback('Thanks! Your message is on its way to our team.')
    } catch (error) {
      console.error('Failed to send contact message', error)
      setStatus('error')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'We were unable to send your message. Please try again later.',
      )
    }
  }

  const isSubmitting = status === 'loading'

  return (
    <form onSubmit={handleSubmit} className={clsx('mt-12 sm:mt-16', className)}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-slate-900">
            First name
          </label>
          <div className="mt-2">
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-slate-900">
            Last name
          </label>
          <div className="mt-2">
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
            Email
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company" className="block text-sm font-semibold text-slate-900">
            Neighborhood or community
          </label>
          <div className="mt-2">
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Optional"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="flex justify-between text-sm font-semibold text-slate-900">
            <label htmlFor="phone">Phone</label>
            <span className="font-normal text-slate-500">Optional</span>
          </div>
          <div className="mt-2">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="flex justify-between text-sm font-semibold text-slate-900">
            <label htmlFor="message">How can we help?</label>
            <span className="font-normal text-slate-500">Max 500 characters</span>
          </div>
          <div className="mt-2">
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={500}
              required
              className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500/80"
            />
          </div>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-900">Service frequency</legend>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            {serviceFrequencyOptions.map((option, index) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-x-3">
                <input
                  type="radio"
                  name="serviceFrequency"
                  value={option.value}
                  defaultChecked={index === 0}
                  className="h-4 w-4 appearance-none rounded-full border border-slate-300 shadow-sm ring-2 ring-transparent transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500/70 checked:border-green-600 checked:bg-green-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-10 flex items-center justify-end gap-x-4 border-t border-slate-200 pt-8">
        <div
          role="status"
          aria-live="polite"
          className={clsx(
            'min-h-[1.5rem] text-sm transition-colors',
            feedback ? (status === 'success' ? 'text-green-700' : 'text-red-600') : 'text-transparent',
          )}
        >
          {feedback}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:bg-green-500/70"
        >
          {isSubmitting ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
