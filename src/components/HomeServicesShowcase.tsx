import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-features.jpg'
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
    <section className="relative overflow-hidden bg-[#005413] pt-20 pb-28 sm:py-32">
      <Image
        className="absolute top-1/2 left-1/2 max-w-none translate-x-[-44%] translate-y-[-42%]"
        src={backgroundImage}
        alt=""
        width={2245}
        height={1636}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Choose the curbside care that fits your life
          </h2>
          <p className="mt-6 text-lg leading-7 text-green-100">
            Keep our original services carousel or switch to this card grid—either way, every offering stays on brand and easy
            to explore.
          </p>
        </div>
        <div className="mt-20 grid gap-12 sm:mt-24 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.name}
              className="relative flex flex-col overflow-hidden rounded-[2.25rem] bg-white/95 px-8 pb-10 pt-28 shadow-2xl shadow-green-900/30 ring-1 ring-white/20"
            >
              <div className="absolute inset-x-10 -top-20">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-8 bottom-3 h-16 rounded-full bg-green-600/45 blur-xl"
                  />
                  <div className="relative mx-auto max-w-[30rem] overflow-visible">
                    <div className="relative mx-auto aspect-[4/3]">
                      <div className="absolute inset-0 -rotate-3">
                        <div className="absolute inset-0 translate-y-6 scale-110">
                          <div className="relative h-full w-full overflow-visible">
                            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-green-900/30 ring-1 ring-green-900/10">
                              <div className="absolute inset-0 [clip-path:polygon(0%_0%,100%_0%,100%_82%,0%_100%)]">
                                <Image
                                  src={service.image}
                                  alt={service.imageAlt}
                                  fill
                                  sizes="(min-width: 1024px) 32rem, (min-width: 768px) 45vw, 90vw"
                                  priority
                                  className="object-cover"
                                />
                              </div>
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/70"
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-x-0 bottom-[-2px] h-10 [clip-path:polygon(0%_0%,100%_20%,100%_100%,0%_100%)] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{service.label}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{service.name}</h3>
              <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
              <div className="mt-6">
                <Link
                  href={service.href}
                  className="text-sm font-semibold text-green-700 transition hover:text-green-500"
                >
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
