import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ClockIcon,
  BeakerIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid'

const serviceName = 'Bin Cleaning & Deodorizing'

const featureHighlights = [
  {
    name: 'High-pressure sanitizing rinse',
    description:
      'Scalding water and 360° spray heads blast away grime, maggots, and residue inside and out without leaving a mess on your driveway.',
    icon: SparklesIcon,
  },
  {
    name: 'Eco-conscious disinfectant formulas',
    description:
      'We finish every wash with biodegradable deodorizer that knocks out odors while keeping pets, kids, and pollinators safe.',
    icon: BeakerIcon,
  },
  {
    name: 'Service synced to collection day',
    description:
      'Cleanings are scheduled right after pickup so bins go back to storage dry, sanitized, and ready for the week ahead.',
    icon: ClockIcon,
  },
]

type BinCleaningPageProps = {
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
    headline: `${formattedCity} bin cleaning that keeps curbside odors away`,
    intro: `We sanitize trash, recycling, and compost bins for ${formattedCity} homes with high-pressure wash downs that neutralize stubborn smells.`,
    description:
      `Our mobile wash unit uses filtered, recycled water and plant-based disinfectant to eliminate bacteria, maggots, and sticky residue in minutes.`,
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: BinCleaningPageProps) {
  const { city } = await params
  const { formattedCity } = getCityCopy(city)
  const title = `${formattedCity} ${serviceName} | The Trash Panda`
  const description = `Professional ${serviceName.toLowerCase()} in ${formattedCity}. Book routine cleanings that disinfect cans, prevent odors, and protect your family from germs.`

  return {
    title,
    description,
    keywords: [
      `${formattedCity} bin cleaning`,
      `${formattedCity} trash can deodorizing`,
      `${formattedCity} curbside sanitizing`,
      'The Trash Panda',
    ],
    alternates: {
      canonical: `/services/${city}/bin-cleaning`,
    },
    openGraph: {
      title,
      description,
      url: `/services/${city}/bin-cleaning`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BinCleaningPage({ params }: BinCleaningPageProps) {
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
            {formattedCity} • Professional bin sanitation
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            {headline}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-800">{intro}</p>
          <p className="mt-4 text-base leading-7 text-gray-800">{description}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-500"
            >
              Schedule a cleaning
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
            Healthier, better-smelling bins for {formattedCity}
          </h2>
          <p className="mt-6 text-base leading-7">
            Standing water and leftover spills attract pests and bacteria. Our self-contained wash system captures dirty runoff,
            filters it onboard, and keeps your driveway spotless while restoring bins to like-new condition.
          </p>
          <p className="mt-4 text-base leading-7">
            Choose quarterly refreshes, monthly cleanings, or bundle service with our trash can concierge. Add compost bin
            sanitation, and we will tailor reminders so every container stays fresh without you lifting a finger.
          </p>
        </div>
        <div className="mx-auto mt-24 max-w-3xl rounded-3xl border border-green-100 bg-green-50 p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Bring a spa day to your bins in {formattedCity}
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-700">
            Share the number of cans you have and how often you would like them cleaned. We will send a tailored proposal and get
            your first service on the calendar fast.
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
