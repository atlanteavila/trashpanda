import type { Metadata } from 'next'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

const LAST_UPDATED = 'September 2, 2024'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-white dark:text-slate-900">
      <Header />
      <main className="bg-white py-16 dark:bg-white sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            <header className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Terms of Service
              </h1>
              <p className="text-sm text-slate-600">Last updated {LAST_UPDATED}</p>
              <p className="text-base text-slate-700">
                These Terms of Service (the “Terms”) govern your access to and use of
                The Trash Panda services. By creating an account, scheduling service,
                or completing checkout, you acknowledge that you have read, understand,
                and agree to be bound by these Terms.
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">1. Services</h2>
              <p className="text-base text-slate-700">
                Routine trash can take-out, bin washing, pet waste removal, porch and
                driveway blowing, and seasonal yard work are performed on the schedule
                communicated during onboarding. The $25 porch and driveway blow service
                covers up to 500 square feet per visit and is priced as an estimate.
                We will confirm the final scope and price with you before work begins
                if the area exceeds the standard coverage or requires additional time.
              </p>
              <p className="text-base text-slate-700">
                Seasonal yard raking, backyard cleanups, and trash can return routes
                are confirmed after an on-site review. Final pricing is confirmed
                after our visit—larger properties or extended can distances may incur
                a small additional fee so we can staff appropriately for the work.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">2. Estimates and Pricing</h2>
              <p className="text-base text-slate-700">
                Pricing shown during checkout reflects the best available estimate
                based on the information you provide. Additional services, oversized
                areas, or conditions identified during the initial walk-through may
                require a revised quote. You will receive and approve any adjusted
                pricing before service begins.
              </p>
              <p className="text-base text-slate-700">
                If we discover larger service areas, excessive debris, or long
                distances between your cans and the curb, we will outline any
                supplemental fee before the job starts. Your approval is required
                before we proceed with the updated price.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">3. Billing and Refunds</h2>
              <p className="text-base text-slate-700">
                Recurring services bill in advance of each service cycle. Because work
                is scheduled and resources are allocated ahead of time, payments are
                non-refundable. If service is delayed or interrupted, we will continue
                providing the remaining scheduled visits to fulfill the commitment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">4. Customer Responsibilities</h2>
              <p className="text-base text-slate-700">
                You agree to provide safe access to the service area, keep pets
                secured, and share accurate property details. Missed visits resulting
                from inaccessible areas or inaccurate information may be charged at the
                regular rate. Please notify us of any hazards or special instructions
                before your appointment.
              </p>
              <p className="text-base text-slate-700">
                Use the instructions section during checkout or inside your account to
                share gate codes, pet care considerations, parking notes, or other
                access details. Clear guidance helps us arrive prepared and keeps your
                appointment on schedule.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">5. Liability</h2>
              <p className="text-base text-slate-700">
                We carry appropriate insurance and take reasonable care while working
                on your property. The Trash Panda is not liable for indirect, incidental,
                or consequential damages arising from service delivery. In no event will
                our total liability exceed the amount you paid for the services in the
                three months preceding the event giving rise to the claim.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">6. Scheduling Changes</h2>
              <p className="text-base text-slate-700">
                We may reschedule visits for weather, safety, or staffing reasons. We
                will communicate any changes promptly and complete the service at the
                next available opportunity. You may request schedule adjustments with
                at least 24 hours&apos; notice to avoid a rescheduling fee.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">7. Termination</h2>
              <p className="text-base text-slate-700">
                Either party may terminate recurring service with notice at the end of
                the current billing cycle. Because payments are non-refundable, any
                cancellation will take effect after the final scheduled visit for the
                paid period is completed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">8. Contact</h2>
              <p className="text-base text-slate-700">
                Questions about these Terms can be sent to our support team at
                <a
                  className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
                  href="mailto:support@thetrashpanda.com"
                >
                  support@thetrashpanda.com
                </a>
                .
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
