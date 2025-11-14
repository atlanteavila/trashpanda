import { CallToAction } from '@/components/CallToAction'
import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { PrimaryFeatures } from '@/components/PrimaryFeatures'
import { SecondaryFeatures } from '@/components/SecondaryFeatures'
import { Testimonials } from '@/components/Testimonials'
import { HomeServicesShowcase } from '@/components/HomeServicesShowcase'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-white dark:text-slate-900">
      <Header />
      <main className="bg-white dark:bg-white">
        <Hero />
        <HomeServicesShowcase />
        <CallToAction />
        <Testimonials />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </div>
  )
}
