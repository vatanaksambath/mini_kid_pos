'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: string) => void
}

export default function Scanner({ onScanSuccess, onScanFailure }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const callbacksRef = useRef({ onScanSuccess, onScanFailure })

  // Update refs when props change without triggering effect
  useEffect(() => {
    callbacksRef.current = { onScanSuccess, onScanFailure }
  }, [onScanSuccess, onScanFailure])

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    )
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        callbacksRef.current.onScanSuccess(decodedText)
      },
      (error) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(error)
        }
      }
    )

    return () => {
      scanner.clear().catch((err) => console.error('Failed to clear scanner', err))
    }
  }, []) // Only run once on mount

  return (
    <div className="overflow-hidden rounded-lg border bg-muted">
      <div id="reader" className="w-full"></div>
    </div>
  )
}
