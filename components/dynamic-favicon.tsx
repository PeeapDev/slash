"use client"

import { useEffect } from 'react'
import { offlineDB } from '@/lib/offline-first-db'

interface BrandingConfig {
  id: string
  companyName?: string
  appLogo?: string
  companyLogo?: string
  appIcon?: string
  primaryColor?: string
  secondaryColor?: string
}

export default function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        await offlineDB.init()
        
        // Get branding settings
        const branding = await offlineDB.getById<BrandingConfig>('app_settings', 'branding_config')
        
        if (branding?.appIcon) {
          // Update favicon with uploaded icon
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
          if (!link) {
            const newLink = document.createElement('link')
            newLink.rel = 'icon'
            document.head.appendChild(newLink)
            newLink.href = branding.appIcon
          } else {
            link.href = branding.appIcon
          }
          
          console.log('✅ Favicon updated from branding settings')
        }
        
        // Update page title with company name
        if (branding?.companyName) {
          document.title = `${branding.companyName} - Dashboard`
        }
        
        // Update theme color
        if (branding?.primaryColor) {
          let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
          if (!themeColor) {
            themeColor = document.createElement('meta')
            themeColor.name = 'theme-color'
            document.head.appendChild(themeColor)
          }
          themeColor.content = branding.primaryColor
        }
        
      } catch (error) {
        console.error('Error updating favicon:', error)
      }
    }
    
    updateFavicon()
    
    // Listen for branding changes
    const handleStorageChange = () => {
      updateFavicon()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  return null // This component doesn't render anything
}
