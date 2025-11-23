"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Smartphone, 
  Wifi, 
  Database, 
  Users, 
  FlaskConical,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWALandingPageProps {
  onContinue: () => void
}

export default function PWALandingPage({ onContinue }: PWALandingPageProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
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
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual install instructions
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      
      if (isMobile) {
        if (isIOS) {
          alert('📱 To install on iOS:\n\n1. Tap the Share button (↑) at the bottom\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add" to confirm')
        } else {
          alert('📱 To install on Android:\n\n1. Tap the menu (⋮) in the top right\n2. Tap "Install app" or "Add to Home Screen"\n3. Tap "Install" to confirm')
        }
      } else {
        alert('💻 To install on Desktop:\n\n1. Click the install icon (⊕) in the address bar\n2. Or use browser menu → "Install SLASH"')
      }
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      setTimeout(() => {
        onContinue()
      }, 1000)
    }
    
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const features = [
    {
      icon: Database,
      title: 'Offline-First',
      description: 'Collect data without internet. Everything stored locally.',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Wifi,
      title: 'Auto Sync',
      description: 'Automatic cloud sync when connection is available.',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Users,
      title: 'Multi-Role',
      description: 'Field collectors, lab techs, supervisors, AI manager.',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: FlaskConical,
      title: 'Lab Integration',
      description: 'Sample tracking, lab results, quality control.',
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: BarChart3,
      title: 'AI Analytics',
      description: 'Automated data quality checks and reporting.',
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Role-based access, encrypted sync, audit trails.',
      color: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SLASH Field Data App
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Household and Lab Data Capture Tool
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Progressive Web App • Works Offline • Auto Sync
          </p>
        </motion.div>

        {/* Install Status */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-8"
          >
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">App Installed!</p>
                    <p className="text-sm text-green-700 dark:text-green-300">You can now use SLASH offline</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mb-16"
        >
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 border-0 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <Smartphone className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {isInstalled ? 'Launch App' : 'Install Now'}
              </h2>
              <p className="text-blue-100 mb-6 text-sm">
                {isInstalled 
                  ? 'Continue to start collecting data' 
                  : 'Get the full offline experience'}
              </p>
              <div className="space-y-3">
                {!isInstalled && (
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isInstallable ? 'Install App' : 'Get Install Instructions'}
                  </Button>
                )}
                <Button
                  onClick={onContinue}
                  size="lg"
                  variant={isInstalled ? "default" : "outline"}
                  className={isInstalled 
                    ? "w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg"
                    : "w-full text-white border-white hover:bg-white/10"
                  }
                >
                  {isInstalled ? 'Open App' : 'Continue in Browser'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              {!isInstalled && (
                <p className="text-xs text-blue-100 mt-4">
                  💡 Install for best offline experience
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Built for Field Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-3`} />
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* User Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-6">Who Uses SLASH?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { role: 'Field Collectors', icon: '👥' },
              { role: 'Lab Technicians', icon: '🔬' },
              { role: 'Supervisors', icon: '👨‍💼' },
              { role: 'AI Manager', icon: '🤖' }
            ].map((item) => (
              <Card key={item.role} className="text-center">
                <CardContent className="pt-6 pb-6">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <p className="text-sm font-medium">{item.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>SLASH - Household and Lab Data Capture Tool</p>
          <p className="mt-1">v1.0 • Offline-First PWA</p>
        </div>
      </div>
    </div>
  )
}
