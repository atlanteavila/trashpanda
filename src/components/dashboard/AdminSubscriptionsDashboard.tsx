'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/Button'
import {
  DashboardShell,
  type DashboardAddress,
  type SubscriptionSnapshot,
} from '@/components/dashboard/DashboardShell'

export type AdminSubscriptionRecord = {
  subscription: SubscriptionSnapshot
  user: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    name?: string | null
    phone?: string | null
    addresses: DashboardAddress[]
  }
}

export type AdminCustomPlanSubscriptionRecord = {
  estimate: {
    id: string
    status: string
    paymentStatus: string
    total: number
    preferredServiceDay?: string | null
    addresses: DashboardAddress[]
    createdAt: string
  }
  user: AdminSubscriptionRecord['user']
}

const serviceDayLabels: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

function buildUserLabel(user: AdminSubscriptionRecord['user']) {
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return displayName || user.name || user.email
}

function buildSubscriptionSummary(record: AdminSubscriptionRecord) {
  const planLabel = record.subscription.planName?.trim()
  const addressLabel = record.subscription.addressLabel?.trim()

  return {
    title: planLabel?.length ? planLabel : 'Custom subscription',
    address: `${addressLabel?.length ? `${addressLabel} – ` : ''}${record.subscription.street}, ${record.subscription.city}, ${record.subscription.state} ${record.subscription.postalCode}`,
  }
}

function matchesQuery(record: AdminSubscriptionRecord, query: string) {
  if (!query) return true

  const haystack = [
    buildUserLabel(record.user),
    record.user.email,
    record.subscription.planName ?? '',
    record.subscription.addressLabel ?? '',
    record.subscription.street,
    record.subscription.city,
    record.subscription.state,
    record.subscription.status,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function matchesCustomPlanQuery(record: AdminCustomPlanSubscriptionRecord, query: string) {
  if (!query) return true

  const primaryAddress = record.estimate.addresses[0]
  const haystack = [
    buildUserLabel(record.user),
    record.user.email,
    record.estimate.status,
    record.estimate.paymentStatus,
    primaryAddress?.street ?? '',
    primaryAddress?.city ?? '',
    primaryAddress?.state ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function formatServiceDay(value?: string | null) {
  if (!value) {
    return 'No preference'
  }

  return serviceDayLabels[value] ?? value
}

export function AdminSubscriptionsDashboard({
  subscriptions,
  customPlanSubscriptions = [],
}: {
  subscriptions: AdminSubscriptionRecord[]
  customPlanSubscriptions?: AdminCustomPlanSubscriptionRecord[]
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()

  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter((record) => matchesQuery(record, normalizedQuery)),
    [subscriptions, normalizedQuery],
  )

  const filteredCustomPlanSubscriptions = useMemo(
    () =>
      customPlanSubscriptions.filter((record) =>
        matchesCustomPlanQuery(record, normalizedQuery),
      ),
    [customPlanSubscriptions, normalizedQuery],
  )

  const selectedRecord = useMemo(
    () =>
      subscriptions.find((record) => record.subscription.id === selectedId) ??
      null,
    [selectedId, subscriptions],
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Subscription control center
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Search, inspect, and edit customer subscriptions. Use the editor
            below to adjust services and addresses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button href="/dash/admin/custom-plans" className="rounded-full">
            Custom plans
          </Button>
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, plan, or address"
              className="w-80 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs tracking-wide text-gray-400 uppercase">
              Search
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Custom plan subscriptions
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              These custom subscriptions appear first for quick access.
            </p>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {filteredCustomPlanSubscriptions.length}
          </span>
        </div>

        {filteredCustomPlanSubscriptions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No custom plan subscriptions match your search.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filteredCustomPlanSubscriptions.map((record) => {
              const address = record.estimate.addresses[0]

              return (
                <article
                  key={record.estimate.id}
                  className="rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {buildUserLabel(record.user)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {record.user.email}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Status: {record.estimate.status.replace('_', ' ')} · Payment:{' '}
                    {record.estimate.paymentStatus.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Service day: {formatServiceDay(record.estimate.preferredServiceDay)}
                  </p>
                  {address ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {address.label ?? 'Service address'} - {address.street}, {address.city},{' '}
                      {address.state} {address.postalCode}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${record.estimate.total.toFixed(2)} / month
                    </span>
                    <Button
                      href={`/dash/admin/custom-plans?estimate=${encodeURIComponent(record.estimate.id)}`}
                      className="rounded-full"
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Regular subscriptions
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Standard subscriptions remain editable below.
          </p>
        </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Results</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredSubscriptions.length} subscriptions
            </span>
          </div>
          <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:divide-white/5 dark:border-white/10 dark:bg-slate-900">
            {filteredSubscriptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No subscriptions match your search.
              </div>
            ) : (
              filteredSubscriptions.map((record) => {
                const userLabel = buildUserLabel(record.user)
                const summary = buildSubscriptionSummary(record)
                const isSelected = selectedId === record.subscription.id

                return (
                  <article
                    key={record.subscription.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      isSelected
                        ? 'border-l-2 border-l-green-500 bg-green-50 dark:border-l-green-400 dark:bg-slate-800'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userLabel}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {record.user.email}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {summary.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {summary.address}
                      </span>
                    </div>
                    <Button
                      onClick={() => setSelectedId(record.subscription.id)}
                      className="rounded-full"
                    >
                      {isSelected ? 'Editing' : 'Edit'}
                    </Button>
                  </article>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedRecord ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Editing
                </p>
                <h2 className="flex text-2xl font-semibold text-gray-900 dark:text-white">
                  <span className='grow'>{buildUserLabel(selectedRecord.user)}</span>
                  {selectedRecord ? (
                    <Button
                      onClick={() => setSelectedId(null)}
                      className="rounded-full"
                    >
                      x close
                    </Button>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Update services, addresses, and preferences. Saving changes
                  will trigger a fresh confirmation email to the customer.
                </p>
              </div>
              <DashboardShell
                key={selectedRecord.subscription.id}
                mode="edit"
                embedded
                user={{
                  id: selectedRecord.user.id,
                  email: selectedRecord.user.email,
                  name: buildUserLabel(selectedRecord.user),
                  firstName: selectedRecord.user.firstName ?? '',
                  lastName: selectedRecord.user.lastName ?? '',
                  phone: selectedRecord.user.phone ?? undefined,
                }}
                initialAddresses={selectedRecord.user.addresses}
                subscriptions={[selectedRecord.subscription]}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-8 py-16 text-center text-gray-600 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300">
              <p className="text-lg font-semibold">
                Select a subscription to start editing
              </p>
              <p className="mt-2 max-w-xl text-sm">
                Use the search and list on the left to find a customer
                subscription. You can update services, add or remove add-ons,
                change addresses, and send the refreshed summary email after
                saving.
              </p>
            </div>
          )}
        </div>
      </div>
      </section>
    </div>
  )
}
