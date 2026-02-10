'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/Button'

export type DashboardAddress = {
  id: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

export type AdminUser = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  phone?: string | null
  addresses: DashboardAddress[]
}

type LineItem = {
  id: string
  description: string
  frequency: string
  quantity: number
  monthlyRate: number
  notes?: string
}

export type CustomEstimate = {
  id: string
  userId: string
  createdByEmail?: string | null
  status: string
  paymentStatus: string
  preferredServiceDay?: string | null
  addresses: DashboardAddress[]
  lineItems: Array<LineItem & { lineTotal: number }>
  monthlyAdjustment?: number | null
  subtotal: number
  total: number
  notes?: string | null
  adminNotes?: string | null
  acceptedAt?: string | null
  paidAt?: string | null
  createdAt: string
  user?: Pick<AdminUser, 'id' | 'email' | 'firstName' | 'lastName' | 'name'>
}

const serviceDayOptions = [
  { value: '', label: 'No preference' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
]

function formatUserLabel(user: AdminUser) {
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return displayName || user.name || user.email
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function buildLineItem(): LineItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: '',
    frequency: 'Monthly',
    quantity: 1,
    monthlyRate: 0,
    notes: '',
  }
}

export function AdminCustomPlansDashboard({
  users,
  initialEstimates,
  initialEditingEstimateId,
}: {
  users: AdminUser[]
  initialEstimates: CustomEstimate[]
  initialEditingEstimateId?: string | null
}) {
  const [userList, setUserList] = useState<AdminUser[]>(users)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedAddressIds, setSelectedAddressIds] = useState<string[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([buildLineItem()])
  const [monthlyAdjustment, setMonthlyAdjustment] = useState<number>(0)
  const [preferredServiceDay, setPreferredServiceDay] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null)
  const [hasAppliedInitialEdit, setHasAppliedInitialEdit] = useState(false)
  const [statusNotice, setStatusNotice] = useState<string>('')
  const [estimates, setEstimates] = useState<CustomEstimate[]>(initialEstimates)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  })
  const [isAddressSaving, setIsAddressSaving] = useState(false)

  const selectedUser = useMemo(
    () => userList.find((user) => user.id === selectedUserId) ?? null,
    [userList, selectedUserId],
  )

  const selectedAddresses = useMemo(() => {
    if (!selectedUser) {
      return []
    }
    return selectedUser.addresses.filter((address) =>
      selectedAddressIds.includes(address.id),
    )
  }, [selectedAddressIds, selectedUser])

  const normalizedLineItems = useMemo(
    () =>
      lineItems.map((item) => ({
        ...item,
        lineTotal: Math.round(item.quantity * item.monthlyRate * 100) / 100,
      })),
    [lineItems],
  )

  const subtotal = useMemo(() => {
    const itemsTotal = normalizedLineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    )
    return Math.round((itemsTotal + monthlyAdjustment) * 100) / 100
  }, [monthlyAdjustment, normalizedLineItems])

  const total = subtotal

  const handleAddressToggle = (addressId: string) => {
    setSelectedAddressIds((prev) =>
      prev.includes(addressId)
        ? prev.filter((id) => id !== addressId)
        : [...prev, addressId],
    )
  }

  const handleLineItemChange = (
    id: string,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'quantity' || field === 'monthlyRate'
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    )
  }

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, buildLineItem()])
  }

  const resetForm = () => {
    setSelectedUserId('')
    setSelectedAddressIds([])
    setLineItems([buildLineItem()])
    setMonthlyAdjustment(0)
    setPreferredServiceDay('')
    setNotes('')
    setAdminNotes('')
    setEditingEstimateId(null)
  }

  const handleEditEstimate = useCallback((estimate: CustomEstimate) => {
    setUserList((prev) =>
      prev.map((user) => {
        if (user.id !== estimate.userId) {
          return user
        }

        const existingAddressIds = new Set(user.addresses.map((address) => address.id))
        const missingAddresses = estimate.addresses.filter(
          (address) => !existingAddressIds.has(address.id),
        )

        if (missingAddresses.length === 0) {
          return user
        }

        return {
          ...user,
          addresses: [...user.addresses, ...missingAddresses],
        }
      }),
    )
    setSelectedUserId(estimate.userId)
    setSelectedAddressIds(estimate.addresses.map((address) => address.id))
    setLineItems(
      estimate.lineItems.length > 0
        ? estimate.lineItems.map((item, index) => ({
            id: item.id || `${estimate.id}-item-${index + 1}`,
            description: item.description ?? '',
            frequency: item.frequency ?? 'Monthly',
            quantity: Number.isFinite(item.quantity) ? Number(item.quantity) : 1,
            monthlyRate: Number.isFinite(item.monthlyRate) ? Number(item.monthlyRate) : 0,
            notes: item.notes ?? '',
          }))
        : [buildLineItem()],
    )
    setMonthlyAdjustment(estimate.monthlyAdjustment ?? 0)
    setPreferredServiceDay(estimate.preferredServiceDay ?? '')
    setNotes(estimate.notes ?? '')
    setAdminNotes(estimate.adminNotes ?? '')
    setEditingEstimateId(estimate.id)
    setStatusNotice(`Editing custom plan for ${formatEstimateUserLabel(estimate)}.`)
  }, [])

  useEffect(() => {
    if (!initialEditingEstimateId || hasAppliedInitialEdit) {
      return
    }

    const estimate = estimates.find((item) => item.id === initialEditingEstimateId)
    if (estimate) {
      handleEditEstimate(estimate)
    } else {
      setStatusNotice('Unable to find that custom plan to edit.')
    }

    setHasAppliedInitialEdit(true)
  }, [
    estimates,
    handleEditEstimate,
    hasAppliedInitialEdit,
    initialEditingEstimateId,
  ])

  const resetAddressForm = () => {
    setAddressForm({
      label: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
    })
    setAddressError('')
  }

  const handleOpenAddressModal = () => {
    if (!selectedUserId) {
      setStatusNotice('Select a customer before adding an address.')
      return
    }
    resetAddressForm()
    setIsAddressModalOpen(true)
  }

  const handleSaveAddress = async () => {
    if (!selectedUserId) {
      setAddressError('Select a customer before adding an address.')
      return
    }

    const payload = {
      userId: selectedUserId,
      label: addressForm.label.trim() || null,
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postalCode: addressForm.postalCode.trim(),
    }

    if (!payload.street || !payload.city || !payload.state || !payload.postalCode) {
      setAddressError('Complete every required address field.')
      return
    }

    try {
      setIsAddressSaving(true)
      setAddressError('')
      const response = await fetch('/api/admin/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setAddressError(
          typeof data?.error === 'string' ? data.error : 'Unable to save address.',
        )
        return
      }

      if (data?.address) {
        setUserList((prev) =>
          prev.map((user) =>
            user.id === selectedUserId
              ? {
                  ...user,
                  addresses: [...user.addresses, data.address as DashboardAddress],
                }
              : user,
          ),
        )
      }
      setIsAddressModalOpen(false)
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : 'Unable to save address.',
      )
    } finally {
      setIsAddressSaving(false)
    }
  }

  const handleSubmit = async (nextStatus: 'DRAFT' | 'SENT') => {
    if (!selectedUserId) {
      setStatusNotice('Select a customer before saving.')
      return
    }
    if (selectedAddressIds.length === 0) {
      setStatusNotice('Select at least one service address.')
      return
    }
    if (normalizedLineItems.every((item) => !item.description.trim())) {
      setStatusNotice('Add at least one line item with a description.')
      return
    }

    try {
      setIsSubmitting(true)
      setStatusNotice('')
      const payload = {
        userId: selectedUserId,
        addresses: selectedAddresses,
        lineItems: normalizedLineItems,
        monthlyAdjustment,
        preferredServiceDay,
        notes,
        adminNotes,
        status: nextStatus,
      }

      const isEditing = Boolean(editingEstimateId)
      const response = await fetch(
        isEditing ? `/api/custom-estimates/${editingEstimateId}` : '/api/custom-estimates',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setStatusNotice(
          typeof data?.error === 'string'
            ? data.error
            : isEditing
              ? 'Unable to update the custom plan.'
              : 'Unable to save the custom plan.',
        )
        return
      }

      if (data?.estimate) {
        if (isEditing) {
          setEstimates((prev) =>
            prev.map((estimate) =>
              estimate.id === editingEstimateId
                ? (data.estimate as CustomEstimate)
                : estimate,
            ),
          )
        } else {
          setEstimates((prev) => [data.estimate as CustomEstimate, ...prev])
        }
      }

      setStatusNotice(
        isEditing
          ? nextStatus === 'SENT'
            ? 'Custom plan updated and marked as sent.'
            : 'Custom plan updated.'
          : nextStatus === 'SENT'
            ? 'Estimate saved and marked as sent.'
            : 'Draft estimate saved.',
      )
      resetForm()
    } catch (error) {
      setStatusNotice(
        error instanceof Error
          ? error.message
          : editingEstimateId
            ? 'Unable to update the custom plan.'
            : 'Unable to save the custom plan.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (
    estimateId: string,
    nextStatus: 'SENT' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'DELETE',
  ) => {
    const isDelete = nextStatus === 'DELETE'

    const response = await fetch(`/api/custom-estimates/${estimateId}`, {
      method: isDelete ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // Do NOT send a body for DELETE
      body: isDelete ? undefined : JSON.stringify({ status: nextStatus }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error(data?.error ?? 'Failed to update estimate')
      return
    }

    // PATCH returns updated estimate
    if (!isDelete && data?.estimate) {
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === estimateId ? data.estimate : estimate,
        ),
      )
      if (editingEstimateId === estimateId) {
        handleEditEstimate(data.estimate as CustomEstimate)
      }
    }

    // DELETE removes it from state
    if (isDelete) {
      setEstimates((prev) =>
        prev.filter((estimate) => estimate.id !== estimateId),
      )
      if (editingEstimateId === estimateId) {
        resetForm()
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Custom plan builder
        </h1>
        <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Create monthly custom plans with multiple addresses, line items, and
          admin notes. Send the estimate to customers for acceptance and track
          payment confirmations.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingEstimateId ? 'Edit custom plan' : 'Estimate details'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {editingEstimateId
                ? 'Update customer details, addresses, and recurring work.'
                : 'Choose a customer, select addresses, and itemize recurring work.'}
            </p>
          </div>

          <div className="grid gap-6">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Customer
              <select
                value={selectedUserId}
                onChange={(event) => {
                  setSelectedUserId(event.target.value)
                  setSelectedAddressIds([])
                }}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select a customer</option>
                {userList.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatUserLabel(user)} ({user.email})
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Service addresses
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select all addresses that should be included on this plan.
                  </p>
                </div>
                <Button type="button" onClick={handleOpenAddressModal}>
                  + Add address
                </Button>
              </div>
              <div className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10">
                {selectedUser?.addresses.length ? (
                  selectedUser.addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex items-start gap-3 px-4 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddressIds.includes(address.id)}
                        onChange={() => handleAddressToggle(address.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {address.label ?? 'Service address'} — {address.street},{' '}
                        {address.city}, {address.state} {address.postalCode}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    Select a customer to see their saved addresses.
                  </p>
                )}
              </div>
            </div>

            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Preferred service day
              <select
                value={preferredServiceDay}
                onChange={(event) => setPreferredServiceDay(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {serviceDayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Line items
                </p>
                <Button type="button" onClick={handleAddLineItem}>
                  + Add item
                </Button>
              </div>
              <div className="space-y-4">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-white/10"
                  >
                    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Description
                        <input
                          value={item.description}
                          onChange={(event) =>
                            handleLineItemChange(
                              item.id,
                              'description',
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Frequency
                        <input
                          value={item.frequency}
                          onChange={(event) =>
                            handleLineItemChange(
                              item.id,
                              'frequency',
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                    </div>
                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Quantity
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            handleLineItemChange(
                              item.id,
                              'quantity',
                              Number(event.target.value),
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Monthly rate
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.monthlyRate}
                          onChange={(event) =>
                            handleLineItemChange(
                              item.id,
                              'monthlyRate',
                              Number(event.target.value),
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Line total
                        <input
                          value={formatMoney(item.quantity * item.monthlyRate)}
                          disabled
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-white/10 dark:bg-slate-800 dark:text-gray-300"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Notes
                      <input
                        value={item.notes ?? ''}
                        onChange={(event) =>
                          handleLineItemChange(
                            item.id,
                            'notes',
                            event.target.value,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </label>
                    <div className="mt-3 flex justify-end">
                      {lineItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Monthly adjustment
              <input
                type="number"
                step="0.01"
                value={monthlyAdjustment}
                onChange={(event) =>
                  setMonthlyAdjustment(Number(event.target.value))
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                Add a custom monthly amount (positive or negative).
              </span>
            </label>

            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Customer-facing notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </label>

            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Internal admin notes
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={2}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>

          {statusNotice ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {statusNotice}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('DRAFT')}
            >
              {editingEstimateId ? 'Update draft' : 'Save draft'}
            </Button>
            <Button
              type="button"
              color="green"
              disabled={isSubmitting}
              onClick={() => handleSubmit('SENT')}
            >
              {editingEstimateId ? 'Update & mark sent' : 'Save & mark sent'}
            </Button>
            {editingEstimateId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setStatusNotice('Edit mode cleared.')
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Estimate summary
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preview the totals the customer will see.
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Line item subtotal</span>
                <span>{formatMoney(subtotal - monthlyAdjustment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly adjustment</span>
                <span>{formatMoney(monthlyAdjustment)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent custom plans
            </h3>
            <div className="mt-4 space-y-4">
              {estimates.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No custom plans yet.
                </p>
              ) : (
                estimates.map((estimate) => (
                  <div
                    key={estimate.id}
                    className="rounded-xl border border-gray-200 p-4 text-sm dark:border-white/10"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatEstimateUserLabel(estimate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {estimate.status.replace('_', ' ')} · Payment:{' '}
                      {estimate.paymentStatus.replace('_', ' ')}
                    </p>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                      {formatMoney(estimate.total)} / month
                    </p>
                    {editingEstimateId === estimate.id ? (
                      <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-300">
                        Currently editing
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditEstimate(estimate)}
                        className="rounded-full border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-500/40 dark:text-green-200 dark:hover:bg-green-500/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(estimate.id, 'DELETE')}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red/10 dark:text-red-200 dark:hover:bg-red-800"
                      >
                        DELETE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(estimate.id, 'SENT')}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-slate-800"
                      >
                        Mark sent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(estimate.id, 'PAUSED')}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-slate-800"
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(estimate.id, 'CANCELLED')}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
      {isAddressModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add service address
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Save a new address for this customer to use in the custom plan.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 sm:col-span-2">
                Label
                <input
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 sm:col-span-2">
                Street address
                <input
                  value={addressForm.street}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, street: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                City
                <input
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                State
                <input
                  value={addressForm.state}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 sm:col-span-2">
                Postal code
                <input
                  value={addressForm.postalCode}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
              </label>
            </div>
            {addressError ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                {addressError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                color="green"
                disabled={isAddressSaving}
                onClick={handleSaveAddress}
              >
                {isAddressSaving ? 'Saving…' : 'Save address'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
function formatEstimateUserLabel(estimate: CustomEstimate) {
  if (!estimate.user) {
    return 'Unknown customer'
  }
  const displayName = `${estimate.user.firstName ?? ''} ${estimate.user.lastName ?? ''}`.trim()
  return (estimate.user.name ?? displayName) || estimate.user.email
}
