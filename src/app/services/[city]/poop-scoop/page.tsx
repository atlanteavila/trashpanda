import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
} from '@heroicons/react/20/solid'

const serviceName = 'Poop Scoop Service'

const featureHighlights = [
  {
    name: 'Reliable weekly or twice-weekly visits',
    description:
      'Stay ahead of pet waste with a predictable scooping schedule that keeps your yard guest-ready all week long.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Sanitized tools & eco-friendly disposal',
    description:
      'Our technicians disinfect equipment between appointments and dispose of waste responsibly to protect your family and pets.',
    icon: LockClosedIcon,
  },
  {
    name: 'Yard health checks every visit',
    description:
      'We keep an eye out for problem spots such as pests or damage so you can fix small issues before they become expensive repairs.',
    icon: ArrowPathIcon,
  },
]

type PoopScoopPageProps = {
  params: {
    city: string
  }
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
    headline: `${formattedCity} dog poop scooping you can set and forget`,
    intro: `Leave the dirty work to The Trash Panda. Our local team keeps ${formattedCity} yards spotless with dependable pet waste removal built for busy households.`,
    description: `Every visit includes a full sweep of your lawn, deodorizing treatments on request, and eco-friendly waste disposal so your outdoor space stays safe for kids and pets.`,
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: PoopScoopPageProps) {
  const { city } = await params
  const { formattedCity } = getCityCopy(city)
  const title = `${formattedCity} ${serviceName} | The Trash Panda`
  const description = `Professional ${serviceName.toLowerCase()} in ${formattedCity}. Book flexible schedules, add-on deodorizing, and enjoy a pristine yard without lifting a finger.`

  return {
    title,
    description,
    keywords: [
      `${formattedCity} poop scooping`,
      `${formattedCity} dog waste removal`,
      `${formattedCity} pet waste cleanup`,
      'The Trash Panda',
    ],
    alternates: {
      canonical: `/services/${city}/poop-scoop`,
    },
    openGraph: {
      title,
      description,
      url: `/services/${city}/poop-scoop`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PoopScoopPage({ params }: PoopScoopPageProps) {
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
            {formattedCity} • Pet waste removal experts
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            {headline}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">{intro}</p>
          <p className="mt-4 text-base leading-7 text-gray-600">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-500"
            >
              Book a cleaning
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
                  <feature.icon
                    aria-hidden="true"
                    className="h-5 w-5 flex-none text-green-600"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
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
            Why {formattedCity} pet owners trust The Trash Panda
          </h2>
          <p className="mt-6 text-base leading-7">
            From apartment pet relief areas to sprawling backyards, we tailor
            our scooping routes to every property size. Optional deodorizing and
            lawn refresh add-ons keep your outdoor hangouts smelling as clean as
            they look, and transparent pricing means no surprises on your
            invoice.
          </p>
          <p className="mt-4 text-base leading-7">
            Need a one-time cleanup before a party or listing photos? We can do
            that too. Add your preferred schedule and any special access notes
            during booking, and our uniformed pros will handle the rest while
            you get back to enjoying life outside.
          </p>
        </div>
        <div className="mx-auto mt-24 max-w-3xl rounded-3xl border border-green-100 bg-green-50 p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Ready for a fresher yard in {formattedCity}?
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-700">
            Tell us about your pets, lawn size, and preferred visit frequency.
            We’ll send over a personalized quote within one business day.
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
