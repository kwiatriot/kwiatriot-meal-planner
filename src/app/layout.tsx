import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kwiatriot Meal Planner',
  description: 'Weekly meal planning for two',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  )
}