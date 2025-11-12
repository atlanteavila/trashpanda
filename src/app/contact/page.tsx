import Image from 'next/image'

import { ContactForm } from '@/components/ContactForm'
import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import contactImage from '@/images/background-call-to-action.jpg'

export const metadata = {
  title: 'Contact Us',
  description:
    'Reach out to Trash Panda for curbside bin service, vacation coverage, and more. We are happy to help keep your home tidy.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <section className="relative isolate overflow-hidden bg-slate-50">
          <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-emerald-100 via-slate-50 to-white sm:h-96" />
          <div className="lg:absolute lg:inset-y-0 lg:left-1/2 lg:w-1/2">
            <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-full">
              <Image
                src={contactImage}
                alt="A Trash Panda team member rolling garbage bins to the curb"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-emerald-600/40 to-emerald-400/30 mix-blend-multiply" />
            </div>
          </div>
          <Container className="relative py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Get in touch
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Let’s keep your curb clutter-free
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Whether you need weekly bin roll-out, short-term vacation coverage, or custom add-ons like can washing,
                our crew is ready to lend a hand. Share a few details and we’ll respond within one business day.
              </p>
              <div className="mt-10 rounded-3xl bg-white/95 p-8 shadow-xl shadow-emerald-900/5 ring-1 ring-slate-200 backdrop-blur sm:p-10 lg:mt-12">
                <h2 className="text-2xl font-semibold text-slate-900">Send us a message</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Prefer to talk it through? Give us a call and we’ll get you scheduled for service right away.
                </p>
                <ContactForm className="mt-8" />
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  )
}
