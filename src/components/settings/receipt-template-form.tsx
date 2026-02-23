'use client'

import { getReceiptTemplate, upsertReceiptTemplate } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Upload, Store, Phone, MapPin, CreditCard, MessageSquare, RefreshCw } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ReceiptTemplateForm() {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  const [shopName, setShopName] = useState('')
  const [address, setAddress] = useState('')
  const [phone1, setPhone1] = useState('')
  const [phone1Provider, setPhone1Provider] = useState('Cellcard')
  const [phone2, setPhone2] = useState('')
  const [phone2Provider, setPhone2Provider] = useState('Smart')
  const [logoUrl, setLogoUrl] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankQrImageUrl, setBankQrImageUrl] = useState('')
  const [bottomMessage, setBottomMessage] = useState('Thank you for shopping with us!')
  const [exchangeRate, setExchangeRate] = useState('4100')
  const [defaultDeliveryPrice, setDefaultDeliveryPrice] = useState('0')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getReceiptTemplate().then(res => {
      if (res.success && res.data) {
        const t = res.data
        setShopName(t.shopName || '')
        setAddress(t.address || '')
        setPhone1(t.phone1 || '')
        setPhone1Provider(t.phone1Provider || 'Cellcard')
        setPhone2(t.phone2 || '')
        setPhone2Provider(t.phone2Provider || 'Smart')
        setLogoUrl(t.logoUrl || '')
        setBankAccountNo(t.bankAccountNo || '')
        setBankAccountName(t.bankAccountName || '')
        setBankQrImageUrl(t.bankQrImageUrl || '')
        setBottomMessage(t.bottomMessage || 'Thank you for shopping with us!')
        setExchangeRate(t.exchangeRate?.toString() || '4100')
        setDefaultDeliveryPrice(t.defaultDeliveryPrice?.toString() || '0')
      }
      setLoading(false)
    })
  }, [])

  const handleImageFile = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      const res = await upsertReceiptTemplate({
        shopName, address, phone1, phone1Provider, phone2, phone2Provider, logoUrl,
        bankAccountNo, bankAccountName, bankQrImageUrl,
        bottomMessage, 
        exchangeRate: parseFloat(exchangeRate) || 4100,
        defaultDeliveryPrice: parseFloat(defaultDeliveryPrice) || 0,
      })
      if (res.success) setSaved(true)
      else alert(res.error)
    })
  }

  if (loading) return <div className="h-32 flex items-center justify-center text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading template...</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Shop info */}
        <Card className="border">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><Store className="h-4 w-4 text-primary" /> Shop Information</h4>
            <div className="space-y-2">
              <Label className="text-xs">Shop Name *</Label>
              <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="My Baby Shop" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Street 101, Phnom Penh..." className="resize-none h-16 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone 1</Label>
                <div className="flex gap-2">
                  <Select value={phone1Provider} onValueChange={setPhone1Provider}>
                    <SelectTrigger className="w-[110px] text-xs h-9">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cellcard">Cellcard</SelectItem>
                      <SelectItem value="Smart">Smart</SelectItem>
                      <SelectItem value="Metfone">Metfone</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="flex-1" value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="017 000 000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone 2</Label>
                <div className="flex gap-2">
                  <Select value={phone2Provider} onValueChange={setPhone2Provider}>
                    <SelectTrigger className="w-[110px] text-xs h-9">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Smart">Smart</SelectItem>
                      <SelectItem value="Cellcard">Cellcard</SelectItem>
                      <SelectItem value="Metfone">Metfone</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="flex-1" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="012 000 000" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Exchange Rate (1 USD = ? local)</Label>
              <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} placeholder="4100" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Default Delivery Price ($)</Label>
              <Input type="number" value={defaultDeliveryPrice} onChange={e => setDefaultDeliveryPrice(e.target.value)} placeholder="0" />
            </div>
          </CardContent>
        </Card>

        {/* Right column: Bank & logo */}
        <Card className="border">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-primary" /> Bank / Payment Info</h4>
            <div className="space-y-2">
              <Label className="text-xs">Account Number</Label>
              <Input value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} placeholder="001 046 567" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Account Name</Label>
              <Input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="YOUR NAME" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bank QR Code Image (KHQR)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('qr-upload')?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload QR
                </Button>
                <input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={handleImageFile(setBankQrImageUrl)} />
                {bankQrImageUrl && <img src={bankQrImageUrl} alt="Bank QR" className="h-12 w-12 object-contain rounded border" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Shop Logo</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload Logo
                </Button>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageFile(setLogoUrl)} />
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded border" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom message */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Receipt Footer Message</Label>
        <Textarea value={bottomMessage} onChange={e => setBottomMessage(e.target.value)} placeholder="Thank you for shopping with us!" className="resize-none h-12 text-sm" />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isPending ? 'Saving...' : 'Save Template'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved successfully</span>}
      </div>
    </form>
  )
}
