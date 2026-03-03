"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, Smartphone, Database, Wifi } from 'lucide-react'
import { indexedDBService } from '@/lib/indexdb-service'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const dismissChecked = useRef(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the popup before (via IndexedDB)
    const checkDismissed = async () => {
      try {
        const stored = await indexedDBService.get<{ id: string; value: boolean }>('app_settings', 'pwa_install_dismissed')
        dismissChecked.current = true
        if (stored?.value) return // Already dismissed, don't show

        // Not dismissed — set up install prompt listeners
        setupListeners()
      } catch {
        // IDB failed, set up listeners anyway
        setupListeners()
      }
    }

    const setupListeners = () => {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setTimeout(() => setShowPopup(true), 2000)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true)
        setShowPopup(false)
      })

      // Show popup on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        setTimeout(() => setShowPopup(true), 3000)
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    checkDismissed()
  }, [])

  const dismiss = () => {
    setShowPopup(false)
    indexedDBService.set('app_settings', { id: 'pwa_install_dismissed', value: true }).catch(() => {})
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

      if (isMobile) {
        if (isIOS) {
          alert('To install on iOS:\n\n1. Tap the Share button\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add"')
        } else {
          alert('To install on Android:\n\n1. Tap menu\n2. Tap "Install app"\n3. Tap "Install"')
        }
      } else {
        alert('To install:\n\nLook for the install icon in your browser\'s address bar')
      }
      dismiss()
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    dismiss()
  }

  if (isInstalled || !showPopup) {
    return null
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
              <CardContent className="pt-6 pb-6 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={dismiss}
                >
                  <X size={16} />
                </Button>

                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-600 rounded-full">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-2">Install SLASH App</h3>
                    <p className="text-sm text-muted-foreground">
                      Get the full offline experience
                    </p>
                  </div>

                  <div className="flex justify-center gap-6 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <Database className="w-6 h-6 text-blue-600" />
                      <span className="text-xs">Offline</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Wifi className="w-6 h-6 text-green-600" />
                      <span className="text-xs">Auto-Sync</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="w-6 h-6 text-purple-600" />
                      <span className="text-xs">Native App</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleInstallClick}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={dismiss}
                      size="lg"
                    >
                      Later
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Works offline - Fast - Secure
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
