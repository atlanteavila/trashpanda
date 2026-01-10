'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const isProduction = process.env.NODE_ENV === 'production'

export default function GoogleAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Fire pageview events on client-side navigation without reloading GA.
    if (!isProduction || !GA_MEASUREMENT_ID || typeof window === 'undefined') {
      return
    }

    if (typeof window.gtag !== 'function') {
      return
    }

    window.gtag('config', GA_MEASUREMENT_ID, { page_path: pathname })
  }, [pathname])

  if (!isProduction || !GA_MEASUREMENT_ID) {
    // Avoid loading GA in development or when the ID is not configured.
    return null
  }

  return (
    <>
      {/* Load the GA4 library once globally via Next.js Script for performance. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/* Initialize GA4 and set up the dataLayer in the browser. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });`}
      </Script>
    </>
  )
}
