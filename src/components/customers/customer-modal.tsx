'use client'

import { createCustomer, updateCustomer } from '@/actions/orders'
import { getSocialMediaTypes } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Share2, MapPin, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/use-app-store'

import type { ComponentType } from 'react'

interface MapPickerProps { onSelect: (addr: string) => void; initialAddress?: string }

// Dynamically import the map to avoid SSR issues with Leaflet
const MapPicker = dynamic<MapPickerProps>(() => import('./map-picker') as any, {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface CustomerModalProps {
  customer?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function CustomerModal({ customer, open: externalOpen, onOpenChange, trigger, onSuccess }: CustomerModalProps) {
  const router = useRouter()
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)
  const [isPending, startTransition] = useTransition()
  const [internalOpen, setInternalOpen] = useState(false)

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [socialTypes, setSocialTypes] = useState<any[]>([])
  const [showMap, setShowMap] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [socials, setSocials] = useState<{ typeId: string; handle: string }[]>([])

  useEffect(() => {
    if (customer) {
      setName(customer.name || '')
      setEmail(customer.email || '')
      setPhone(customer.phone || '')
      setAddress(customer.address || '')
      setSocials(customer.socialMedia?.map((s: any) => ({
        typeId: s.socialMediaTypeId,
        handle: s.handle
      })) || [])
    } else {
      resetForm()
    }
  }, [customer, open])

  useEffect(() => {
    if (open) {
      getSocialMediaTypes().then(res => {
        if (res.success) setSocialTypes(res.data || [])
      })
    }
  }, [open])

  const addSocial = () => {
    if (socialTypes.length > 0) {
      setSocials([...socials, { typeId: socialTypes[0].id, handle: '' }])
    }
  }
  const removeSocial = (index: number) => setSocials(socials.filter((_, i) => i !== index))
  const updateSocial = (index: number, field: 'typeId' | 'handle', value: string) => {
    const newSocials = [...socials]
    newSocials[index][field] = value
    setSocials(newSocials)
  }

  const handleAddressFromMap = useCallback((addr: string) => {
    setAddress(addr)
    setShowMap(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return showGlobalAlert('warning', 'Validation Error', 'Name is required')

    startTransition(async () => {
      let result
      if (customer) {
        result = await updateCustomer(customer.id, { name, email, phone, address })
      } else {
        result = await createCustomer({
          name, email, phone, address,
          socials: socials.filter(s => s.handle.trim() !== '')
        })
      }

      if (result.success) {
        setOpen(false)
        if (!customer) resetForm()
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        showGlobalAlert('error', 'Error', result.error || 'Operation failed')
      }
    })
  }

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setAddress(''); setSocials([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button><Plus className="mr-2 h-4 w-4" /> New Customer</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+123456789" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
            <div className="flex gap-2">
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address manually or use the map..."
                className="resize-none h-16 flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 self-start"
                onClick={() => setShowMap(v => !v)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {showMap ? 'Hide' : 'Map'}
              </Button>
            </div>
            {showMap && (
              <div className="rounded-lg overflow-hidden border shadow-sm">
                <MapPicker onSelect={handleAddressFromMap} initialAddress={address} />
              </div>
            )}
          </div>

          {/* Social Media (create only) */}
          {!customer && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center"><Share2 className="mr-2 h-4 w-4" /> Social Media</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                  <Plus className="mr-2 h-4 w-4" /> Add Social
                </Button>
              </div>
              {socials.map((s, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <select
                    className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={s.typeId}
                    onChange={(e) => updateSocial(i, 'typeId', e.target.value)}
                  >
                    {socialTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="@handle or profile link"
                    value={s.handle}
                    onChange={(e) => updateSocial(i, 'handle', e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
