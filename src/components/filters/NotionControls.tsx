'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface NotionControlsProps {
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function NotionControls({
  loading,
  error,
  onRefresh,
}: NotionControlsProps) {
  return (
    <div className="space-y-2">
      <Button
        onClick={onRefresh}
        disabled={loading}
        size="sm"
        variant="outline"
        className="w-full"
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
