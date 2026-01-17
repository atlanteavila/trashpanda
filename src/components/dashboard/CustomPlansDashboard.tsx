'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
  isAdmin,
}: {
  estimates: CustomEstimate[]
  isAdmin: boolean
}) {
  const [items, setItems] = useState<CustomEstimate[]>(estimates)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [checkoutNotice, setCheckoutNotice] = useState<string>('')
  const [checkoutError, setCheckoutError] = useState<string>('')
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading'>('idle')
  const router = useRouter()
  const searchParams = useSearchParams()

  const payableItems = useMemo(
    () =>
      items.filter(
        (estimate) =>
          estimate.paymentStatus === 'PENDING' &&
          estimate.status !== 'CANCELLED' &&
          estimate.status !== 'DRAFT',
      ),
    [items],
  )

  useEffect(() => {
    if (isAdmin) {
      return
    }

    const outcome = searchParams.get('checkout')
    if (!outcome) {
      return
    }

    const sessionId = searchParams.get('session_id') ?? ''
    const finalize = async () => {
      try {
        setCheckoutStatus('loading')
        const response = await fetch('/api/custom-estimates/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome,
            sessionId,
          }),
        })
        const data = await response.json().catch(() => null)
        if (response.ok) {
          setCheckoutNotice(
            typeof data?.message === 'string' ? data.message : 'Checkout complete.',
          )
          if (Array.isArray(data?.estimateIds)) {
            const updatedIds = data.estimateIds as string[]
            setItems((prev) =>
              prev.map((estimate) =>
                updatedIds.includes(estimate.id)
                  ? {
                      ...estimate,
                      paymentStatus: 'PAID',
                      status: 'ACTIVE',
                    }
                  : estimate,
              ),
            )
            setSelectedIds((prev) =>
              prev.filter((id) => !updatedIds.includes(id)),
            )
          }
        } else {
          setCheckoutError(
            typeof data?.error === 'string'
              ? data.error
              : 'Unable to finalize checkout.',
          )
        }
      } catch (error) {
        setCheckoutError(
          error instanceof Error ? error.message : 'Unable to finalize checkout.',
        )
      } finally {
        setCheckoutStatus('idle')
        router.replace('/dash/custom-plans', { scroll: false })
      }
    }

    finalize()
  }, [isAdmin, router, searchParams])

  const handleToggleSelection = (estimateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(estimateId)
        ? prev.filter((id) => id !== estimateId)
        : [...prev, estimateId],
    )
  }

  const startCheckout = async (estimateIds: string[]) => {
    if (estimateIds.length === 0) {
      setCheckoutError('Select at least one custom plan to checkout.')
      return
    }

    try {
      setCheckoutStatus('loading')
      setCheckoutError('')
      const response = await fetch('/api/custom-estimates/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateIds }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setCheckoutError(
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to start checkout.',
        )
        return
      }
      if (typeof data?.url === 'string') {
        window.location.href = data.url
      }
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to start checkout.',
      )
    } finally {
      setCheckoutStatus('idle')
    }
  }

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

      {checkoutNotice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          {checkoutNotice}
        </div>
      ) : null}
      {checkoutError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {checkoutError}
        </div>
      ) : null}

      {!isAdmin && payableItems.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Checkout custom plans
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select one or more plans to pay together, or checkout
                individually below.
              </p>
            </div>
            <Button
              type="button"
              color="green"
              disabled={checkoutStatus === 'loading' || selectedIds.length === 0}
              onClick={() => startCheckout(selectedIds)}
            >
              {checkoutStatus === 'loading' ? 'Starting…' : 'Checkout selected'}
            </Button>
          </div>
        </div>
      ) : null}
      {!isAdmin && payableItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300">
          Checkout becomes available once a custom plan is sent to you for
          approval.
        </div>
      ) : null}
      {isAdmin ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300">
          Customer checkout buttons are hidden for admins. Sign in as the
          customer to complete payment.
        </div>
      ) : null}

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
                  {!isAdmin &&
                  estimate.paymentStatus === 'PENDING' &&
                  estimate.status !== 'DRAFT' ? (
                    <Button
                      type="button"
                      color="green"
                      className="mt-3"
                      onClick={() => startCheckout([estimate.id])}
                    >
                      Pay this plan
                    </Button>
                  ) : null}
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
                {!isAdmin &&
                estimate.paymentStatus === 'PENDING' &&
                estimate.status !== 'DRAFT' ? (
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(estimate.id)}
                      onChange={() => handleToggleSelection(estimate.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    Select for checkout
                  </label>
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
