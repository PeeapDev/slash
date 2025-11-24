"use client"

import { useEffect } from 'react'

export default function SyncInitializer() {
  useEffect(() => {
    // Initialize sync engine on app start
    const initSync = async () => {
      try {
        const { syncEngine } = await import('@/lib/sync-queue-engine')
        console.log('🔄 Starting sync engine...')
        await syncEngine.start()
        console.log('✅ Sync engine started successfully')
      } catch (error) {
        console.error('❌ Failed to start sync engine:', error)
      }
    }

    // Start sync engine after a short delay to let the app initialize
    const timer = setTimeout(initSync, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null // This component doesn't render anything
}
