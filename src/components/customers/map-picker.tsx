'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapPickerProps {
  onSelect: (address: string) => void
  initialAddress?: string
}

export default function MapPicker({ onSelect, initialAddress }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [displayAddr, setDisplayAddr] = useState('')
  const markerRef = useRef<any>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const L = require('leaflet')
    // Fix default icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    const map = L.map(mapRef.current).setView([11.5564, 104.9282], 13) // Default: Phnom Penh
    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    const marker = L.marker([11.5564, 104.9282], { draggable: true }).addTo(map)
    markerRef.current = marker

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        const data = await res.json()
        const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setDisplayAddr(addr)
      } catch {
        setDisplayAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    }

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng)
      reverseGeocode(e.latlng.lat, e.latlng.lng)
    })

    reverseGeocode(11.5564, 104.9282)
    setLoading(false)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="h-56 w-full rounded-lg z-0" />
      {displayAddr && (
        <div className="px-2 py-1 text-xs text-muted-foreground bg-muted rounded">
          📍 {displayAddr}
        </div>
      )}
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => onSelect(displayAddr)}
        disabled={!displayAddr}
      >
        Use This Location
      </Button>
    </div>
  )
}
