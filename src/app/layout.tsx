import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import StoreProvider from '@/store/provider'
import ThemeProvider from '@/components/theme/ThemeProvider'

export const maxDuration = 60

// ---- Self-hosted at build time: no font request at runtime ----
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Volley Stats',
  description: 'Volleyball statistics analyzer',
}

// ---- viewport-fit=cover so the mobile tab bar can use the safe area ----
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5fa' },
    { media: '(prefers-color-scheme: dark)', color: '#14161d' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // ---- next-themes sets the class before paint: suppress the mismatch ----
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <StoreProvider>{children}</StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
