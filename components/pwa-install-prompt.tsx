"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Download, Smartphone, Wifi, Database, CheckCircle, ArrowRight, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(true)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      setShowPrompt(false)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual install instructions
      alert('To install:\n\nAndroid Chrome: Tap menu (⋮) → "Install app"\niOS Safari: Tap share (↑) → "Add to Home Screen"')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  if (isInstalled) {
    return null
  }

  if (!showPrompt) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowPrompt(false)}
          >
            <X size={16} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Install SLASH App</CardTitle>
              <CardDescription>Work offline, sync when online</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Offline First</p>
                <p className="text-xs text-muted-foreground">Work without internet</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wifi className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Auto Sync</p>
                <p className="text-xs text-muted-foreground">Syncs when online</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Fast & Secure</p>
                <p className="text-xs text-muted-foreground">Quick access anytime</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {isInstallable ? 'Install Now' : 'Install App'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
              size="lg"
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Installable on Android, iOS, and Desktop
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
