'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import type { Session } from 'next-auth'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

import dontForget from '@/app/images/images/dont-forget-trash-day.jpg'
import dogPoopService from '@/app/images/images/dog-poop-service.jpg'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'

const navigation = {
  categories: [
    {
      id: 'services',
      name: 'Services',
      featured: [
        {
          name: 'Trash Can Take-Out & Return',
          href: '/#services',
          imageSrc: dontForget,
          imageAlt: 'Never forget trash day again!',
        },
        {
          name: 'Pet Waste Scooping',
          href: '/#services',
          imageSrc: dogPoopService,
          imageAlt:
            'Technician collecting pet waste from a neatly manicured lawn.',
        },
      ],
      sections: [
        {
          id: 'service-details',
          name: 'Services',
          items: [
            { name: 'Residential Bin Cleaning', href: '/#services' },
            { name: 'Commercial Bin Programs', href: '/#services' },
            { name: 'Pet Waste Removal', href: '/#services' },
            { name: 'One-Time Deep Clean', href: '/#services' },
            { name: 'Recurring Schedules', href: '/#pricing' },
          ],
        },
        {
          id: 'about',
          name: 'About',
          items: [
            { name: 'Customer Testimonials', href: '/#testimonials' },
            { name: 'Pricing & Plans', href: '/#pricing' },
            { name: 'Frequently Asked Questions', href: '/#faq' },
            { name: 'Schedule a Pickup', href: '/contact' },
            { name: 'Service Terms', href: '/terms-of-service' },
          ],
        },
      ],
    },
  ],
  pages: [
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Contact', href: '/contact' },
  ],
}

interface HeaderContentProps {
  user: Session['user'] | null | undefined
}

export function HeaderContent({ user }: HeaderContentProps) {
  const [open, setOpen] = useState(false)
  const isAuthenticated = Boolean(user)
  const firstName =
    user?.firstName?.trim() || user?.name?.split(' ')[0] || 'there'

  return (
    <header className="bg-white py-4">
      <Dialog open={open} onClose={setOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 z-50 flex">
          <DialogPanel
            transition
            className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <div className="flex px-4 pt-5 pb-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:text-slate-700"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>

            <TabGroup className="mt-2">
              <div className="border-b border-slate-200">
                <TabList className="-mb-px flex space-x-8 px-4">
                  {navigation.categories.map((category) => (
                    <Tab
                      key={category.name}
                      className="flex-1 border-b-2 border-transparent px-1 py-4 text-base font-medium whitespace-nowrap text-slate-900 data-selected:border-emerald-600 data-selected:text-emerald-600"
                    >
                      {category.name}
                    </Tab>
                  ))}
                </TabList>
              </div>
              <TabPanels as={Fragment}>
                {navigation.categories.map((category) => (
                  <TabPanel
                    key={category.name}
                    className="space-y-10 px-4 pt-10 pb-8"
                  >
                    <div className="grid grid-cols-2 gap-x-4">
                      {category.featured.map((item) => (
                        <div key={item.name} className="group relative text-sm">
                          <Image
                            alt={item.imageAlt}
                            src={item.imageSrc}
                            width={600}
                            height={600}
                            unoptimized
                            className="aspect-square w-full rounded-lg bg-slate-100 object-cover group-hover:opacity-80"
                          />
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="mt-6 block font-medium text-slate-900"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 z-10"
                            />
                            {item.name}
                          </Link>
                          <p aria-hidden="true" className="mt-1 text-slate-600">
                            Explore service
                          </p>
                        </div>
                      ))}
                    </div>
                    {category.sections.map((section) => (
                      <div key={section.name}>
                        <p
                          id={`${category.id}-${section.id}-heading-mobile`}
                          className="font-medium text-slate-900"
                        >
                          {section.name}
                        </p>
                        <ul
                          role="list"
                          aria-labelledby={`${category.id}-${section.id}-heading-mobile`}
                          className="mt-6 flex flex-col space-y-6"
                        >
                          {section.items.map((item) => (
                            <li key={item.name} className="flow-root">
                              <Link
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="-m-2 block p-2 text-slate-600 hover:text-slate-900"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>

            <div className="space-y-6 border-t border-slate-200 px-4 py-6">
              {navigation.pages.map((page) => (
                <div key={page.name} className="flow-root">
                  <Link
                    href={page.href}
                    onClick={() => setOpen(false)}
                    className="-m-2 block p-2 font-medium text-slate-900"
                  >
                    {page.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="space-y-6 border-t border-slate-200 px-4 py-6">
              {isAuthenticated ? (
                <div className="flow-root">
                  <Link
                    href="/dash"
                    onClick={() => setOpen(false)}
                    className="-m-2 block p-2 font-medium text-slate-900"
                  >
                    Manage services
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flow-root">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="-m-2 block p-2 font-medium text-slate-900"
                    >
                      Sign in
                    </Link>
                  </div>
                  <div className="flow-root">
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="-m-2 block p-2 font-medium text-slate-900"
                    >
                      Create account
                    </Link>
                  </div>
                </>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Container>
        <nav aria-label="Top" className="relative flex h-16 items-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative rounded-md bg-white p-2 text-slate-500 hover:text-slate-700 lg:hidden"
          >
            <span className="absolute -inset-0.5" />
            <span className="sr-only">Open menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>

          <div className="ml-4 flex lg:ml-0">
            <Link href="/" aria-label="Home">
              <Logo
                variant="dark"
                width={63}
                height={63}
                className="h-10 w-auto"
                aria-label="The Trash Panda"
              />
            </Link>
          </div>

          <PopoverGroup className="hidden lg:ml-8 lg:block lg:self-stretch">
            <div className="flex h-full space-x-8">
              {navigation.categories.map((category) => (
                <Popover key={category.name} className="flex">
                  <div className="relative flex">
                    <PopoverButton className="group relative flex items-center justify-center text-sm font-medium text-slate-700 transition-colors duration-200 ease-out hover:text-slate-900 data-open:text-emerald-600">
                      {category.name}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px z-30 h-0.5 transition duration-200 ease-out group-data-open:bg-emerald-600"
                      />
                    </PopoverButton>
                  </div>

                  <PopoverPanel
                    transition
                    className="absolute inset-x-0 top-full z-20 w-full bg-white text-sm text-slate-600 shadow-lg transition data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 top-1/2 bg-white shadow"
                    />
                    <div className="relative">
                      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                          <div className="col-start-2 grid grid-cols-1 gap-8 sm:grid-cols-2">
                            {category.featured.map((item) => (
                              <div
                                key={item.name}
                                className="group relative text-base"
                              >
                                <Image
                                  alt={item.imageAlt}
                                  src={item.imageSrc}
                                  width={600}
                                  height={600}
                                  unoptimized
                                  className="aspect-square w-full rounded-lg bg-slate-100 object-cover transition group-hover:opacity-80"
                                />
                                <Link
                                  href={item.href}
                                  className="mt-6 block font-medium text-slate-900"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-0 z-10"
                                  />
                                  {item.name}
                                </Link>
                                <p aria-hidden="true" className="mt-1">
                                  Explore service
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="row-start-1 grid grid-cols-2 gap-x-8 gap-y-10 text-sm">
                            {category.sections.map((section) => (
                              <div key={section.name}>
                                <p
                                  id={`${section.id}-heading`}
                                  className="font-medium text-slate-900"
                                >
                                  {section.name}
                                </p>
                                <ul
                                  role="list"
                                  aria-labelledby={`${section.id}-heading`}
                                  className="mt-6 space-y-4"
                                >
                                  {section.items.map((item) => (
                                    <li key={item.name} className="flex">
                                      <Link
                                        href={item.href}
                                        className="hover:text-slate-900"
                                      >
                                        {item.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverPanel>
                </Popover>
              ))}
              {navigation.pages.map((page) => (
                <Link
                  key={page.name}
                  href={page.href}
                  className="flex items-center text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </PopoverGroup>

          <div className="ml-auto flex items-center gap-x-4">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm font-semibold text-slate-700 lg:inline">
                  Hello {firstName}!
                </span>
                <Button href="/dash" color="green">
                  <span>Manage services</span>
                </Button>
              </>
            ) : (
              <>
                <div className="hidden lg:block">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Sign in
                  </Link>
                </div>
                <Button href="/register" color="green">
                  <span>
                    Get started <span className="hidden lg:inline">today</span>
                  </span>
                </Button>
              </>
            )}
          </div>
        </nav>
      </Container>
    </header>
  )
}
