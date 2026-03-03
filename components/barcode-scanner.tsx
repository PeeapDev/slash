"use client"

import { useState, useEffect, useRef } from "react"

interface BarcodeScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setScanning(true)
        }

        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e']
          })

          const detect = async () => {
            if (cancelled || !videoRef.current) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue)
                stopCamera()
                return
              }
            } catch { /* ignore detection errors */ }
            if (!cancelled) requestAnimationFrame(detect)
          }

          videoRef.current?.addEventListener('loadeddata', () => {
            if (!cancelled) detect()
          })
        } else {
          setError('Barcode detection not supported in this browser. Please enter the code manually.')
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera access to scan barcodes.')
      }
    }

    startCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Scan Barcode / QR Code</h3>
          <button onClick={() => { stopCamera(); onClose() }} className="text-xs text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="text-white text-sm text-center">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                    <div className="w-full h-0.5 bg-red-500 animate-pulse mt-24" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 text-center text-xs text-slate-500">
          Point your camera at a barcode or QR code
        </div>
      </div>
    </div>
  )
}
