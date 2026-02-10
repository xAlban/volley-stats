import type { Metadata } from 'next'
import './globals.css'
import StoreProvider from '@/store/provider'

export const metadata: Metadata = {
  title: 'Volley Stats',
  description: 'Volleyball statistics analyzer',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
