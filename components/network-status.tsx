"use client"

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react'

interface NetworkStatusProps {
  className?: string
  showText?: boolean
}

export default function NetworkStatus({ className = "", showText = true }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine)
    
    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown')
      }
    }

    const handleOnline = () => {
      console.log('🌐 Network: ONLINE')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('📵 Network: OFFLINE')
      setIsOnline(false)
    }

    const handleConnectionChange = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          setConnectionType(connection.effectiveType || connection.type || 'unknown')
          console.log(`📶 Connection type: ${connection.effectiveType || connection.type}`)
        }
      }
    }

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        connection.addEventListener('change', handleConnectionChange)
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange)
        }
      }
    }
  }, [])

  // Additional check with a ping to ensure actual connectivity
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false)
        return
      }

      try {
        // Try to fetch a small resource to verify actual connectivity
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        })
        setIsOnline(true)
      } catch (error) {
        console.log('📵 Network: Failed connectivity check - marking as offline')
        setIsOnline(false)
      }
    }

    // Check connectivity every 10 seconds
    intervalId = setInterval(checkConnectivity, 10000)
    
    // Initial check
    checkConnectivity()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  const getStatusColor = () => {
    return isOnline ? 'text-green-600' : 'text-red-600'
  }

  const getBackgroundColor = () => {
    return isOnline ? 'bg-green-100' : 'bg-red-100'
  }

  const getStatusText = () => {
    if (isOnline) {
      return connectionType !== 'unknown' ? `Online (${connectionType})` : 'Online'
    }
    return 'Offline'
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getBackgroundColor()} ${className}`}>
      <div className={`${getStatusColor()}`}>
        {isOnline ? (
          <Cloud size={16} className="animate-pulse" />
        ) : (
          <CloudOff size={16} />
        )}
      </div>
      
      {showText && (
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
      
      {/* Connection indicator dot */}
      <div 
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        title={isOnline ? 'Connected to internet' : 'No internet connection'}
      />
    </div>
  )
}
