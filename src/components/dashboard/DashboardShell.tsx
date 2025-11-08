"use client"

import { FormEvent, useCallback, useMemo, useState } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react'
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'

import { Button } from '@/components/Button'

const navigation = [
  { name: 'Dashboard', href: '/dash', icon: HomeIcon },
  { name: 'Team', href: '#', icon: UsersIcon },
  { name: 'Projects', href: '#', icon: FolderIcon },
  { name: 'Calendar', href: '#', icon: CalendarIcon },
  { name: 'Documents', href: '#', icon: DocumentDuplicateIcon },
  { name: 'Reports', href: '#', icon: ChartPieIcon },
] as const

interface Address {
  id: string
  label: string
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

type ServiceId =
  | 'trash'
  | 'bin-wash'
  | 'poop-scoop'
  | 'porch-blow'
  | 'yard-rake'

interface ServiceSelection {
  active: boolean
  quantity: number
}

interface BundlePreset {
  id: string
  name: string
  description: string
  configuration: Partial<Record<ServiceId, ServiceSelection>>
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

const planPresets: BundlePreset[] = [
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
]

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

function createAddressId() {
  return `addr-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

interface DashboardShellProps {
  user: Session['user']
}

export function DashboardShell({ user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [formStatus, setFormStatus] = useState<'idle' | 'saved'>('idle')
  const [addresses, setAddresses] = useState<Address[]>(() => [
    {
      id: 'primary',
      label: 'Home',
      street: '123 Peachtree St NE',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30303',
    },
  ])
  const [selectedAddressId, setSelectedAddressId] = useState('primary')
  const [addressFormState, setAddressFormState] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  })

  const [selectedServices, setSelectedServices] = useState<Record<ServiceId, ServiceSelection>>(() => {
    return serviceCatalog.reduce((acc, service) => {
      acc[service.id] = {
        active: Boolean(service.required),
        quantity: service.defaultQuantity ?? 1,
      }
      return acc
    }, {} as Record<ServiceId, ServiceSelection>)
  })

  const calculateMonthlyTotal = useCallback(
    (configuration: Record<ServiceId, ServiceSelection>) => {
      const total = serviceCatalog.reduce((runningTotal, service) => {
        const selection = configuration[service.id]
        if (!selection?.active) {
          return runningTotal
        }
        const quantity = service.allowQuantity ? selection.quantity : 1
        return runningTotal + service.monthlyRate * quantity
      }, 0)

      return Math.round(total * 100) / 100
    },
    [],
  )

  const monthlyTotal = useMemo(() => calculateMonthlyTotal(selectedServices), [
    calculateMonthlyTotal,
    selectedServices,
  ])

  const selectedServiceList = useMemo(() => {
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
        }
      })
  }, [selectedServices])

  const planSummaries = useMemo(() => {
    return planPresets.map((plan) => {
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

  const handleSelectPlan = useCallback((plan: BundlePreset) => {
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
  }, [])

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
      label: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
    })
    setIsAddressModalOpen(true)
  }, [])

  const closeAddressModal = useCallback(() => {
    setIsAddressModalOpen(false)
  }, [])

  const handleAddressSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const { label, street, city, state, postalCode } = addressFormState
      if (!label || !street || !city || !state || !postalCode) {
        setAddressError('Please complete every address field before saving.')
        return
      }

      const newAddress: Address = {
        id: createAddressId(),
        label,
        street,
        city,
        state,
        postalCode,
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

  const userInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'
  const greeting = user.firstName ? `Hello ${user.firstName}!` : 'Welcome back!'

  return (
    <div>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
              <div className="relative flex h-16 shrink-0 items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Trash Panda</span>
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.href}
                            className={classNames(
                              item.href === '/dash'
                                ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                item.href === '/dash'
                                  ? 'text-indigo-600 dark:text-white'
                                  : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                'size-6 shrink-0',
                              )}
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-900">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-white/10 dark:bg-black/10">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Trash Panda</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.href}
                            className={classNames(
                              item.href === '/dash'
                                ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                item.href === '/dash'
                                  ? 'text-indigo-600 dark:text-white'
                                  : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                'size-6 shrink-0',
                              )}
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 dark:text-white">
                  <div className="flex size-8 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Subscriber</span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:bg-gray-900 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900 dark:text-white">Dashboard</div>
        <div className="flex size-8 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-700 dark:bg-green-500/20 dark:text-green-300">
          {userInitial}
        </div>
      </div>

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{greeting}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review your plan, add new services, and keep your property sparkling.
              </p>
            </div>
            <div className="flex gap-x-3">
              <Button
                type="button"
                color="green"
                onClick={scrollToServiceForm}
              >
                Add new service
              </Button>
              <Button type="button" variant="outline" onClick={openAddressModal}>
                Manage addresses
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <form id="service-form" onSubmit={handleSubmit} className="space-y-12">
                <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Service address</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Choose where we should service or add a new location.
                  </p>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label
                        htmlFor="address"
                        className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                      >
                        Select address
                      </label>
                      <div className="mt-2 grid grid-cols-1">
                        <select
                          id="address"
                          name="address"
                          value={selectedAddressId}
                          onChange={(event) => setSelectedAddressId(event.target.value)}
                          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500"
                        >
                          {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.label} – {address.street}, {address.city}
                            </option>
                          ))}
                        </select>
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
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Bundle presets</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Start with a curated bundle, then fine-tune the details to match your home.
                  </p>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    {planSummaries.map((plan) => (
                      <div
                        key={plan.id}
                        className={classNames(
                          'rounded-lg border p-6 transition',
                          activePlanId === plan.id
                            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-500/10'
                            : 'border-gray-200 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-400',
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
                          className="mt-6 w-full"
                          onClick={() => handleSelectPlan(plan)}
                        >
                          Use this plan
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Customize services</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Enable the services you want and tell us how often you need them.
                  </p>

                  <div className="mt-10 space-y-8">
                    {serviceCatalog.map((service) => {
                      const selection = selectedServices[service.id]
                      const isActive = selection?.active
                      const quantity = selection?.quantity ?? service.defaultQuantity ?? 1
                      const minQuantity = service.minQuantity ?? 1
                      const lineTotal = isActive
                        ? Math.round(service.monthlyRate * (service.allowQuantity ? quantity : 1) * 100) / 100
                        : 0

                      return (
                        <div
                          key={service.id}
                          className="rounded-lg border border-gray-200 p-6 dark:border-white/10"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <input
                                  id={`service-${service.id}`}
                                  name={`service-${service.id}`}
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(event) =>
                                    handleToggleService(service.id, event.target.checked)
                                  }
                                  disabled={service.required}
                                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:border-gray-200 disabled:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus:ring-indigo-500"
                                />
                                <label
                                  htmlFor={`service-${service.id}`}
                                  className="text-base font-semibold text-gray-900 dark:text-white"
                                >
                                  {service.name}
                                </label>
                              </div>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {service.frequency}
                              </p>
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
                                  <label
                                    htmlFor={`quantity-${service.id}`}
                                    className="text-sm text-gray-600 dark:text-gray-400"
                                  >
                                    {service.unitLabel ?? 'Quantity'}
                                  </label>
                                  <input
                                    id={`quantity-${service.id}`}
                                    name={`quantity-${service.id}`}
                                    type="number"
                                    min={minQuantity}
                                    value={quantity}
                                    disabled={!isActive}
                                    onChange={(event) =>
                                      handleQuantityChange(service.id, Number(event.target.value))
                                    }
                                    className="w-20 rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm/6 dark:border-white/10 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                                  />
                                </div>
                              ) : null}
                              {isActive ? (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Estimated: ${lineTotal.toFixed(2)}/mo
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

                  <div className="mt-6 flex items-center justify-end gap-x-6">
                    {formStatus === 'saved' ? (
                      <p className="text-sm text-green-600 dark:text-green-400">Preferences saved.</p>
                    ) : null}
                    <Button type="submit" color="green">
                      Save subscription
                    </Button>
                  </div>
                </div>
              </form>
            </section>

            <aside className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Selected services</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Here is what we will schedule for {addresses.find((address) => address.id === selectedAddressId)?.label ?? 'your home'}.
                </p>
                <ul className="mt-4 space-y-3">
                  {selectedServiceList.length > 0 ? (
                    selectedServiceList.map((service) => (
                      <li key={service.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
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

              <div className="rounded-lg border border-indigo-500/40 bg-indigo-50/60 p-6 dark:border-indigo-400/40 dark:bg-indigo-500/10">
                <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-200">Need a seasonal boost?</h3>
                <p className="mt-2 text-sm text-indigo-900/80 dark:text-indigo-200/80">
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
            </aside>
          </div>
        </div>
      </main>

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
    </div>
  )
}
