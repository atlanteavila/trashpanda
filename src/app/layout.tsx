import { type Metadata } from 'next'
import '@/styles/tailwind.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: {
    template: '%s - The Trash Panda',
    default: 'The Trash Panda - We\'ve got it covered!',
  },
  description:
    'We collect the trash that you have no time to deal with!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth bg-white antialiased dark:bg-gray-900"
    >
      <head>
        <meta
          name="msvalidate.01"
          content="1374FA3081CE62881036F1D26F825697"
        />
      </head>
      <body className="flex h-full flex-col bg-white dark:bg-gray-900">
        {/* Keep analytics mounted once in the root layout for every page. */}
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
