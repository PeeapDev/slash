"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Key,
} from "lucide-react"

export default function EncryptionSettings() {
  const [initialized, setInitialized] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Setup form
  const [setupPassphrase, setSetupPassphrase] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [showSetupPass, setShowSetupPass] = useState(false)

  // Unlock form
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [showUnlockPass, setShowUnlockPass] = useState(false)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 6000)
  }

  // Check encryption state on mount
  useEffect(() => {
    const check = async () => {
      try {
        const { isEncryptionInitialized, isEncryptionUnlocked } = await import('@/lib/encryption')
        const init = await isEncryptionInitialized()
        setInitialized(init)
        setUnlocked(isEncryptionUnlocked())
      } catch {
        setInitialized(false)
      }
    }
    check()
  }, [])

  // Initialize encryption
  const handleSetup = async () => {
    if (setupPassphrase.length < 8) {
      showMsg('error', 'Passphrase must be at least 8 characters')
      return
    }
    if (setupPassphrase !== setupConfirm) {
      showMsg('error', 'Passphrases do not match')
      return
    }

    setIsLoading(true)
    try {
      const { initializeEncryption } = await import('@/lib/encryption')
      await initializeEncryption(setupPassphrase)
      setInitialized(true)
      setUnlocked(true)
      setSetupPassphrase('')
      setSetupConfirm('')
      showMsg('success', 'Encryption enabled. Your data will now be encrypted at rest.')
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Unlock encryption
  const handleUnlock = async () => {
    if (!unlockPassphrase) {
      showMsg('error', 'Enter your passphrase')
      return
    }

    setIsLoading(true)
    try {
      const { unlockEncryption } = await import('@/lib/encryption')
      const success = await unlockEncryption(unlockPassphrase)
      if (success) {
        setUnlocked(true)
        setUnlockPassphrase('')
        showMsg('success', 'Encryption unlocked for this session')
      } else {
        showMsg('error', 'Wrong passphrase')
      }
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Unlock failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Lock encryption
  const handleLock = () => {
    import('@/lib/encryption').then(({ lockEncryption }) => {
      lockEncryption()
      setUnlocked(false)
      showMsg('success', 'Encryption locked')
    })
  }

  const sensitiveFieldsList = [
    { store: 'Participants', fields: 'Full Name, Phone Number, Medical History, Medications' },
    { store: 'Households', fields: 'Head of Household, Address, Phone Number' },
    { store: 'Surveys', fields: 'Response Data' },
  ]

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Data Encryption</h2>
          {initialized === null ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : initialized ? (
            unlocked ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">
                <Unlock className="w-3 h-3 mr-1" /> Unlocked
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-2">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )
          ) : (
            <Badge variant="secondary" className="ml-2">Not Set Up</Badge>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <AlertTriangle className="w-4 h-4 inline mr-2" />}
            {message.text}
          </div>
        )}

        {/* Not initialized — show setup */}
        {initialized === false && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable AES-256-GCM encryption to protect sensitive fields in your offline data.
              Once enabled, a passphrase is required to view encrypted data each session.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Warning:</strong> If you forget your passphrase, encrypted data cannot be recovered.
                There is no reset mechanism.
              </span>
            </div>
            <div className="space-y-3 max-w-md">
              <div className="relative">
                <Input
                  placeholder="Choose a passphrase (min 8 characters)"
                  type={showSetupPass ? 'text' : 'password'}
                  value={setupPassphrase}
                  onChange={(e) => setSetupPassphrase(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSetupPass(!showSetupPass)}
                  className="absolute right-2 top-2.5 text-muted-foreground"
                >
                  {showSetupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                placeholder="Confirm passphrase"
                type="password"
                value={setupConfirm}
                onChange={(e) => setSetupConfirm(e.target.value)}
              />
              <Button
                onClick={handleSetup}
                disabled={isLoading || setupPassphrase.length < 8 || setupPassphrase !== setupConfirm}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Enable Encryption
              </Button>
            </div>
          </div>
        )}

        {/* Initialized but locked — show unlock */}
        {initialized === true && !unlocked && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Encryption is enabled but locked. Enter your passphrase to view and edit encrypted data.
            </p>
            <div className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter passphrase"
                  type={showUnlockPass ? 'text' : 'password'}
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button
                  type="button"
                  onClick={() => setShowUnlockPass(!showUnlockPass)}
                  className="absolute right-2 top-2.5 text-muted-foreground"
                >
                  {showUnlockPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={handleUnlock} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Unlocked — show status + lock button */}
        {initialized === true && unlocked && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Encryption Active</p>
                <p className="text-sm text-green-600">Sensitive fields are encrypted at rest. Key is held in memory for this session.</p>
              </div>
            </div>
            <Button onClick={handleLock} variant="outline" size="sm">
              <Lock className="w-4 h-4 mr-1" />
              Lock Now
            </Button>
          </div>
        )}

        {/* Encrypted fields info */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold text-sm">Encrypted Fields</h3>
          <div className="space-y-2">
            {sensitiveFieldsList.map(({ store, fields }) => (
              <div key={store} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 text-xs">{store}</Badge>
                <span className="text-muted-foreground">{fields}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Encryption uses AES-256-GCM with PBKDF2 key derivation (600,000 iterations).
            The key exists only in memory and is lost on page reload.
          </p>
        </div>
      </div>
    </Card>
  )
}
