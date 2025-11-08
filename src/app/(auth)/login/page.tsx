import { type Metadata } from 'next'
import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function Login({
  searchParams,
}: {
  searchParams?: {
    email?: string | string[]
    error?: string | string[]
    registered?: string | string[]
  }
}) {
  const emailParam = searchParams?.email
  const defaultEmail = Array.isArray(emailParam) ? emailParam[0] ?? '' : emailParam ?? ''
  const errorParam = searchParams?.error
  const errorValue = Array.isArray(errorParam) ? errorParam[0] : errorParam
  const error =
    errorValue === 'CredentialsSignin'
      ? 'We could not sign you in with those credentials.'
      : errorValue
  const registeredParam = searchParams?.registered
  const registered = Array.isArray(registeredParam)
    ? registeredParam[0]
    : registeredParam
  const successMessage = registered === '1'
    ? 'Your account was created successfully. Sign in to continue.'
    : undefined

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-gray-900">Welcome back</h2>
      <p className="mt-2 text-sm text-gray-700">
        New here?{' '}
        <Link
          href="/register"
          className="font-medium text-green-600 hover:underline"
        >
          Create an account
        </Link>{' '}
        to get started.
      </p>
      <LoginForm
        defaultEmail={defaultEmail}
        initialError={error}
        successMessage={successMessage}
      />
    </SlimLayout>
  )
}
