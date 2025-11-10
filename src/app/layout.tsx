import { type Metadata } from 'next'
import '@/styles/tailwind.css'

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
      <body className="flex h-full flex-col bg-white dark:bg-gray-900">{children}</body>
    </html>
  )
}
