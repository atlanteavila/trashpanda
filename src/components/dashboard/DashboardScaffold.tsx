'use client'

import { ReactNode, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  ClipboardDocumentListIcon,
  HomeIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/Button'

interface DashboardNavItem {
  name: string
  description: string
  href: string
  icon: (typeof HomeIcon)
}

const navigation: DashboardNavItem[] = [
  {
    name: 'Manage subscriptions',
    description: 'Review existing plans and adjust services.',
    href: '/dash/manage',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Add subscription',
    description: 'Build a new service plan from scratch.',
    href: '/dash/add',
    icon: SquaresPlusIcon,
  },
]

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

function getInitials(user: Session['user']) {
  const firstInitial = user.firstName?.[0]?.toUpperCase()
  const lastInitial = user.lastName?.[0]?.toUpperCase()
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`
  }
  if (firstInitial) {
    return firstInitial
  }
  if (lastInitial) {
    return lastInitial
  }
  return 'TP'
}

export interface DashboardScaffoldProps {
  user: Session['user']
  title: string
  description?: string
  actions?: ReactNode
  helpText?: ReactNode
  children: ReactNode
}

export function DashboardScaffold({
  user,
  title,
  description,
  actions,
  helpText,
  children,
}: DashboardScaffoldProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const initials = getInitials(user)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </Button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
              <div className="relative flex h-16 shrink-0 items-center text-lg font-semibold text-gray-900 dark:text-white">
                Trash Panda
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={classNames(
                                active
                                  ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  active
                                    ? 'text-indigo-600 dark:text-white'
                                    : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                  'size-6 shrink-0',
                                )}
                              />
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                  <li className="-mx-2 mt-auto">
                    <div className="flex items-center gap-x-4 rounded-md px-3 py-3 text-sm/6 font-semibold text-gray-900 dark:text-white">
                      <div className="flex size-9 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-700 dark:bg-green-500/20 dark:text-green-200">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Subscriber</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-900">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-white/10 dark:bg-black/10">
          <div className="flex h-16 shrink-0 items-center text-lg font-semibold text-gray-900 dark:text-white">
            Trash Panda
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            active
                              ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              active
                                ? 'text-indigo-600 dark:text-white'
                                : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                              'size-6 shrink-0',
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{item.description}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 dark:text-white">
                  <div className="flex size-9 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-700 dark:bg-green-500/20 dark:text-green-200">
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Subscriber</span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:bg-gray-900 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </Button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</div>
        <div className="flex size-9 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-700 dark:bg-green-500/20 dark:text-green-200">
          {initials}
        </div>
      </div>

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
              {description ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p> : null}
              {helpText ? <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{helpText}</div> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
