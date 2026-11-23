'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import ActionHistoryItem from '@/components/input/ActionHistoryItem'

export default function ActionHistory() {
  const inputActions = useSelector(
    (state: RootState) => state.volley.inputActions,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 className="text-sm font-semibold">
          History ({inputActions.length})
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1.5 px-3 pb-3">
          {inputActions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Tap the grid to record actions
            </p>
          ) : (
            inputActions.map((action) => (
              <ActionHistoryItem key={action.id} action={action} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
