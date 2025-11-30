import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { ApiTestEmailForm } from '@/components/dashboard/ApiTestEmailForm'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'API test page',
}

const allowedEmails = new Set([
  'atlanteavila@gmail.com',
  'atlante@thetrashpanda.net',
])

export default async function ApiTestPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const email = session.user.email?.trim().toLowerCase()

  if (!email || !allowedEmails.has(email)) {
    redirect('/dash')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-14">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">Admin only</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">API test page</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Send yourself the subscription confirmation email using the preview endpoint without creating a new signup.
        </p>
      </header>
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send a subscription preview email</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The preview uses mock services, address details, and the logo from the branded template.
          </p>
        </div>
        <div className="mt-8">
          <ApiTestEmailForm
            defaultEmail={session.user.email ?? ''}
            defaultFirstName={session.user.firstName ?? ''}
            defaultLastName={session.user.lastName ?? ''}
            previewTokenRequired={process.env.NODE_ENV === 'production'}
          />
        </div>
      </section>
    </main>
  )
}
