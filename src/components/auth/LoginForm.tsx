"use client"

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'

interface LoginFormProps {
  defaultEmail?: string
  initialError?: string
  successMessage?: string
}

export function LoginForm({
  defaultEmail = '',
  initialError,
  successMessage,
}: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState(initialError ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
      setError('Please provide both your email address and password.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setIsSubmitting(false)

    if (result?.error) {
      setError('We could not sign you in with those credentials.')
      return
    }

    form.reset()
    router.replace('/')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8"
      noValidate
    >
      {successMessage ? (
        <p className="rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={defaultEmail}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div>
        <Button
          type="submit"
          variant="solid"
          color="green"
          className="w-full"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
        </Button>
      </div>
    </form>
  )
}
