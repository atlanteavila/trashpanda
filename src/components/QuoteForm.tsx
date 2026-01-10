'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { SelectField, TextField } from '@/components/Fields'
import { US_STATES } from '@/lib/us-states'

type Service = {
  id: string
  name: string
  description?: string | null
  savings?: string | null
  price: number
  unit?: string | null
}

type BundlePreset = {
  name: string
  description: string
  includes: Record<string, number>
}

const BUNDLE_PRESETS: BundlePreset[] = [
  {
    name: 'Home Care Basic',
    description: 'Weekly trash service plus twice-monthly poop scoop visits.',
    includes: {
      'Trash Can Take-Out & Return': 1,
      'Poop Scoop': 2,
    },
  },
  {
    name: 'Home Care Plus',
    description:
      'Trash pickup with bin washing (two cans) and porch blowing twice per month.',
    includes: {
      'Trash Can Take-Out & Return': 1,
      'Bin Washing': 2,
      'Porch / Driveway Blowing': 2,
    },
  },
]

type SavedQuote = {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  notes?: string | null
  services: Array<{
    id: string
    name: string
    price: number
    savings?: string | null
    quantity?: number | null
    unit?: string | null
    description?: string | null
  }>
  estimatedTotal?: number | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

type ResolvedBundlePreset = {
  bundleService: Service
  description: string
  includes: Record<string, number>
}

function formatPrice(price: number, unit?: string | null) {
  const formatted = currencyFormatter.format(price)
  return unit ? `${formatted} / ${unit}` : formatted
}

function resolveBundlePresets(availableServices: Service[]): ResolvedBundlePreset[] {
  const serviceByName = new Map(availableServices.map((service) => [service.name, service]))

  return BUNDLE_PRESETS.flatMap((preset) => {
    const bundleService = serviceByName.get(preset.name)
    if (!bundleService) return []

    const includes = Object.entries(preset.includes).reduce((acc, [serviceName, quantity]) => {
      const match = serviceByName.get(serviceName)
      if (match) {
        acc[match.id] = quantity
      }
      return acc
    }, {} as Record<string, number>)

    return [
      {
        bundleService,
        description: preset.description,
        includes,
      },
    ]
  })
}

export function QuoteForm({ className }: { className?: string }) {
  const [services, setServices] = useState<Service[]>([])
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({})
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)

  const bundlePresets = useMemo(() => resolveBundlePresets(services), [services])
  const bundleServiceIds = useMemo(
    () => new Set(bundlePresets.map((bundle) => bundle.bundleService.id)),
    [bundlePresets],
  )
  const standaloneServices = useMemo(
    () => services.filter((service) => !bundleServiceIds.has(service.id)),
    [services, bundleServiceIds],
  )

  useEffect(() => {
    async function load() {
      try {
        setStatus('loading')

        const [servicesResponse, quoteResponse] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/quotes'),
        ])

        if (!servicesResponse.ok) {
          throw new Error('Unable to load services at this time.')
        }

        const servicesData = await servicesResponse.json()
        setServices(servicesData.services ?? [])

        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json()
          if (quoteData?.quote) {
            applySavedQuote(quoteData.quote as SavedQuote, servicesData.services ?? [])
          }
        }

        setStatus('idle')
      } catch (loadError) {
        console.error(loadError)
        setError('We had trouble loading the pricing. Please try again shortly.')
        setStatus('error')
      }
    }

    load()
  }, [])

  const total = useMemo(() => {
    if (activeBundleId) {
      const activeBundle = bundlePresets.find(
        (bundle) => bundle.bundleService.id === activeBundleId,
      )?.bundleService
      return activeBundle ? activeBundle.price : 0
    }

    return services.reduce((sum, service) => {
      if (bundleServiceIds.has(service.id)) return sum
      const quantity = selectedServices[service.id] ?? 0
      return sum + service.price * quantity
    }, 0)
  }, [activeBundleId, bundlePresets, bundleServiceIds, services, selectedServices])

  function applySavedQuote(
    quote: SavedQuote,
    availableServices: Service[] = services,
  ) {
    setFormValues({
      firstName: quote.firstName || '',
      lastName: quote.lastName || '',
      email: quote.email || '',
      phone: quote.phone || '',
      street: quote.street || '',
      city: quote.city || '',
      state: quote.state || '',
      postalCode: quote.postalCode || '',
      notes: quote.notes || '',
    })

    if (Array.isArray(quote.services)) {
      const presets = resolveBundlePresets(availableServices)
      const bundlesById = new Map(
        presets.map((preset) => [preset.bundleService.id, preset]),
      )

      const persistedSelections: Record<string, number> = {}
      let matchedBundleId: string | null = null

      quote.services.forEach((service) => {
        const quantity = Math.max(1, service.quantity || 1)
        if (bundlesById.has(service.id)) {
          matchedBundleId = service.id
        } else {
          persistedSelections[service.id] = quantity
        }
      })

      if (matchedBundleId) {
        const preset = bundlesById.get(matchedBundleId)
        if (preset) {
          setSelectedServices(
            Object.keys(preset.includes).length > 0
              ? preset.includes
              : persistedSelections,
          )
          setActiveBundleId(matchedBundleId)
          return
        }
      }

      setSelectedServices(persistedSelections)
      setActiveBundleId(null)
    }
  }

  function updateField(field: keyof typeof formValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function toggleService(serviceId: string) {
    setActiveBundleId(null)
    setSelectedServices((current) => {
      const next = { ...current }
      if (next[serviceId]) {
        delete next[serviceId]
      } else {
        next[serviceId] = 1
      }
      return next
    })
  }

  function updateQuantity(serviceId: string, value: number) {
    setActiveBundleId(null)
    setSelectedServices((current) => ({
      ...current,
      [serviceId]: Math.max(1, Number.isFinite(value) ? value : 1),
    }))
  }

  function handleSelectBundle(bundleServiceId: string) {
    if (activeBundleId === bundleServiceId) {
      setActiveBundleId(null)
      return
    }

    const preset = bundlePresets.find(
      (bundle) => bundle.bundleService.id === bundleServiceId,
    )

    if (preset) {
      setSelectedServices(preset.includes)
      setActiveBundleId(bundleServiceId)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!activeBundleId && Object.keys(selectedServices).length === 0) {
      setStatus('error')
      setError('Please choose at least one service to create your quote.')
      return
    }

    setStatus('saving')

    try {
      const payload = {
        ...formValues,
        services: activeBundleId
          ? [{ serviceId: activeBundleId, quantity: 1 }]
          : Object.entries(selectedServices).map(([serviceId, quantity]) => ({
              serviceId,
              quantity,
            })),
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'We could not save your quote right now.')
      }

      if (data?.quote) {
        applySavedQuote(data.quote as SavedQuote)
      }

      setStatus('success')
    } catch (submitError) {
      console.error(submitError)
      setStatus('error')
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      )
    }
  }

  const isSaving = status === 'saving'

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('space-y-8', className)}
    >
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Pick your services</h3>
        <p className="mt-2 text-sm text-slate-600">
          Select the options you need today. You can always adjust quantities or
          change plans when you create your account.
        </p>
        <div className="mt-6 space-y-6">
          {bundlePresets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {bundlePresets.map((bundle) => {
                const isActive = activeBundleId === bundle.bundleService.id
                return (
                  <label
                    key={bundle.bundleService.id}
                    className={clsx(
                      'flex cursor-pointer flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:border-green-500 hover:shadow-md',
                      isActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-white',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {bundle.bundleService.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {bundle.description}
                        </p>
                        {bundle.bundleService.savings ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {bundle.bundleService.savings}
                          </p>
                        ) : null}
                        <p className="mt-3 text-base font-medium text-emerald-700">
                          {formatPrice(
                            bundle.bundleService.price,
                            bundle.bundleService.unit,
                          )}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Includes:{' '}
                          {Object.keys(bundle.includes).length > 0
                            ? Object.keys(bundle.includes)
                                .map((serviceId) =>
                                  services.find((service) => service.id === serviceId)?.name,
                                )
                                .filter(Boolean)
                                .join(', ')
                            : 'curated services'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="mt-1 size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={isActive}
                        onChange={() => handleSelectBundle(bundle.bundleService.id)}
                        aria-label={`Select ${bundle.bundleService.name}`}
                      />
                    </div>
                  </label>
                )
              })}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {standaloneServices.map((service) => {
              const isSelected = Boolean(selectedServices[service.id])
              return (
                <label
                  key={service.id}
                  className={clsx(
                    'flex cursor-pointer flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:border-green-500 hover:shadow-md',
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {service.name}
                      </p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {service.description}
                        </p>
                      ) : null}
                      {service.savings ? (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {service.savings}
                        </p>
                      ) : null}
                      <p className="mt-3 text-base font-medium text-emerald-700">
                        {formatPrice(service.price, service.unit)}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={isSelected}
                      onChange={() => toggleService(service.id)}
                      aria-label={`Select ${service.name}`}
                    />
                  </div>
                  {isSelected ? (
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <span className="text-slate-700">Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={selectedServices[service.id]}
                          onChange={(event) =>
                            updateQuantity(service.id, Number(event.target.value))
                          }
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right focus:border-emerald-500 focus:ring-emerald-500"
                          aria-label={`${service.name} quantity`}
                        />
                      </label>
                      <span className="font-medium text-slate-900">
                        {currencyFormatter.format(
                          service.price * (selectedServices[service.id] ?? 1),
                        )}
                      </span>
                    </div>
                  ) : null}
                </label>
              )
            })}
            {standaloneServices.length === 0 && status !== 'loading' ? (
              <p className="text-sm text-red-600">
                No services are available right now. Please try again later.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Tell us about you</h3>
        <p className="mt-2 text-sm text-slate-600">
          We will save these details to your quote so you can breeze through sign
          up later.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <TextField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            value={formValues.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            value={formValues.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
          <TextField
            className="md:col-span-2"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formValues.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          <TextField
            className="md:col-span-2"
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formValues.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          <TextField
            className="md:col-span-2"
            label="Street address"
            name="street"
            autoComplete="street-address"
            value={formValues.street}
            onChange={(event) => updateField('street', event.target.value)}
          />
          <TextField
            label="City"
            name="city"
            autoComplete="address-level2"
            value={formValues.city}
            onChange={(event) => updateField('city', event.target.value)}
          />
          <SelectField
            label="State"
            name="state"
            value={formValues.state}
            onChange={(event) => updateField('state', event.target.value)}
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
            name="postalCode"
            autoComplete="postal-code"
            value={formValues.postalCode}
            onChange={(event) => updateField('postalCode', event.target.value)}
          />
          <TextField
            className="md:col-span-2"
            label="Notes"
            name="notes"
            placeholder="Tell us about gate codes, special requests, or pickup day preferences."
            value={formValues.notes}
            onChange={(event) => updateField('notes', event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Estimated monthly total</p>
          <p className="text-3xl font-semibold text-slate-900">
            {currencyFormatter.format(total || 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Exact totals may vary based on service area and promotions. We will confirm pricing during sign up.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {status === 'success' ? (
            <p className="text-sm text-emerald-700">
              Quote saved! You can finish creating your account anytime without re-entering details.
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button
              type="submit"
              variant="solid"
              color="green"
              disabled={isSaving || status === 'loading'}
            >
              {isSaving ? 'Saving your quote...' : 'Save my quote'}
            </Button>
            <Button href="/register" variant="outline" color="green">
              Finish sign up
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
