import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import BundledServices from '@/images/screenshots/bundled-services.png'
import CanServices from '@/images/screenshots/can-services.png'
import CleanBins from '@/images/screenshots/clean-bins.png'
import PoopScoop from '@/images/screenshots/poop-scoop-duty.png'

const services = [
  {
    label: 'Trash Can Concierge',
    name: 'Trash Can Take-Out & Return',
    description:
      'Set it and forget it. We roll cans out before pickup and tuck them back once collected—no more sprinting in slippers.',
    href: '/services/denver/trash-can-take-out',
    image: CanServices,
    imageAlt: 'Trash cans lined up for curbside pickup in a residential neighborhood.',
  },
  {
    label: 'Fresh & Sanitized',
    name: 'Bin Cleaning & Deodorizing',
    description:
      'High-pressure, eco-friendly cleaning keeps your cans smelling fresh and eliminates grime, bacteria, and stubborn residue.',
    href: '/services/denver/bin-cleaning',
    image: CleanBins,
    imageAlt: 'Technician washing a trash bin with high-pressure equipment.',
  },
  {
    label: 'Pet Parent Favorite',
    name: 'Poop Scoop Service',
    description:
      'Weekly or twice-weekly scooping keeps your yard spotless. Add deodorizing for outdoor hangs that smell as clean as they look.',
    href: '/services/denver/poop-scoop',
    image: PoopScoop,
    imageAlt: 'Service professional removing pet waste from a backyard lawn.',
  },
  {
    label: 'Bundle & Save',
    name: 'Home Care Plans',
    description:
      'Combine can concierge, bin washes, and yard refresh add-ons to tailor the perfect plan for your home and budget.',
    href: '/services/denver/bundles',
    image: BundledServices,
    imageAlt: 'Illustrated dashboard showcasing bundled service options from The Trash Panda.',
  },
]

export function HomeServicesShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#005413] py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Choose the curbside care that fits your life
          </h2>
          <p className="mt-6 text-lg leading-7 text-green-100">
            Keep our original services carousel or switch to this card grid—either way, every offering stays on brand and easy
            to explore.
          </p>
        </div>
        <div className="mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.name}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-green-900/20"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={service.image}
                  alt={service.imageAlt}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1280px) 18rem, (min-width: 640px) 50vw, 100vw"
                  priority
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{service.label}</p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{service.name}</h3>
                <p className="flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
                <div>
                  <Link
                    href={service.href}
                    className="text-sm font-semibold text-green-700 transition hover:text-green-500"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
