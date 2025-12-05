import { Metadata } from 'next'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { QuoteForm } from '@/components/QuoteForm'

export const metadata: Metadata = {
  title: 'Get a quote | Trash Panda',
  description:
    'Build a personalized Trash Panda quote without creating an account. Save your picks and breeze through sign up later.',
}

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main className="bg-white">
        <section className="bg-gradient-to-b from-emerald-50 via-white to-white py-16 sm:py-24">
          <Container className="max-w-5xl">
            <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-12">
              <div className="lg:col-span-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  Pricing without the paperwork
                </span>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Create your service quote
                </h1>
                <p className="mt-4 text-lg leading-7 text-slate-700">
                  Explore our services, lock in the options you want, and save them for later. We will keep your details handy so you can finish registration in minutes whenever you are ready.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li>• Pricing pulled directly from our live service catalog.</li>
                  <li>• Save your selections without logging in.</li>
                  <li>• We will prefill your sign-up form when you return.</li>
                </ul>
              </div>
              <div className="mt-10 lg:col-span-3 lg:mt-0">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5 sm:p-8">
                  <QuoteForm />
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  )
}
