'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import type { Session } from 'next-auth'
import type { SubscriptionStatus } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/Button'
import { DashboardScaffold } from '@/components/dashboard/DashboardScaffold'

type ServiceId = 'trash' | 'bin-wash' | 'poop-scoop' | 'porch-blow' | 'yard-rake'

export interface DashboardAddress {
  id: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

interface ServiceDefinition {
  id: ServiceId
  name: string
  frequency: string
  monthlyRate: number
  notes?: string
  unitLabel?: string
  minQuantity?: number
  defaultQuantity?: number
  allowQuantity?: boolean
  required?: boolean
}

interface ServiceSelection {
  active: boolean
  quantity: number
}

interface SelectedServiceDetail {
  id: ServiceId
  name: string
  quantity: number
  notes?: string
  monthlyRate: number
  lineTotal: number
  frequency: string
}

interface SubscriptionServiceSnapshot {
  id: ServiceId
  name: string
  frequency: string
  monthlyRate: number
  quantity: number
  notes?: string | null
}

export interface SubscriptionSnapshot {
  id: string
  planId: string | null
  planName: string | null
  addressId: string | null
  addressLabel: string | null
  street: string
  city: string
  state: string
  postalCode: string
  services: SubscriptionServiceSnapshot[]
  monthlyTotal: number | null
  status: SubscriptionStatus
  stripeStatus?: string | null
  stripePaymentStatus?: string | null
  stripeSubscriptionId?: string | null
}

export interface DashboardShellProps {
  user: Session['user']
  initialAddresses: DashboardAddress[]
  mode?: 'create' | 'edit'
  subscriptions?: SubscriptionSnapshot[]
}
const serviceCatalog: ServiceDefinition[] = [
  {
    id: 'trash',
    name: 'Trash Can Take-Out & Return',
    frequency: 'Weekly',
    monthlyRate: 19.99,
    notes: 'Base subscription covering weekly curbside service.',
    required: true,
    allowQuantity: false,
    defaultQuantity: 1,
  },
  {
    id: 'bin-wash',
    name: 'Bin Washing',
    frequency: 'Monthly or bi-monthly',
    monthlyRate: 7,
    unitLabel: 'cans',
    notes: 'Billed per can. We will confirm cadence with you after signup.',
    allowQuantity: true,
    minQuantity: 1,
    defaultQuantity: 2,
  },
  {
    id: 'poop-scoop',
    name: 'Poop Scoop',
    frequency: 'Bi-weekly (2 visits per month)',
    monthlyRate: 15,
    unitLabel: 'visits / month',
    notes: 'Priced per visit; twice monthly service keeps yards guest-ready.',
    allowQuantity: true,
    minQuantity: 1,
    defaultQuantity: 2,
  },
  {
    id: 'porch-blow',
    name: 'Porch / Driveway Blowing',
    frequency: 'As needed',
    monthlyRate: 15,
    unitLabel: 'visits / month',
    notes: 'Ideal before hosting or after storms. Easy add-on to your route.',
    allowQuantity: true,
    minQuantity: 1,
    defaultQuantity: 2,
  },
  {
    id: 'yard-rake',
    name: 'Yard Raking',
    frequency: 'Seasonal (Autumn focus)',
    monthlyRate: Number((25 / 3).toFixed(2)),
    unitLabel: 'visits / season',
    notes: 'Averaged across a three-month fall season ($25 per visit).',
    allowQuantity: true,
    minQuantity: 1,
    defaultQuantity: 1,
  },
]

const planPresets = [
  {
    id: 'basic',
    name: 'Home Care Basic',
    description: 'Weekly trash service plus twice-monthly poop scoop visits.',
    configuration: {
      trash: { active: true, quantity: 1 },
      'poop-scoop': { active: true, quantity: 2 },
    },
  },
  {
    id: 'plus',
    name: 'Home Care Plus',
    description: 'Trash pickup with bin washing (two cans) and porch blowing twice per month.',
    configuration: {
      trash: { active: true, quantity: 1 },
      'bin-wash': { active: true, quantity: 2 },
      'porch-blow': { active: true, quantity: 2 },
    },
  },
] as const

const subscriptionStatusOptions: Array<{
  value: SubscriptionStatus
  label: string
  description: string
}> = [
  {
    value: 'ACTIVE',
    label: 'Active',
    description: 'Services are scheduled and billing will continue normally.',
  },
  {
    value: 'PAUSED',
    label: 'Paused',
    description: 'Temporarily pause service while keeping your configuration saved.',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    description: 'Close this plan. We will stop service after the current cycle.',
  },
]

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

function createAddressId() {
  return `addr-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

const noticeToneStyles: Record<'success' | 'info' | 'error', string> = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
}

type CheckoutNotice = { type: 'success' | 'info' | 'error'; message: string }

type CheckoutPayloadService = {
  id: ServiceId
  name: string
  quantity: number
  monthlyRate: number
  frequency: string
  notes?: string
}

type CheckoutPayloadAddress = {
  id?: string
  label?: string | null
  street: string
  city: string
  state: string
  postalCode: string
}

function resolveSubscriptionAddressId(subscription: SubscriptionSnapshot | null) {
  if (!subscription) {
    return null
  }
  return subscription.addressId ?? `subscription-${subscription.id}`
}

function buildInitialAddresses(initial: DashboardAddress[], subscription: SubscriptionSnapshot | null) {
  const normalized = initial.map((address, index) => ({
    ...address,
    label: address.label?.trim() ?? (index === 0 ? 'Home' : `Location ${index + 1}`),
  }))

  if (subscription) {
    const subscriptionAddressId = resolveSubscriptionAddressId(subscription)
    if (subscriptionAddressId) {
      const exists = normalized.some((address) => address.id === subscriptionAddressId)
      if (!exists) {
        normalized.unshift({
          id: subscriptionAddressId,
          label: subscription.addressLabel?.trim() || 'Service address',
          street: subscription.street,
          city: subscription.city,
          state: subscription.state,
          postalCode: subscription.postalCode,
        })
      }
    }
  }

  return normalized
}

function createServiceConfigurationFromSubscription(subscription: SubscriptionSnapshot | null) {
  return serviceCatalog.reduce((acc, service) => {
    const snapshot = subscription?.services.find((item) => item.id === service.id)
    acc[service.id] = {
      active: Boolean(service.required || snapshot),
      quantity: snapshot?.quantity ?? service.defaultQuantity ?? 1,
    }
    return acc
  }, {} as Record<ServiceId, ServiceSelection>)
}

function normalizeAddressForPayload(address: DashboardAddress | null): CheckoutPayloadAddress | null {
  if (!address) {
    return null
  }
  return {
    id: address.id,
    label: address.label ?? null,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
  }
}
export function DashboardShell({
  user,
  initialAddresses,
  mode = 'create',
  subscriptions = [],
}: DashboardShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isEditMode = mode === 'edit'

  const [managedSubscriptions, setManagedSubscriptions] = useState<SubscriptionSnapshot[]>(subscriptions)
  const defaultSubscription = isEditMode ? managedSubscriptions[0] ?? null : null
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(
    defaultSubscription?.id ?? null,
  )
  const activeSubscription = useMemo(
    () =>
      isEditMode
        ? managedSubscriptions.find((subscription) => subscription.id === activeSubscriptionId) ?? null
        : null,
    [activeSubscriptionId, isEditMode, managedSubscriptions],
  )

  const [addresses, setAddresses] = useState<DashboardAddress[]>(() =>
    buildInitialAddresses(initialAddresses, defaultSubscription),
  )
  const [selectedAddressId, setSelectedAddressId] = useState(
    resolveSubscriptionAddressId(defaultSubscription) ?? initialAddresses[0]?.id ?? '',
  )
  const [addressFormState, setAddressFormState] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  })
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [formStatus, setFormStatus] = useState<'idle' | 'saved'>('idle')
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading'>('idle')
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNotice | null>(null)
  const [activePlanId, setActivePlanId] = useState<string | null>(defaultSubscription?.planId ?? null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(
    defaultSubscription?.status ?? 'ACTIVE',
  )

  const [selectedServices, setSelectedServices] = useState<Record<ServiceId, ServiceSelection>>(() =>
    createServiceConfigurationFromSubscription(defaultSubscription),
  )

  const calculateMonthlyTotal = useCallback((configuration: Record<ServiceId, ServiceSelection>) => {
    const total = serviceCatalog.reduce((runningTotal, service) => {
      const selection = configuration[service.id]
      if (!selection?.active) {
        return runningTotal
      }
      const quantity = service.allowQuantity ? selection.quantity : 1
      return runningTotal + service.monthlyRate * quantity
    }, 0)

    return Math.round(total * 100) / 100
  }, [])

  const monthlyTotal = useMemo(() => calculateMonthlyTotal(selectedServices), [
    calculateMonthlyTotal,
    selectedServices,
  ])

  const selectedServiceList = useMemo<SelectedServiceDetail[]>(() => {
    return serviceCatalog
      .filter((service) => selectedServices[service.id]?.active)
      .map((service) => {
        const selection = selectedServices[service.id]
        const quantity = service.allowQuantity ? selection.quantity : 1
        const lineTotal = Math.round(service.monthlyRate * quantity * 100) / 100
        return {
          id: service.id,
          name: service.name,
          quantity,
          notes: service.notes,
          monthlyRate: service.monthlyRate,
          lineTotal,
          frequency: service.frequency,
        }
      })
  }, [selectedServices])

  const planSummaries = useMemo(() => {
    return planPresets.map((plan: any) => {
      const planTotal = calculateMonthlyTotal(
        serviceCatalog.reduce((acc, service) => {
          const presetConfig = plan.configuration[service.id]
          acc[service.id] = {
            active: presetConfig?.active || Boolean(service.required),
            quantity: presetConfig?.quantity ?? service.defaultQuantity ?? 1,
          }
          return acc
        }, {} as Record<ServiceId, ServiceSelection>),
      )

      return {
        ...plan,
        total: planTotal,
      }
    })
  }, [calculateMonthlyTotal])

  const activeAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  )

  const activePlan = activePlanId
    ? planSummaries.find((plan) => plan.id === activePlanId) ?? null
    : null

  const hasServices = selectedServiceList.length > 0
  const planName = activePlan?.name ?? activeSubscription?.planName ?? null
  const handleSelectPlan = useCallback(
    (plan: (typeof planPresets)[number]) => {
      if (activePlanId === plan.id) {
        setActivePlanId(null)
        setFormStatus('idle')
        return
      }

      setSelectedServices((prev) => {
        const nextConfiguration = { ...prev }
        for (const service of serviceCatalog) {
          nextConfiguration[service.id] = {
            active: Boolean(service.required),
            quantity: service.defaultQuantity ?? 1,
          }
        }
        for (const [serviceId, config] of Object.entries(plan.configuration) as Array<
          [ServiceId, ServiceSelection]
        >) {
          nextConfiguration[serviceId] = {
            active: config.active,
            quantity: config.quantity,
          }
        }
        return nextConfiguration
      })
      setActivePlanId(plan.id)
      setFormStatus('idle')
    },
    [activePlanId],
  )

  const handleToggleService = useCallback((serviceId: ServiceId, active: boolean) => {
    setSelectedServices((prev) => {
      const serviceDefinition = serviceCatalog.find((service) => service.id === serviceId)
      if (serviceDefinition?.required) {
        return prev
      }

      const next = {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          active,
        },
      }
      return next
    })
    setActivePlanId(null)
    setFormStatus('idle')
  }, [])

  const handleQuantityChange = useCallback((serviceId: ServiceId, quantity: number) => {
    setSelectedServices((prev) => {
      const serviceDefinition = serviceCatalog.find((service) => service.id === serviceId)
      if (!serviceDefinition?.allowQuantity) {
        return prev
      }
      const minQuantity = serviceDefinition.minQuantity ?? 1
      const safeQuantity = Number.isFinite(quantity) && quantity >= minQuantity ? quantity : minQuantity
      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          quantity: safeQuantity,
        },
      }
    })
    setActivePlanId(null)
    setFormStatus('idle')
  }, [])

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormStatus('saved')
  }, [])

  const openAddressModal = useCallback(() => {
    setAddressError('')
    setAddressFormState({
      label: addresses.length === 0 ? 'Home' : '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
    })
    setIsAddressModalOpen(true)
  }, [addresses.length])

  const closeAddressModal = useCallback(() => {
    setIsAddressModalOpen(false)
  }, [])

  const handleAddressSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const { label, street, city, state, postalCode } = addressFormState
      const trimmedLabel = label.trim()
      const trimmedStreet = street.trim()
      const trimmedCity = city.trim()
      const trimmedState = state.trim().toUpperCase()
      const trimmedPostalCode = postalCode.trim()

      if (
        !trimmedLabel ||
        !trimmedStreet ||
        !trimmedCity ||
        !trimmedState ||
        !trimmedPostalCode
      ) {
        setAddressError('Please complete every address field before saving.')
        return
      }

      const newAddress: DashboardAddress = {
        id: createAddressId(),
        label: trimmedLabel,
        street: trimmedStreet,
        city: trimmedCity,
        state: trimmedState,
        postalCode: trimmedPostalCode,
      }

      setAddresses((prev) => [...prev, newAddress])
      setSelectedAddressId(newAddress.id)
      setIsAddressModalOpen(false)
      setAddressError('')
    },
    [addressFormState],
  )

  const scrollToServiceForm = useCallback(() => {
    const section = document.getElementById('service-form')
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const greeting = user.firstName ? `Hello ${user.firstName}!` : 'Welcome back!'
  useEffect(() => {
    if (!isEditMode) {
      const outcomeParam = searchParams.get('checkout')

      if (!outcomeParam) {
        return
      }

      const normalizedOutcome =
        outcomeParam === 'success'
          ? 'success'
          : outcomeParam === 'cancelled'
            ? 'cancelled'
            : null

      if (!normalizedOutcome) {
        router.replace('/dash/add', { scroll: false })
        return
      }

      const sessionIdParam = (searchParams.get('session_id') ?? '').trim()

      if (!sessionIdParam) {
        setCheckoutNotice({
          type: normalizedOutcome === 'success' ? 'error' : 'info',
          message:
            normalizedOutcome === 'success'
              ? 'We could not verify your checkout because Stripe did not return a session identifier. Please contact support so we can confirm your subscription.'
              : 'Checkout was cancelled before a session was created. Your selections are still saved so you can try again anytime.',
        })
        setCheckoutError('')
        router.replace('/dash/add', { scroll: false })
        return
      }

      const finalizeCheckout = async () => {
        try {
          setCheckoutStatus('loading')
          setCheckoutError('')
          setCheckoutNotice(null)

          const response = await fetch('/api/checkout/finalize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: sessionIdParam, outcome: normalizedOutcome }),
          })

          const data = await response.json().catch(() => null)

          if (response.ok) {
            const message =
              typeof data?.message === 'string' && data.message.length > 0
                ? data.message
                : normalizedOutcome === 'success'
                  ? 'Thanks! Your subscription is confirmed. We will follow up with scheduling details soon.'
                  : 'Checkout was cancelled. Your selections are still saved so you can try again anytime.'

            setCheckoutNotice({
              type: normalizedOutcome === 'success' ? 'success' : 'info',
              message,
            })
          } else {
            const message =
              typeof data?.error === 'string' && data.error.length > 0
                ? data.error
                : 'We could not finalize your checkout. Please try again or contact support.'

            setCheckoutNotice({
              type: 'error',
              message,
            })
          }
        } catch (error) {
          setCheckoutNotice({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'We could not finalize your checkout. Please try again or contact support.',
          })
        } finally {
          setCheckoutStatus('idle')
        }
      }

      finalizeCheckout().finally(() => {
        router.replace('/dash/add', { scroll: false })
      })
    }
  }, [isEditMode, router, searchParams])

  useEffect(() => {
    if (checkoutError) {
      setCheckoutError('')
    }
  }, [addresses, checkoutError, selectedAddressId, selectedServices])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    if (!activeSubscription) {
      setActivePlanId(null)
      setSelectedServices(createServiceConfigurationFromSubscription(null))
      setSubscriptionStatus('ACTIVE')
      setFormStatus('idle')
      return
    }

    const addressId = resolveSubscriptionAddressId(activeSubscription)
    setAddresses((prev) => {
      const base = buildInitialAddresses(initialAddresses, activeSubscription)
      const custom = prev.filter((address) => !initialAddresses.some((existing) => existing.id === address.id))
      for (const extra of custom as any) {
        if (!base.some((address) => address.id === extra.id)) {
          base.push(extra)
        }
      }
      return base
    })
    if (addressId) {
      setSelectedAddressId(addressId)
    }
    setSelectedServices(createServiceConfigurationFromSubscription(activeSubscription))
    setActivePlanId(activeSubscription.planId ?? null)
    setSubscriptionStatus(activeSubscription.status)
    setFormStatus('idle')
    setCheckoutNotice(null)
  }, [activeSubscription, initialAddresses, isEditMode])
  const handlePrimaryAction = useCallback(async () => {
    if (checkoutStatus === 'loading') {
      return
    }

    if (selectedServiceList.length === 0) {
      setCheckoutError('Please add at least one service before continuing.')
      return
    }

    if (!activeAddress) {
      setCheckoutError('Please add a service address before continuing.')
      return
    }

    const services: CheckoutPayloadService[] = selectedServiceList.map((service) => ({
      id: service.id,
      name: service.name,
      quantity: service.quantity,
      monthlyRate: service.monthlyRate,
      frequency: service.frequency,
      notes: service.notes,
    }))

    const addressPayload = normalizeAddressForPayload(activeAddress)

    if (!addressPayload) {
      setCheckoutError('Please provide a valid address before continuing.')
      return
    }

    try {
      setCheckoutStatus('loading')
      setCheckoutError('')
      setCheckoutNotice(null)

      if (isEditMode && activeSubscription) {
        const response = await fetch(`/api/subscriptions/${activeSubscription.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            services,
            address: addressPayload,
            planId: activePlanId,
            planName,
            total: monthlyTotal,
            status: subscriptionStatus,
          }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          const message =
            typeof data?.error === 'string' && data.error.length > 0
              ? data.error
              : 'Unable to update your subscription. Please try again.'
          setCheckoutError(message)
          setCheckoutStatus('idle')
          return
        }

        const message =
          typeof data?.message === 'string' && data.message.length > 0
            ? data.message
            : 'Subscription updated successfully.'

        setCheckoutNotice({ type: 'success', message })
        setFormStatus('saved')

        if (data?.subscription) {
          const updated: SubscriptionSnapshot = {
            id: data.subscription.id,
            planId: data.subscription.planId ?? null,
            planName: data.subscription.planName ?? null,
            addressId: data.subscription.addressId ?? null,
            addressLabel: data.subscription.addressLabel ?? null,
            street: data.subscription.addressStreet,
            city: data.subscription.addressCity,
            state: data.subscription.addressState,
            postalCode: data.subscription.addressPostalCode,
            services: data.subscription.services ?? [],
            monthlyTotal: data.subscription.monthlyTotal ?? null,
            status: data.subscription.status,
            stripeStatus: data.subscription.stripeStatus ?? null,
            stripePaymentStatus: data.subscription.stripePaymentStatus ?? null,
            stripeSubscriptionId: data.subscription.stripeSubscriptionId ?? null,
          }

          setManagedSubscriptions((prev) => {
            const existingIndex = prev.findIndex((item) => item.id === updated.id)
            if (existingIndex === -1) {
              return [...prev, updated]
            }
            const next = [...prev]
            next[existingIndex] = updated
            return next
          })
        }
      } else {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            services,
            address: addressPayload,
            planId: activePlanId,
            planName,
            total: monthlyTotal,
          }),
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          const message =
            typeof errorPayload?.error === 'string' && errorPayload.error.length > 0
              ? errorPayload.error
              : 'Unable to start checkout. Please try again.'
          setCheckoutError(message)
          setCheckoutStatus('idle')
          return
        }

        const data = (await response.json()) as { url?: string }
        if (data?.url) {
          window.location.href = data.url
          return
        }

        setCheckoutError('Checkout could not start because the session was missing a redirect URL.')
      }
    } catch (error) {
      console.error('Failed to process subscription action', error)
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to process your request. Please try again.',
      )
    } finally {
      setCheckoutStatus('idle')
    }
  }, [
    activeAddress,
    activePlanId,
    activeSubscription,
    checkoutStatus,
    isEditMode,
    monthlyTotal,
    planName,
    selectedServiceList,
    subscriptionStatus,
  ])
  const headerTitle = isEditMode ? 'Manage your subscriptions' : greeting
  const headerDescription = isEditMode
    ? 'Tune your existing plan, update billing preferences, and keep service details accurate.'
    : 'Review your plan, add new services, and keep your property sparkling.'

  const headerActions = (
    <>
      {isEditMode ? (
        <Button href="/dash/add" color="green">
          Add subscription
        </Button>
      ) : (
        <Button type="button" color="green" onClick={scrollToServiceForm}>
          Add new service
        </Button>
      )}
      <Button type="button" variant="outline" onClick={openAddressModal}>
        Manage addresses
      </Button>
    </>
  )

  if (isEditMode && managedSubscriptions.length === 0) {
    return (
      <>
        <DashboardScaffold user={user} title={headerTitle} description={headerDescription} actions={headerActions}>
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No subscriptions yet</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              It looks like you have not completed a subscription checkout. Create a plan to start managing services.
            </p>
            <Button href="/dash/add" color="green" className="mt-6">
              Build your first subscription
            </Button>
          </div>
        </DashboardScaffold>

        <Dialog open={isAddressModalOpen} onClose={setIsAddressModalOpen} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add a new service address</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We will use this address when scheduling recurring services.
              </p>
              <form className="mt-6 space-y-6" onSubmit={handleAddressSubmit}>
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Address nickname
                  </label>
                  <input
                    id="label"
                    name="label"
                    type="text"
                    value={addressFormState.label}
                    onChange={(event) =>
                      setAddressFormState((prev) => ({ ...prev, label: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Street address
                  </label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    value={addressFormState.street}
                    onChange={(event) =>
                      setAddressFormState((prev) => ({ ...prev, street: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-900 dark:text-white">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={addressFormState.city}
                      onChange={(event) =>
                        setAddressFormState((prev) => ({ ...prev, city: event.target.value }))
                      }
                      className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-900 dark:text-white">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={addressFormState.state}
                      onChange={(event) =>
                        setAddressFormState((prev) => ({ ...prev, state: event.target.value }))
                      }
                      className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-900 dark:text-white">
                    ZIP / Postal code
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    value={addressFormState.postalCode}
                    onChange={(event) =>
                      setAddressFormState((prev) => ({ ...prev, postalCode: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
                {addressError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{addressError}</p>
                ) : null}
                <div className="flex items-center justify-end gap-x-4">
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    className="text-sm font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                  <Button type="submit" color="green">
                    Save address
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>
      </>
    )
  }

  const subscriptionOptions = isEditMode
    ? managedSubscriptions.map((subscription) => ({
        id: subscription.id,
        label:
          subscription.planName?.length
            ? `${subscription.planName} – ${subscription.street}`
            : `Subscription • ${subscription.street}`,
      }))
    : []

  const stripeDetails = activeSubscription
    ? {
        stripeStatus: activeSubscription.stripeStatus,
        stripePaymentStatus: activeSubscription.stripePaymentStatus,
        stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
      }
    : null
  return (
    <>
      <DashboardScaffold user={user} title={headerTitle} description={headerDescription} actions={headerActions}>
        {isEditMode && subscriptionOptions.length > 1 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <label htmlFor="subscription-select" className="block text-sm font-medium text-gray-900 dark:text-white">
              Select subscription
            </label>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choose which subscription you would like to update.
            </p>
            <select
              id="subscription-select"
              value={activeSubscriptionId ?? ''}
              onChange={(event) => setActiveSubscriptionId(event.target.value || null)}
              className="mt-3 w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
            >
              {subscriptionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {checkoutNotice ? (
          <div
            role={checkoutNotice.type === 'error' ? 'alert' : 'status'}
            className={classNames(
              'mt-6 rounded-xl border px-4 py-3 text-sm shadow-sm',
              noticeToneStyles[checkoutNotice.type],
            )}
          >
            <p>{checkoutNotice.message}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <form
              id="service-form"
              onSubmit={handleSubmit}
              className="space-y-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900"
            >
              <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Service address</h2>
                <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                  Choose where we should service or add a new location.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="address" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                      Select address
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id="address"
                        name="address"
                        value={selectedAddressId}
                        onChange={(event) => setSelectedAddressId(event.target.value)}
                        disabled={addresses.length === 0}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500 dark:disabled:bg-white/10 dark:disabled:text-gray-500"
                      >
                        {addresses.length === 0 ? (
                          <option value="">Add an address to continue</option>
                        ) : (
                          addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.label} – {address.street}, {address.city}, {address.state}
                            </option>
                          ))
                        )}
                      </select>
                      {addresses.length === 0 ? (
                        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                          Add an address to enable scheduling and checkout.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="col-span-full">
                    <button
                      type="button"
                      onClick={openAddressModal}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      + Add a new address
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Bundle and save!</h2>
                <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                  Start with a curated bundles that allow you to save on a montly basis!
                </p>

                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  {planSummaries.map((plan) => {
                    const isActive = activePlanId === plan.id
                    return (
                      <div
                        key={plan.id}
                        className={classNames(
                          'rounded-xl border bg-white p-6 shadow-sm transition-colors dark:bg-slate-900',
                          isActive
                            ? 'border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-500/40'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:hover:border-indigo-400 dark:hover:shadow-lg',
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                          </div>
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-600 dark:bg-green-500/20 dark:text-green-300">
                            ${plan.total.toFixed(2)}/mo
                          </span>
                        </div>
                        <Button
                          type="button"
                          color="green"
                          aria-pressed={isActive}
                          className={classNames('mt-6 w-full', isActive && 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 active:bg-green-200 active:text-green-900')}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {isActive ? 'Remove preset' : 'Use this preset'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Customize services</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Adjust quantities and toggle add-ons to build a plan that works for your household.
                  </p>

                  <div className="mt-10 space-y-6">
                    {serviceCatalog.map((service) => {
                      const selection = selectedServices[service.id]
                      const isActive = Boolean(selection?.active)
                      const quantity = selection?.quantity ?? service.defaultQuantity ?? 1
                      const minQuantity = service.minQuantity ?? 1

                      return (
                        <div
                          key={service.id}
                          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
                        >
                          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <input
                                  id={`service-${service.id}`}
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(event) => handleToggleService(service.id, event.target.checked)}
                                  disabled={Boolean(service.required)}
                                  className="size-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/10 dark:checked:bg-indigo-500"
                                />
                                <label
                                  htmlFor={`service-${service.id}`}
                                  className="text-base font-semibold text-gray-900 dark:text-white"
                                >
                                  {service.name}
                                </label>
                              </div>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{service.frequency}</p>
                              {service.notes ? (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{service.notes}</p>
                              ) : null}
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                ${service.monthlyRate.toFixed(2)}
                                {service.allowQuantity && service.unitLabel ? ` / ${service.unitLabel}` : '/mo'}
                              </span>
                              {service.allowQuantity ? (
                                <div className="flex items-center gap-2">
                                  <label htmlFor={`quantity-${service.id}`} className="text-sm text-gray-600 dark:text-gray-400">
                                    {service.unitLabel ?? 'Quantity'}
                                  </label>
                                  <input
                                    id={`quantity-${service.id}`}
                                    name={`quantity-${service.id}`}
                                    type="number"
                                    min={minQuantity}
                                    value={quantity}
                                    disabled={!isActive}
                                    onChange={(event) => handleQuantityChange(service.id, Number(event.target.value))}
                                    className="w-20 rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm/6 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                                  />
                                </div>
                              ) : null}
                              {isActive ? (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Estimated: ${(service.monthlyRate * quantity).toFixed(2)}/mo
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">Not selected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {isEditMode ? (
                  <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                    <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Subscription status</h2>
                    <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                      Control whether this plan is actively serviced.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {subscriptionStatusOptions.map((option) => (
                        <label
                          key={option.value}
                          className={classNames(
                            'flex cursor-pointer flex-col gap-2 rounded-xl border p-4',
                            subscriptionStatus === option.value
                              ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10'
                              : 'border-gray-200 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-400',
                          )}
                        >
                          <input
                            type="radio"
                            name="subscription-status"
                            value={option.value}
                            checked={subscriptionStatus === option.value}
                            onChange={() => setSubscriptionStatus(option.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{option.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Monthly total</h2>
                      <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                        This reflects the services selected above. Seasonal services are averaged out monthly.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                        ${monthlyTotal.toFixed(2)}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimated monthly investment</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                    <div className="space-y-2 text-sm">
                      {formStatus === 'saved' ? (
                        <p className="text-green-600 dark:text-green-400">Preferences saved.</p>
                      ) : null}
                      {checkoutError ? (
                        <p className="text-red-600 dark:text-red-400">{checkoutError}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" variant="outline">
                        {isEditMode ? 'Save changes' : 'Save subscription'}
                      </Button>
                      <Button
                        type="button"
                        color="green"
                        disabled={!hasServices || !activeAddress || checkoutStatus === 'loading'}
                        onClick={handlePrimaryAction}
                      >
                        {checkoutStatus === 'loading'
                          ? isEditMode
                            ? 'Updating…'
                            : 'Redirecting…'
                          : isEditMode
                            ? 'Update subscription'
                            : 'Proceed to checkout'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
          <aside className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your cart</h2>
              {activePlan ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Bundle preset: {activePlan.name}
                </p>
              ) : null}
              {planName && !activePlan ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Plan: {planName}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Here is what we will schedule for {activeAddress?.label ?? 'your home'}.
              </p>
              {activeAddress ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeAddress.street}, {activeAddress.city}, {activeAddress.state} {activeAddress.postalCode}
                </p>
              ) : null}
              <ul className="mt-4 space-y-3">
                {selectedServiceList.length > 0 ? (
                  selectedServiceList.map((service) => (
                    <li key={service.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.frequency}</p>
                        {service.quantity > 1 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {service.quantity} × ${service.monthlyRate.toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${service.lineTotal.toFixed(2)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 dark:text-gray-400">No services selected yet.</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 p-6 shadow-sm dark:border-indigo-500/40 dark:bg-indigo-900/40">
              <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">Need a seasonal boost?</h3>
              <p className="mt-2 text-sm text-indigo-900/80 dark:text-indigo-100/80">
                Add a fall yard raking visit to stay ahead of leaf build-up. It averages just $8.33/month when spread across the season.
              </p>
              <Button
                type="button"
                color="green"
                className="mt-4 w-full"
                onClick={() => handleToggleService('yard-rake', true)}
              >
                Add yard raking
              </Button>
            </div>

            {isEditMode && stripeDetails ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Billing status</h3>
                <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700 dark:text-gray-300">Subscription state</dt>
                    <dd className="capitalize text-gray-900 dark:text-white">{subscriptionStatus.toLowerCase()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700 dark:text-gray-300">Stripe status</dt>
                    <dd>{stripeDetails.stripeStatus ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700 dark:text-gray-300">Payment status</dt>
                    <dd>{stripeDetails.stripePaymentStatus ?? '—'}</dd>
                  </div>
                  {stripeDetails.stripeSubscriptionId ? (
                    <div className="flex flex-col">
                      <dt className="font-medium text-gray-700 dark:text-gray-300">Stripe subscription ID</dt>
                      <dd className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {stripeDetails.stripeSubscriptionId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </aside>
        </div>
      </DashboardScaffold>

      <Dialog open={isAddressModalOpen} onClose={setIsAddressModalOpen} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add a new service address</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We will use this address when scheduling recurring services.
            </p>
            <form className="mt-6 space-y-6" onSubmit={handleAddressSubmit}>
              <div>
                <label htmlFor="modal-label" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Address nickname
                </label>
                <input
                  id="modal-label"
                  name="modal-label"
                  type="text"
                  value={addressFormState.label}
                  onChange={(event) => setAddressFormState((prev) => ({ ...prev, label: event.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="modal-street" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Street address
                </label>
                <input
                  id="modal-street"
                  name="modal-street"
                  type="text"
                  value={addressFormState.street}
                  onChange={(event) => setAddressFormState((prev) => ({ ...prev, street: event.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-city" className="block text-sm font-medium text-gray-900 dark:text-white">
                    City
                  </label>
                  <input
                    id="modal-city"
                    name="modal-city"
                    type="text"
                    value={addressFormState.city}
                    onChange={(event) => setAddressFormState((prev) => ({ ...prev, city: event.target.value }))}
                    className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="modal-state" className="block text-sm font-medium text-gray-900 dark:text-white">
                    State
                  </label>
                  <input
                    id="modal-state"
                    name="modal-state"
                    type="text"
                    value={addressFormState.state}
                    onChange={(event) => setAddressFormState((prev) => ({ ...prev, state: event.target.value }))}
                    className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal-postal" className="block text-sm font-medium text-gray-900 dark:text-white">
                  ZIP / Postal code
                </label>
                <input
                  id="modal-postal"
                  name="modal-postal"
                  type="text"
                  value={addressFormState.postalCode}
                  onChange={(event) => setAddressFormState((prev) => ({ ...prev, postalCode: event.target.value }))}
                  className="mt-2 block w-full rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              {addressError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{addressError}</p>
              ) : null}
              <div className="flex items-center justify-end gap-x-4">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="text-sm font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <Button type="submit" color="green">
                  Save address
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
