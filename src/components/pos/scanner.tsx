'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { AlertCircle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: string) => void
}

export default function Scanner({ onScanSuccess, onScanFailure }: ScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const scannerId = 'reader'
    const html5QrCode = new Html5Qrcode(scannerId)
    html5QrCodeRef.current = html5QrCode

    const startScanner = async () => {
      try {
        setIsInitializing(true)
        setError(null)

        // Try to start with environment (back) camera
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText)
          },
          (errorMessage) => {
            // Failure callback is noisy, only log if needed
            if (onScanFailure) onScanFailure(errorMessage)
          }
        )
        setIsInitializing(false)
      } catch (err: any) {
        console.error('Camera initialization failed', err)
        setError('Could not access camera. Please ensure permissions are granted.')
        setIsInitializing(false)
      }
    }

    startScanner()

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear()
          })
          .catch((e) => console.error('Failed to stop scanner', e))
      }
    }
  }, [onScanSuccess, onScanFailure])

  return (
    <div className="overflow-hidden rounded-lg border bg-muted flex flex-col items-center justify-center min-h-[300px] relative">
      <div id="reader" className="w-full h-full"></div>
      
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10">
          <Camera className="h-10 w-10 text-primary animate-pulse mb-2" />
          <p className="text-sm font-medium">Initializing camera...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/95 p-6 text-center z-20">
          <AlertCircle className="h-12 w-12 text-destructive mb-3" />
          <h3 className="font-bold text-lg mb-1">Camera Access Required</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Retry Permission
          </Button>
        </div>
      )}
    </div>
  )
}
