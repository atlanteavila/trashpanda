import type { Metadata } from 'next'

import { Container } from '@/components/Container'

const LAST_UPDATED = 'August 30, 2024'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsOfServicePage() {
  return (
    <Container className="py-24 sm:py-32">
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
  )
}
