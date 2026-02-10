'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <TooltipProvider>{children}</TooltipProvider>
    </Provider>
  )
}
