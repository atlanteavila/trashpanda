import { type Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import clsx from 'clsx'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: {
    template: '%s - The Trash Panda',
    default: 'The Trash Panda - We\'ve got it covered!',
  },
  description:
    'We collect the trash that you have no time to deal with!',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx(
        'h-full scroll-smooth bg-slate-100 antialiased dark:bg-slate-950',
        inter.variable,
        lexend.variable,
      )}
    >
      <body className="flex h-full flex-col bg-slate-100 dark:bg-slate-950">{children}</body>
    </html>
  )
}
