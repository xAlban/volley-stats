'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, Upload } from 'lucide-react'

interface SupabaseControlsProps {
  loading: boolean
  error: string | null
  onRefresh: () => void
  syncLoading: boolean
  syncResult: string | null
  onSync: () => void
  hasSyncableData: boolean
}

export default function SupabaseControls({
  loading,
  error,
  onRefresh,
  syncLoading,
  syncResult,
  onSync,
  hasSyncableData,
}: SupabaseControlsProps) {
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
      {hasSyncableData && (
        <Button
          onClick={onSync}
          disabled={syncLoading}
          size="sm"
          variant="secondary"
          className="w-full"
        >
          <Upload
            className={`mr-2 h-4 w-4 ${syncLoading ? 'animate-pulse' : ''}`}
          />
          {syncLoading ? 'Syncing...' : 'Sync from Notion'}
        </Button>
      )}
      {syncResult && (
        <p className="text-xs text-muted-foreground">{syncResult}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
