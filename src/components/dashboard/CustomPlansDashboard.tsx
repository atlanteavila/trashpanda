'use client'

import { useState } from 'react'

import { Button } from '@/components/Button'

type DashboardAddress = {
  id: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

type LineItem = {
  id: string
  description: string
  frequency: string
  quantity: number
  monthlyRate: number
  notes?: string | null
  lineTotal: number
}

type CustomEstimate = {
  id: string
  status: string
  paymentStatus: string
  preferredServiceDay?: string | null
  addresses: DashboardAddress[]
  lineItems: LineItem[]
  monthlyAdjustment?: number | null
  subtotal: number
  total: number
  notes?: string | null
  adminNotes?: string | null
  acceptedAt?: string | null
  paidAt?: string | null
  createdAt: string
  user?: {
    email: string
    firstName?: string | null
    lastName?: string | null
    name?: string | null
  }
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

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function formatServiceDay(value?: string | null) {
  if (!value) {
    return ''
  }
  return serviceDayLabels[value] ?? value
}

function formatUserLabel(user?: CustomEstimate['user']) {
  if (!user) {
    return ''
  }
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return (user.name ?? displayName) || user.email
}

export function CustomPlansDashboard({
  estimates,
}: {
  estimates: CustomEstimate[]
}) {
  const [items, setItems] = useState<CustomEstimate[]>(estimates)

  const handleUpdateStatus = async (
    estimateId: string,
    status: 'ACCEPTED' | 'PAUSED' | 'CANCELLED',
  ) => {
    const response = await fetch(`/api/custom-estimates/${estimateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    const data = await response.json().catch(() => null)
    if (response.ok && data?.estimate) {
      setItems((prev) =>
        prev.map((estimate) =>
          estimate.id === estimateId ? data.estimate : estimate,
        ),
      )
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Custom plans
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Review your custom plans, confirm details, or pause/cancel service.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-600 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300">
          You do not have any custom plans yet.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((estimate) => (
            <div
              key={estimate.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Status: {estimate.status.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Payment: {estimate.paymentStatus.replace('_', ' ')}
                  </p>
                  {estimate.preferredServiceDay ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Preferred day: {formatServiceDay(estimate.preferredServiceDay)}
                    </p>
                  ) : null}
                  {estimate.user ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Customer: {formatUserLabel(estimate.user)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatMoney(estimate.total)} / month
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(estimate.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Service addresses
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {estimate.addresses.map((address) => (
                      <li key={address.id}>
                        {address.label ?? 'Service address'} — {address.street},{' '}
                        {address.city}, {address.state} {address.postalCode}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Line items
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {estimate.lineItems.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>
                          {item.description} ({item.frequency})
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatMoney(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {estimate.monthlyAdjustment ? (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Monthly adjustment:{' '}
                      {formatMoney(estimate.monthlyAdjustment)}
                    </p>
                  ) : null}
                </div>
              </div>

              {estimate.notes ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100">
                  {estimate.notes}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                {estimate.status === 'SENT' ? (
                  <Button
                    type="button"
                    color="green"
                    onClick={() => handleUpdateStatus(estimate.id, 'ACCEPTED')}
                  >
                    Agree to this plan
                  </Button>
                ) : null}
                {estimate.status === 'ACTIVE' ? (
                  <Button
                    type="button"
                    onClick={() => handleUpdateStatus(estimate.id, 'PAUSED')}
                  >
                    Pause
                  </Button>
                ) : null}
                {estimate.status !== 'CANCELLED' ? (
                  <Button
                    type="button"
                    onClick={() => handleUpdateStatus(estimate.id, 'CANCELLED')}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
