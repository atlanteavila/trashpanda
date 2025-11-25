import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CalendarDaysIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/20/solid'

const serviceName = 'Trash Can Take-Out & Return'

const featureHighlights = [
  {
    name: 'Dependable pickup-day coverage',
    description:
      'We track municipal schedules and holidays so your cans hit the curb on time—even when collection days shift.',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Secure can return every time',
    description:
      'After collection we roll bins back to your preferred spot, keeping driveways clear and preventing wind-blown lids.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Route-optimized neighborhood teams',
    description:
      'Local pros handle multiple homes per block for quiet, efficient service that respects your neighbors and HOA rules.',
    icon: TruckIcon,
  },
]

type TrashCanServicePageProps = {
  params: Promise<{
    city: string
  }>
}

const toTitleCase = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

const getCityCopy = (city: string) => {
  const formattedCity = toTitleCase(city)
  return {
    formattedCity,
    headline: `${formattedCity} trash can concierge service made effortless`,
    intro: `Trash day is handled for you. The Trash Panda crew stages and returns cans for busy households across ${formattedCity}.`,
    description:
      `Customized reminders, and photo confirmation, keep your curb tidy while you stay focused on what matters most.`,
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: TrashCanServicePageProps) {
  const { city } = await params
  const { formattedCity } = getCityCopy(city)
  const title = `${formattedCity} ${serviceName} | The Trash Panda`
  const description = `Hands-off ${serviceName.toLowerCase()} in ${formattedCity}. We stage cans before pickup, return them afterward, and monitor schedule changes for you.`

  return {
    title,
    description,
    keywords: [
      `${formattedCity} trash can service`,
      `${formattedCity} curbside concierge`,
      `${formattedCity} trash can take-out`,
      'The Trash Panda',
    ],
    alternates: {
      canonical: `/services/${city}/trash-can-take-out`,
    },
    openGraph: {
      title,
      description,
      url: `/services/${city}/trash-can-take-out`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function TrashCanServicePage({ params }: TrashCanServicePageProps) {
  const { city } = await params
  const { formattedCity, headline, intro, description } = getCityCopy(city)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${formattedCity} ${serviceName}`,
    serviceType: serviceName,
    areaServed: {
      '@type': 'City',
      name: formattedCity,
    },
    provider: {
      '@type': 'LocalBusiness',
      name: 'The Trash Panda',
      url: 'https://thetrashpanda.com',
      areaServed: formattedCity,
    },
    description,
  }

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <p className="text-sm font-semibold tracking-wide text-green-600 uppercase">
            {formattedCity} • Trash day concierge
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            {headline}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-800">{intro}</p>
          <p className="mt-4 text-base leading-7 text-gray-800">{description}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-500"
            >
              Start service
            </Link>
            <Link
              href="tel:+19253308798"
              className="inline-flex items-center justify-center rounded-md border border-green-100 px-5 py-3 text-base font-semibold text-green-600 transition hover:border-green-200 hover:text-green-500"
            >
              Call (925) 330-8798
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {featureHighlights.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base leading-7 font-semibold text-gray-900">
                  <feature.icon aria-hidden="true" className="h-5 w-5 flex-none text-green-600" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-800">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Link
                      href="/contact"
                      className="text-sm leading-6 font-semibold text-green-600 transition hover:text-green-500"
                    >
                      Request a custom plan <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mx-auto mt-24 max-w-4xl text-gray-700">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Why {formattedCity} residents trust The Trash Panda for trash day
          </h2>
          <p className="mt-6 text-base leading-7">
            Morning meetings, travel plans, and mobility challenges make it tough to catch every pickup window. Our insured crew
            handles staging before collection trucks arrive, sends optional text updates, and makes sure lids are closed before
            rolling bins back into place.
          </p>
          <p className="mt-4 text-base leading-7">
            We happily navigate side yards, service elevators, and gated communities. Share gate codes or storage preferences
            during booking and we will follow them to the letter, treating your property with the same care we give our own.
          </p>
        </div>
        <div className="mx-auto mt-24 max-w-3xl rounded-3xl border border-green-100 bg-green-50 p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Ready for effortless trash days in {formattedCity}?
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-700">
            Tell us where your bins live and when collection happens. We will confirm service details and have you set up by the
            next pickup cycle.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-500"
            >
              Get your quote
            </Link>
            <Link
              href="mailto:hello@thetrashpanda.com"
              className="text-base font-semibold text-green-600 transition hover:text-green-500"
            >
              hello@thetrashpanda.com
            </Link>
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
