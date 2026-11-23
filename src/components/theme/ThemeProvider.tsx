'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// ---- Light / dark / system theme via the `dark` class on <html> ----
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
