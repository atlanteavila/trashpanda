'use client'

import { useId, useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import familyFun from '@/images/screenshots/family-fun.png'
import poopScoop from '@/images/screenshots/poop-scoop.png'
import cleanBins from '@/images/screenshots/clean-bins.png'

import {
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAmericasIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Feature {
  name: React.ReactNode
  summary: string
  description: string
  image: ImageProps['src']
  icon: React.ComponentType
}

const features: Array<Feature> = [
  {
    name: 'Simple',
    summary: 'Trash Can Take-Out & Return',
    description:
      'Never miss trash day again — we roll your cans to the curb and bring them back once collected. Rain or shine, vacation or busy week, we make sure your cans are right where they should be, right on time.',
    image: familyFun,
    icon: function ReportingIcon() {
      let id = useId()
      return (
        <>
          <TrashIcon className="text-white" />
        </>
      )
    },
  },
  {
    name: 'Cleanliness',
    summary: 'Bin Cleaning & Sanitizing',
    description: `Keep your bins fresh and odor-free with regular cleanings.
We use eco-friendly, high-pressure washing to remove grime, bacteria, and that mystery smell no one wants to talk about.`,
    image: cleanBins,
    icon: function InventoryIcon() {
      return <ArrowsUpDownIcon className='text-white' />
    },
  },
  {
    name: 'Pet awesome',
    summary: ' Yard Poop Scoop Service',
    description: `Enjoy a clean, safe yard for kids and pets.
We’ll remove pet waste, sanitize the area, and keep your outdoor space healthy and spotless — because no one likes unpleasant surprises on the lawn.`,
    image: poopScoop,
    icon: function ContactsIcon() {
      return (
        <>
          <GlobeAmericasIcon className="size-1 text-white" />
        </>
      )
    },
  },
]

function Feature({
  feature,
  isActive,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  feature: Feature
  isActive: boolean
}) {
  return (
    <div
      className={clsx(className, !isActive && 'opacity-75 hover:opacity-100')}
      {...props}
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-lg',
          isActive ? 'bg-green-600' : 'bg-slate-500',
          'h-9 w-9', // container size
        )}
      >
        <svg aria-hidden="true" className="h-6 w-6" fill="none">
          <feature.icon />
        </svg>
      </div>
      <h3
        className={clsx(
          'mt-6 text-sm font-medium',
          isActive ? 'text-green-600' : 'text-slate-600',
        )}
      >
        {feature.name}
      </h3>
      <p className="mt-2 font-display text-xl text-slate-900">
        {feature.summary}
      </p>
      <p className="mt-4 text-sm text-slate-600">{feature.description}</p>
    </div>
  )
}

function FeaturesMobile() {
  return (
    <div className="-mx-4 mt-20 flex flex-col gap-y-10 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:hidden">
      {features.map((feature) => (
        <div key={feature.summary}>
          <Feature feature={feature} className="mx-auto max-w-2xl" isActive />
          <div className="relative mt-10 pb-10">
            <div className="absolute -inset-x-4 top-8 bottom-0 bg-slate-200 sm:-inset-x-6" />
            <div className="relative mx-auto w-211 overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-slate-900/5 ring-slate-500/10">
              <Image
                className="w-full"
                src={feature.image}
                alt=""
                sizes="52.75rem"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeaturesDesktop() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={setSelectedIndex}
      className="hidden lg:mt-20 lg:block"
    >
      <TabList className="grid grid-cols-3 gap-x-8">
        {features.map((feature, featureIndex) => (
          <Feature
            key={feature.summary}
            feature={{
              ...feature,
              name: (
                <Tab className="data-selected:not-data-focus:outline-hidden">
                  <span className="absolute inset-0" />
                  {feature.name}
                </Tab>
              ),
            }}
            isActive={featureIndex === selectedIndex}
            className="relative"
          />
        ))}
      </TabList>
      <TabPanels className="relative mt-20 overflow-hidden rounded-4xl bg-slate-200 px-14 py-16 xl:px-16">
        <div className="relative">
          <div
            className="-mx-5 flex transition duration-500 ease-in-out"
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          >
            {features.map((feature, featureIndex) => (
              <TabPanel
                static
                key={feature.summary}
                className={clsx(
                  'w-full flex-shrink-0 px-5 data-selected:not-data-focus:outline-hidden',
                  featureIndex !== selectedIndex && 'opacity-60',
                )}
                aria-hidden={featureIndex !== selectedIndex}
              >
                <div className="mx-auto w-211 overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-slate-900/5 ring-slate-500/10">
                  <Image
                    className="w-full"
                    src={feature.image}
                    alt=""
                    sizes="52.75rem"
                  />
                </div>
              </TabPanel>
            ))}
          </div>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-slate-600 shadow-lg ring-1 ring-slate-900/10 transition hover:text-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            onClick={() => setSelectedIndex((selectedIndex + features.length - 1) % features.length)}
            aria-label="View previous feature"
          >
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-slate-600 shadow-lg ring-1 ring-slate-900/10 transition hover:text-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            onClick={() => setSelectedIndex((selectedIndex + 1) % features.length)}
            aria-label="View next feature"
          >
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-4xl ring-1 ring-slate-900/10 ring-inset" />
      </TabPanels>
    </TabGroup>
  )
}

export function SecondaryFeatures() {
  return (
    <section
      id="secondary-features"
      aria-label="Features for simplifying everyday business tasks"
      className="pt-20 pb-14 sm:pt-32 sm:pb-20 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Simplify your weekly trash routine.
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Because life&rsquo;s too short to worry about trash day.
          </p>
        </div>
        <FeaturesMobile />
        <FeaturesDesktop />
      </Container>
    </section>
  )
}
