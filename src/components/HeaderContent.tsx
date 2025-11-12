'use client'

import Link from 'next/link'
import type { Session } from 'next-auth'
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'

function MobileNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <PopoverButton as={Link} href={href} className="block w-full p-2">
      {children}
    </PopoverButton>
  )
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0',
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0',
        )}
      />
    </svg>
  )
}

interface MobileNavigationProps {
  isAuthenticated: boolean
}

function MobileNavigation({ isAuthenticated }: MobileNavigationProps) {
  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="fixed inset-0 bg-slate-300/50 duration-150 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in"
      />
      <PopoverPanel
        transition
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      >
        <MobileNavLink href="/#services">Services</MobileNavLink>
        <MobileNavLink href="/#testimonials">Testimonials</MobileNavLink>
        <MobileNavLink href="/#pricing">Pricing</MobileNavLink>
        <MobileNavLink href="/contact">Contact</MobileNavLink>
        {isAuthenticated ? null : (
          <>
            <hr className="m-2 border-slate-300/40" />
            <MobileNavLink href="/login">Sign in</MobileNavLink>
          </>
        )}
      </PopoverPanel>
    </Popover>
  )
}

interface HeaderContentProps {
  user: Session['user'] | null | undefined
}

export function HeaderContent({ user }: HeaderContentProps) {
  const isAuthenticated = Boolean(user)
  const firstName =
    user?.firstName?.trim() || user?.name?.split(' ')[0] || 'there'

  return (
    <header className="py-4">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="#" aria-label="Home">
              <Logo
                variant="dark"
                width={63}
                height={63}
                className="h-10 w-auto"
                aria-label="The Trash Panda"
              />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink href="/#services">Services</NavLink>
              <NavLink href="/#testimonials">Testimonials</NavLink>
              <NavLink href="/#pricing">Pricing</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm font-semibold text-slate-700 md:inline">
                  Hello {firstName}!
                </span>
                <Button href="/dash" color="green">
                  <span>Manage services</span>
                </Button>
              </>
            ) : (
              <>
                <div className="hidden md:block">
                  <NavLink href="/login">Sign in</NavLink>
                </div>
                <Button href="/register" color="green">
                  <span>
                    Get started <span className="hidden lg:inline">today</span>
                  </span>
                </Button>
              </>
            )}
            <div className="-mr-1 md:hidden">
              <MobileNavigation isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}
