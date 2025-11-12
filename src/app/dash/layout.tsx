import { type Metadata } from 'next'
import { type ReactNode } from 'react'

export const metadata: Metadata = {
  // Apply noindex/nofollow across the dashboard area to reduce crawl waste on private pages.
  robots: { index: false, follow: false },
}

export default function DashLayout({ children }: { children: ReactNode }) {
  return children
}
