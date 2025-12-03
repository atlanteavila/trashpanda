import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'

export const metadata: Metadata = {
  title: 'Dashboard overview',
}

export default async function DashboardLandingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const options = [
    {
      title: 'Manage subscriptions',
      description: 'Update existing plans, adjust services, and review billing.',
      href: '/dash/manage',
      cta: 'Open manager',
    },
    {
      title: 'Add a subscription',
      description: 'Build a brand-new plan and schedule a fresh checkout.',
      href: '/dash/add',
      cta: 'Start building',
    },
  ]

  if (isAdminUser(session.user)) {
    options.unshift({
      title: 'Admin subscription dashboard',
      description: 'Search and edit any customer subscription from a single view.',
      href: '/dash/admin',
      cta: 'Open admin tools',
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">What would you like to do?</h1>
        <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Manage existing plans or build a new subscription to keep your property care on track.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.href}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-white/10 dark:bg-slate-900"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{option.title}</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
            <Link
              href={option.href}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              {option.cta}
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
