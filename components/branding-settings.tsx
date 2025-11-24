"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Image as ImageIcon, Save, X, Check } from "lucide-react"
import { offlineDB, BaseRecord } from "@/lib/offline-first-db"

interface BrandingConfig extends BaseRecord {
  companyLogo?: string
  appLogo?: string
  appIcon?: string
  companyName?: string
  tagline?: string
  primaryColor?: string
}

export default function BrandingSettings() {
  const [config, setConfig] = useState<BrandingConfig>({
    id: 'branding-config',
    companyName: 'SLASH',
    tagline: 'Health Data Collection Platform',
    primaryColor: '#0ea5e9',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceId: 'system',
    collectorId: 'system'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const companyLogoInputRef = useRef<HTMLInputElement>(null)
  const appLogoInputRef = useRef<HTMLInputElement>(null)
  const appIconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      await offlineDB.init()
      
      // Try to get existing branding from IndexedDB
      const existingConfig = await offlineDB.getById<BrandingConfig>('app_settings', 'branding-config')
      
      if (existingConfig) {
        setConfig(existingConfig)
        console.log('✅ Loaded branding config:', existingConfig)
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    }
  }

  const handleImageUpload = async (type: 'companyLogo' | 'appLogo' | 'appIcon', file: File) => {
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setConfig(prev => ({
          ...prev,
          [type]: base64String
        }))
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await offlineDB.init()
      
      // Get deviceId and collectorId from offlineDB
      const deviceId = (offlineDB as any).deviceId || 'system'
      const collectorId = (offlineDB as any).collectorId || 'system'
      
      const updatedConfig: BrandingConfig = {
        ...config,
        version: (config.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
        deviceId,
        collectorId
      }
      
      console.log('💾 Saving branding config:', updatedConfig)
      
      // Save to IndexedDB
      await offlineDB.createOrUpdate('app_settings', updatedConfig)
      
      setConfig(updatedConfig)
      setSaved(true)
      
      console.log('✅ Branding saved successfully!')
      
      // Apply branding immediately
      applyBranding(updatedConfig)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('❌ Error saving branding:', error)
      alert(`Failed to save branding settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const applyBranding = (brandingConfig: BrandingConfig) => {
    // Update page title
    if (brandingConfig.companyName) {
      document.title = `${brandingConfig.companyName} - Health Data Platform`
    }
    
    // Update favicon if app icon exists
    if (brandingConfig.appIcon) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (link) {
        link.href = brandingConfig.appIcon
      }
    }
    
    // Update primary color
    if (brandingConfig.primaryColor) {
      document.documentElement.style.setProperty('--primary', brandingConfig.primaryColor)
    }
  }

  const handleRemoveImage = (type: 'companyLogo' | 'appLogo' | 'appIcon') => {
    setConfig(prev => ({
      ...prev,
      [type]: undefined
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Branding & Logo Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your app's appearance with your company logo and branding
        </p>
      </div>

      {/* Company Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Input
              value={config.companyName || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tagline</label>
            <Input
              value={config.tagline || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Enter tagline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={config.primaryColor || '#0ea5e9'}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                value={config.primaryColor || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#0ea5e9"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Company Logo */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Company Logo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your company logo (recommended: 400x100px, max 2MB)
        </p>
        
        <div className="space-y-4">
          {config.companyLogo ? (
            <div className="relative border-2 border-dashed border-border rounded-lg p-4 bg-muted/30">
              <img
                src={config.companyLogo}
                alt="Company Logo"
                className="max-h-24 mx-auto object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveImage('companyLogo')}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => companyLogoInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm font-medium">Click to upload company logo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG (max 2MB)</p>
            </div>
          )}
          <input
            ref={companyLogoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload('companyLogo', file)
            }}
          />
        </div>
      </Card>

      {/* App Logo */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">App Logo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your app logo for the login screen (recommended: 200x200px, max 2MB)
        </p>
        
        <div className="space-y-4">
          {config.appLogo ? (
            <div className="relative border-2 border-dashed border-border rounded-lg p-4 bg-muted/30">
              <img
                src={config.appLogo}
                alt="App Logo"
                className="max-h-32 mx-auto object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveImage('appLogo')}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => appLogoInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm font-medium">Click to upload app logo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG (max 2MB)</p>
            </div>
          )}
          <input
            ref={appLogoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload('appLogo', file)
            }}
          />
        </div>
      </Card>

      {/* App Icon */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">App Icon / Favicon</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your app icon for PWA and browser tab (recommended: 512x512px, max 2MB)
        </p>
        
        <div className="space-y-4">
          {config.appIcon ? (
            <div className="relative border-2 border-dashed border-border rounded-lg p-4 bg-muted/30">
              <img
                src={config.appIcon}
                alt="App Icon"
                className="max-h-24 mx-auto object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveImage('appIcon')}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => appIconInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm font-medium">Click to upload app icon</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, ICO (max 2MB)</p>
            </div>
          )}
          <input
            ref={appIconInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload('appIcon', file)
            }}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Branding
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      {(config.companyLogo || config.appLogo) && (
        <Card className="p-6 bg-muted/30">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
              <div className="text-center space-y-4">
                {config.appLogo && (
                  <img src={config.appLogo} alt="Preview" className="h-24 mx-auto" />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{config.companyName}</h1>
                  <p className="text-sm text-muted-foreground">{config.tagline}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
