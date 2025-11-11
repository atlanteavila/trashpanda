import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { SelectField, TextField } from '@/components/Fields'
import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import { US_STATES } from '@/lib/us-states'

export const metadata: Metadata = {
  title: 'Sign Up',
}

type RegisterSearchParams = {
  error?: string | string[]
}

export default async function Register({
  searchParams,
}: {
  searchParams?: Promise<RegisterSearchParams>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const errorParam = resolvedSearchParams.error
  const errorMessage = Array.isArray(errorParam) ? errorParam[0] : errorParam

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo variant="dark" className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-gray-900">
        Get started for free
      </h2>
      <p className="mt-2 text-sm text-gray-700">
        Already registered?{' '}
        <Link
          href="/login"
          className="font-medium text-green-600 hover:underline"
        >
          Sign in
        </Link>{' '}
        to your account.
      </p>
      {errorMessage ? (
        <p className="mt-6 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <form
        action="/api/auth/register"
        method="post"
        className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2"
      >
        <TextField
          label="First name"
          name="first_name"
          type="text"
          autoComplete="given-name"
          required
        />
        <TextField
          label="Last name"
          name="last_name"
          type="text"
          autoComplete="family-name"
          required
        />
        <TextField
          className="col-span-full"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          className="col-span-full"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <TextField
          className="col-span-full"
          label="Street address"
          name="street"
          type="text"
          autoComplete="street-address"
          required
        />
        <TextField
          label="City"
          name="city"
          type="text"
          autoComplete="address-level2"
          required
        />
        <SelectField
          label="State"
          name="state"
          autoComplete="address-level1"
          required
        >
          <option value="">Select a state</option>
          {US_STATES.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="ZIP code"
          name="postal_code"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          required
        />
        <SelectField
          className="col-span-full"
          label="How did you hear about us?"
          name="referral_source"
        >
          <option value="">Select an option</option>
          <option>Facebook</option>
          <option>Google</option>
          <option>Bing</option>
          <option>Duck Duck Go</option>
          <option>Yahoo</option>
          <option>Flyer</option>
          <option>Friend</option>
        </SelectField>
        <div className="col-span-full">
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-1 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              I have read and agree to the{' '}
              <Link
                href="/terms-of-service"
                className="font-medium text-green-600 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </span>
          </label>
        </div>
        <div className="col-span-full">
          <Button type="submit" variant="solid" color="green" className="w-full">
            <span>
              Sign up <span aria-hidden="true">&rarr;</span>
            </span>
          </Button>
        </div>
      </form>
    </SlimLayout>
  )
}
