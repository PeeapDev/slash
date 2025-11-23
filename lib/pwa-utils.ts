"use client"

// PWA utilities for service worker registration, offline detection, and app updates

export interface PWAState {
  isInstalled: boolean
  isOnline: boolean
  hasUpdate: boolean
  isInstallPromptAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class PWAManager {
  private state: PWAState = {
    isInstalled: false,
    isOnline: true,
    hasUpdate: false,
    isInstallPromptAvailable: false,
    registration: null
  }

  // Unregister any active service workers (useful in development)
  async unregisterAllServiceWorkers(): Promise<void> {
    if (!('serviceWorker' in navigator)) return
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
      console.log('PWA: Unregistered all service workers')
    } catch (error) {
      console.warn('PWA: Failed to unregister service workers:', error)
    }
  }

  private listeners: Array<(state: PWAState) => void> = []
  private installPromptEvent: InstallPromptEvent | null = null

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.state.isOnline = navigator.onLine
      this.initializePWA()
    }
  }

  private async initializePWA() {
    // Disable PWA service worker in development/local to avoid dev chunk caching issues
    const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    if (isDev || isLocalhost) {
      console.log('PWA: Disabled in development/local environment')
      try {
        await this.unregisterAllServiceWorkers()
        await this.clearCache()
      } catch (err) {
        console.warn('PWA: Cleanup error (ignored in dev):', err)
      }
      return
    }
    // Check if already installed
    this.state.isInstalled = this.isRunningStandalone()

    // Set up online/offline detection
    this.setupNetworkDetection()

    // Set up install prompt detection
    this.setupInstallPrompt()

    // Register service worker
    await this.registerServiceWorker()

    // Listen for service worker messages
    this.setupServiceWorkerMessages()

    this.notifyListeners()
  }

  // Service Worker Registration
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('PWA: Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.state.registration = registration
      console.log('PWA: Service Worker registered successfully')

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.state.hasUpdate = true
              this.notifyListeners()
              console.log('PWA: New service worker available')
            }
          })
        }
      })

      // Check for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error)
    }
  }

  // Network Detection
  private setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      const wasOnline = this.state.isOnline
      this.state.isOnline = navigator.onLine

      if (wasOnline !== this.state.isOnline) {
        console.log(`PWA: Network status changed - ${this.state.isOnline ? 'Online' : 'Offline'}`)
        this.notifyListeners()

        // Trigger background sync when coming back online
        if (this.state.isOnline && this.state.registration) {
          this.triggerBackgroundSync()
        }
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  // Install Prompt Setup
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPromptEvent = e as InstallPromptEvent
      this.state.isInstallPromptAvailable = true
      this.notifyListeners()
      console.log('PWA: Install prompt available')
    })

    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true
      this.state.isInstallPromptAvailable = false
      this.installPromptEvent = null
      this.notifyListeners()
      console.log('PWA: App installed successfully')
    })
  }

  // Service Worker Messages
  private setupServiceWorkerMessages(): void {
    if (!navigator.serviceWorker) return

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { data } = event

      switch (data.type) {
        case 'BACKGROUND_SYNC':
          this.handleBackgroundSync(data.action)
          break
        case 'PERIODIC_BACKUP':
          this.handlePeriodicBackup()
          break
        default:
          console.log('PWA: Unknown service worker message:', data)
      }
    })
  }

  // Public Methods

  // Install the PWA
  async installApp(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.log('PWA: Install prompt not available')
      return false
    }

    try {
      await this.installPromptEvent.prompt()
      const { outcome } = await this.installPromptEvent.userChoice

      if (outcome === 'accepted') {
        console.log('PWA: User accepted install prompt')
        return true
      } else {
        console.log('PWA: User dismissed install prompt')
        return false
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error)
      return false
    }
  }

  // Update the service worker
  async updateServiceWorker(): Promise<void> {
    if (!this.state.registration?.waiting) {
      console.log('PWA: No waiting service worker to update')
      return
    }

    this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  // Trigger background sync
  async triggerBackgroundSync(): Promise<void> {
    if (!this.state.registration || !('sync' in this.state.registration)) {
      console.log('PWA: Background Sync not supported')
      return
    }

    try {
      await (this.state.registration as any).sync.register('data-sync')
      console.log('PWA: Background sync registered')
    } catch (error) {
      console.error('PWA: Background sync registration failed:', error)
    }
  }

  // Check if running in standalone mode
  private isRunningStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    )
  }

  // Event handlers
  private async handleBackgroundSync(action: string): Promise<void> {
    if (action === 'START_SYNC') {
      console.log('PWA: Starting background data sync')
      // Trigger sync in the main application
      window.dispatchEvent(new CustomEvent('pwa-background-sync'))
    }
  }

  private async handlePeriodicBackup(): Promise<void> {
    console.log('PWA: Starting periodic data backup')
    // Trigger backup in the main application
    window.dispatchEvent(new CustomEvent('pwa-periodic-backup'))
  }

  // State management
  getState(): PWAState {
    return { ...this.state }
  }

  subscribe(listener: (state: PWAState) => void): () => void {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  // Cache management
  async updateCache(urls: string[]): Promise<void> {
    if (!this.state.registration) return

    this.state.registration.active?.postMessage({
      type: 'CACHE_UPDATE',
      urls
    })
  }

  async clearCache(): Promise<void> {
    if (!('caches' in window)) return

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('PWA: All caches cleared')
    } catch (error) {
      console.error('PWA: Error clearing caches:', error)
    }
  }

  // Storage estimates
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (!('storage' in navigator) || !navigator.storage.estimate) {
      return null
    }

    try {
      return await navigator.storage.estimate()
    } catch (error) {
      console.error('PWA: Error getting storage estimate:', error)
      return null
    }
  }

  // Notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('PWA: Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Show notification
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.state.registration) {
      console.log('PWA: No service worker registration for notifications')
      return
    }

    try {
      await this.state.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      })
    } catch (error) {
      console.error('PWA: Error showing notification:', error)
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager()

// React hook for PWA state
export function usePWA() {
  const [state, setState] = React.useState<PWAState>(pwaManager.getState())

  React.useEffect(() => {
    return pwaManager.subscribe(setState)
  }, [])

  return {
    ...state,
    installApp: pwaManager.installApp.bind(pwaManager),
    updateServiceWorker: pwaManager.updateServiceWorker.bind(pwaManager),
    triggerBackgroundSync: pwaManager.triggerBackgroundSync.bind(pwaManager),
    requestNotificationPermission: pwaManager.requestNotificationPermission.bind(pwaManager),
    showNotification: pwaManager.showNotification.bind(pwaManager),
    getStorageEstimate: pwaManager.getStorageEstimate.bind(pwaManager),
    clearCache: pwaManager.clearCache.bind(pwaManager)
  }
}

export default pwaManager

// Export React for the hook
import React from 'react'
