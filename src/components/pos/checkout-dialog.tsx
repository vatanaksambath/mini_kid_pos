'use client'

import { createOrder, getCustomers, createCustomer } from '@/actions/orders'
import { getLocations } from '@/actions/inventory'
import { getBankPaymentTypes, getReceiptTemplate } from '@/actions/settings'
import { buildReceiptHtml } from '@/lib/receipt-utils'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  CreditCard, Banknote, Smartphone, Gift, CheckCircle2, Percent,
  DollarSign, User, Plus, Star, Search, Loader2, Printer, ChevronDown, 
  Truck, Edit3, X,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect, useTransition, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

interface CartItem { variantId: string; quantity: number; price: number; costPrice: number; name?: string; sku?: string; description?: string }

interface CheckoutDialogProps {
  total: number
  items: CartItem[]
  onSuccess: () => void
}

type PaymentMethod = 'CASH' | 'CARD' | 'GIFT_CARD' | 'MOBILE_PAYMENT'

export default function CheckoutDialog({ total, items, onSuccess }: CheckoutDialogProps) {
  const [isPending, startTransition] = useTransition()
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'details' | 'success'>('details')

  // Data
  const [locations, setLocations]     = useState<any[]>([])
  const [customers, setCustomers]     = useState<any[]>([])
  const [bankTypes, setBankTypes]     = useState<any[]>([])
  const [template, setTemplate]       = useState<any>(null)

  // Form state
  const [selectedLocation, setSelectedLocation]     = useState('')
  const [selectedCustomer, setSelectedCustomer]     = useState<string>('walk-in')
  const [customerSearch, setCustomerSearch]         = useState('')
  const [showCustomerList, setShowCustomerList]     = useState(false)
  const [paymentMethodId, setPaymentMethodId]         = useState<string>('')
  const [discountType, setDiscountType]             = useState<'none' | 'flat' | 'percent'>('none')
  const [discountValue, setDiscountValue]           = useState('')
  const [receivedAmount, setReceivedAmount]         = useState('')
  const [redeemPoints, setRedeemPoints]             = useState(false)
  const [shippingFee, setShippingFee]               = useState<string>('0')
  const [isFreeShipping, setIsFreeShipping]         = useState(false)
  const [editableItems, setEditableItems]           = useState<CartItem[]>([])
  const [isPaid, setIsPaid]                         = useState(true)

  // Quick-add customer
  const [showQuickAdd, setShowQuickAdd]             = useState(false)
  const [quickName, setQuickName]                   = useState('')
  const [quickPhone, setQuickPhone]                 = useState('')
  const [quickAddPending, startQuickAdd]            = useTransition()

  // Completed order (for receipt)
  const [completedOrder, setCompletedOrder]         = useState<any>(null)

  const customerRef = useRef<HTMLDivElement>(null)
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer)
  const selectedPaymentObj = bankTypes.find((b: any) => b.id === paymentMethodId)

  // Computed values
  const loyaltyPoints    = selectedCustomerObj?.loyaltyPoints || 0
  const redeemValueRate  = template?.loyaltyRedeemValue ?? 0.01
  const pointsValue      = redeemPoints ? Math.min(total, loyaltyPoints * redeemValueRate) : 0
  const discountAmount   = discountType === 'flat' ? parseFloat(discountValue) || 0
                          : discountType === 'percent' ? total * (parseFloat(discountValue) || 0) / 100
                          : 0
  const finalShipping    = isFreeShipping ? 0 : (parseFloat(shippingFee) || 0)
  const finalTotal       = Math.max(0, total - discountAmount - pointsValue + finalShipping)
  const change           = selectedPaymentObj?.type === 'CASH' ? Math.max(0, (parseFloat(receivedAmount) || 0) - finalTotal) : 0
  const excRate          = template?.exchangeRate || 4100

  useEffect(() => {
    if (open) {
      Promise.all([getLocations(), getCustomers(), getBankPaymentTypes(), getReceiptTemplate()]).then(
        ([locRes, custRes, bankRes, tmplRes]) => {
          if (locRes.success) { setLocations(locRes.data || []); if (locRes.data?.length) setSelectedLocation(locRes.data[0].id) }
          if (custRes.success) setCustomers(custRes.data || [])
          if (bankRes.success) {
            const active = (bankRes.data || []).filter((b: any) => b.isActive !== false)
            setBankTypes(active)
            if (active.length) setPaymentMethodId(active[0].id)
          }
          if (tmplRes.success && tmplRes.data) {
            setTemplate(tmplRes.data)
            setShippingFee(tmplRes.data.defaultDeliveryPrice?.toString() || '0')
          }
        }
      )
    }
  }, [open])

  useEffect(() => {
    setEditableItems(items.map(i => ({ ...i, description: i.description || '' })))
  }, [items, open])

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)
  )

  const handleSelectCustomer = (id: string, name: string) => {
    setSelectedCustomer(id)
    setCustomerSearch(name)
    setShowCustomerList(false)
    setRedeemPoints(false)
  }

  const handleQuickAdd = () => {
    if (!quickName.trim()) return
    startQuickAdd(async () => {
      const res = await createCustomer({ name: quickName.trim(), phone: quickPhone.trim() })
      if (res.success && res.data) {
        setCustomers(prev => [...prev, { ...res.data, socialMedia: [], loyaltyPoints: 0 }])
        handleSelectCustomer(res.data.id, res.data.name)
        setShowQuickAdd(false); setQuickName(''); setQuickPhone('')
      }
    })
  }

  const handleCheckout = () => {
    if (!selectedLocation) return showGlobalAlert('error', 'Error', 'Please select a location')
    startTransition(async () => {
      const redeemRate = template?.loyaltyRedeemValue ?? 0.01
      const loyaltyPointsRedeemed = redeemPoints ? Math.floor(pointsValue / redeemRate) : 0
      const selectedPaymentMethod = bankTypes.find((b: any) => b.id === paymentMethodId)
      const dbPaymentMethod: PaymentMethod = selectedPaymentMethod?.type || 'CASH'

      const result = await createOrder({
        locationId: selectedLocation,
        customerId: selectedCustomer === 'walk-in' ? undefined : selectedCustomer,
        totalAmount: finalTotal,
        discountAmount,
        discountType,
        loyaltyPointsRedeemed,
        items: editableItems.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          costPrice: i.costPrice,
          description: i.description
        })),
        payments: isPaid ? [{ amount: finalTotal, paymentMethod: dbPaymentMethod }] : [],
        shippingFee: finalShipping,
        status: isPaid ? 'COMPLETED' : 'PENDING',
      })

      if (result.success) {
        setCompletedOrder({
          ...result.data,
          items,
          customer: selectedCustomerObj,
          discountAmount,
          discountType,
          loyaltyPointsRedeemed,
          paymentMethod: dbPaymentMethod,
          receivedAmount: parseFloat(receivedAmount) || finalTotal,
          change,
          bankType: bankTypes.find((b: any) => b.id === paymentMethodId),
          shippingFee: finalShipping,
        })
        setStep('success')
      } else {
        showGlobalAlert('error', 'Error', 'Checkout failed: ' + result.error)
      }
    })
  }

  const handleClose = () => {
    const setCurrentView = useAppStore.getState().setCurrentView
    if (step === 'success') { 
      onSuccess()
      setStep('details') 
      setOpen(false)
      setCurrentView('pos')
    }
    setDiscountType('none'); setDiscountValue(''); setReceivedAmount('')
    setSelectedCustomer('walk-in'); setCustomerSearch('')
    setRedeemPoints(false); setShowQuickAdd(false)
    if (bankTypes.length) setPaymentMethodId(bankTypes[0].id)
  }

  // Current selected payment method object


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-white text-primary hover:bg-gray-100 font-bold py-6 text-xl" disabled={items.length === 0}>
          CHECKOUT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto w-[98vw] p-0 border-none shadow-2xl">
        {step === 'details' ? (
          <>
            <DialogHeader className="px-6 py-3 border-b bg-muted/20">
              <DialogTitle className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
                Finalize Sale
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              {/* Vertical Divider */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
              
              {/* LEFT COLUMN */}
              <div className="p-4 md:px-8 md:pb-8 md:pt-2 space-y-4 md:space-y-6">
                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Store Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer combobox */}
                <div className="space-y-1.5" ref={customerRef}>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Customer
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="h-12 pl-10 text-base"
                      placeholder="Search customer or Walk-in..."
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowCustomerList(true); setSelectedCustomer('walk-in') }}
                      onFocus={() => setShowCustomerList(true)}
                    />
                    {showCustomerList && (
                      <div className="absolute z-50 mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-44 overflow-y-auto">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 text-muted-foreground italic" onClick={() => { setSelectedCustomer('walk-in'); setCustomerSearch(''); setShowCustomerList(false) }}>
                          Walk-in Customer
                        </button>
                        {filteredCustomers.map(c => (
                          <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50" onClick={() => handleSelectCustomer(c.id, c.name)}>
                            <div className="font-medium">{c.name}</div>
                            {c.phone && <div className="text-xs text-muted-foreground">{c.phone} · {c.loyaltyPoints} pts</div>}
                          </button>
                        ))}
                        {customerSearch && !filteredCustomers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                          <button className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 text-primary flex items-center gap-1" onClick={() => { setQuickName(customerSearch); setShowQuickAdd(true); setShowCustomerList(false) }}>
                            <Plus className="h-3 w-3" /> Add &ldquo;{customerSearch}&rdquo; as new customer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Loyalty points badge */}
                  {selectedCustomerObj && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium">{loyaltyPoints} loyalty pts available</span>
                      <button
                        type="button"
                        onClick={() => setRedeemPoints(v => !v)}
                        className={cn("ml-auto text-xs px-2 py-0.5 rounded-full border transition-colors", redeemPoints ? "bg-amber-500 text-white border-amber-500" : "border-amber-400 text-amber-600 hover:bg-amber-100")}
                      >
                        {redeemPoints ? `Redeeming $${pointsValue.toFixed(2)}` : 'Redeem'}
                      </button>
                    </div>
                  )}
                  {/* Quick-add inline form */}
                  {showQuickAdd && (
                    <div className="border rounded-lg p-3 bg-primary/5 space-y-2 animate-in slide-in-from-top-2 duration-150">
                      <p className="text-xs font-semibold text-primary">Quick Add Customer</p>
                      <Input className="h-8 text-xs" placeholder="Full name *" value={quickName} onChange={e => setQuickName(e.target.value)} />
                      <Input className="h-8 text-xs" placeholder="Phone (optional)" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" className="flex-1 h-7 text-xs" onClick={handleQuickAdd} disabled={quickAddPending || !quickName}>
                          {quickAddPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add & Select'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items List for Description Editing */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                    <span>Cart Items (Edit Descriptions)</span>
                    <span className="text-[10px] lowercase font-normal italic">Optional note for receipt</span>
                  </Label>
                  <div className="space-y-3 border rounded-xl p-4 bg-muted/30 max-h-60 overflow-y-auto shadow-inner">
                    {editableItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1 pb-2 border-b last:border-0 mb-2 last:mb-0">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="truncate flex-1">{item.name} x{item.quantity}</span>
                          <span className="font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="relative">
                          <Edit3 className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input 
                            placeholder="Add description/note..." 
                            className="h-9 text-xs pl-8" 
                            value={item.description || ''}
                            onChange={e => {
                              const newItems = [...editableItems]
                              newItems[idx].description = e.target.value
                              setEditableItems(newItems)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Settings */}
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-bold">Delivery Setting</p>
                        <p className="text-[10px] text-muted-foreground">Default: ${template?.defaultDeliveryPrice || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="free-del" className="text-xs">Free Delivery</Label>
                      <Switch id="free-del" checked={isFreeShipping} onCheckedChange={setIsFreeShipping} />
                    </div>
                  </div>
                  
                  {!isFreeShipping && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                      <Label className="text-xs w-24">Delivery Fee</Label>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-8 pl-6 text-sm" 
                          value={shippingFee} 
                          onChange={e => setShippingFee(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="p-4 md:px-8 md:pb-8 md:pt-2 bg-muted/10 flex flex-col justify-between border-l">
                <div className="space-y-6">
                  {/* Discount */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Discount
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex border rounded-lg overflow-hidden text-xs">
                        {(['none', 'flat', 'percent'] as const).map(t => (
                          <button key={t} type="button"
                            onClick={() => { setDiscountType(t); setDiscountValue('') }}
                            className={cn("px-4 py-3 font-bold transition-colors", discountType === t ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}
                          >
                            {t === 'none' ? 'None' : t === 'flat' ? '$ Off' : '% Off'}
                          </button>
                        ))}
                      </div>
                      {discountType !== 'none' && (
                        <Input
                          className="h-9 flex-1 text-sm"
                          type="number" min="0"
                          placeholder={discountType === 'flat' ? '0.00' : '0'}
                          value={discountValue}
                          onChange={e => setDiscountValue(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Payment Method — from Settings */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Method</Label>
                    {bankTypes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No payment methods configured. Add them in Settings → Payment Methods.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {bankTypes.map((method: any) => (
                          <button
                            key={method.id} type="button"
                            onClick={() => setPaymentMethodId(method.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                              paymentMethodId === method.id
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-muted/30 text-muted-foreground"
                            )}
                          >
                            {method.qrImageUrl
                              ? <img src={method.qrImageUrl} className="h-5 w-5 rounded object-contain shrink-0" alt="" />
                              : <Banknote className="h-4 w-4 shrink-0" />}
                            {method.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Cash change calculator — shown when selected method is CASH type */}
                    {selectedPaymentObj?.type === 'CASH' && isPaid && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1">
                          <Input 
                            className="h-12 text-sm font-bold pl-3 border-2 focus-visible:ring-primary shadow-sm" 
                            type="number" 
                            step="0.01" 
                            placeholder="Amount received $" 
                            value={receivedAmount} 
                            onChange={e => setReceivedAmount(e.target.value)} 
                          />
                        </div>
                        {change > 0 && (
                          <div className="flex flex-col items-center justify-center bg-emerald-500 text-white px-5 py-2 rounded-xl border border-emerald-400 shadow-md transform hover:scale-105 transition-all duration-200 animate-in zoom-in-95">
                            <span className="text-[10px] uppercase font-black tracking-tight opacity-90 mb-0.5">Total Change</span>
                            <span className="text-lg font-black leading-none">${change.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Not Paid Toggle */}
                    <div className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 mt-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="is-paid" className="text-sm font-bold text-red-600 dark:text-red-400">Mark as Unpaid</Label>
                      </div>
                      <Switch id="is-paid" checked={!isPaid} onCheckedChange={checked => setIsPaid(!checked)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t mt-auto">
                  {/* Order summary */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                    {finalShipping > 0 && <div className="flex justify-between text-primary"><span>Delivery Fee</span><span>+${finalShipping.toFixed(2)}</span></div>}
                    {isFreeShipping && <div className="flex justify-between text-green-600"><span>Delivery Fee</span><span className="font-bold">FREE</span></div>}
                    {discountAmount > 0 && <div className="flex justify-between text-orange-600"><span>Discount ({discountType === 'percent' ? `${discountValue}%` : 'flat'})</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    {pointsValue > 0 && <div className="flex justify-between text-amber-600"><span>Loyalty Points Redeemed</span><span>-${pointsValue.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-xl pt-2 mt-2 border-t"><span>Total</span><span className="text-primary">${finalTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>≈ Riel</span><span>៛{(finalTotal * excRate).toLocaleString()}</span></div>
                  </div>

                  <Button onClick={handleCheckout} className="w-full h-14 text-lg font-bold" disabled={isPending}>
                    {isPending ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processing...</> : `Confirm Payment · $${finalTotal.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Success screen ── */
          <div className="flex flex-col items-center justify-center py-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Sale Successful!</h2>
            
            {/* Receipt Preview */}
            <div className="w-full border rounded-lg bg-white p-2 overflow-hidden shadow-inner flex flex-col items-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Receipt Preview</p>
              <div className="w-full border rounded bg-gray-50 flex justify-center overflow-hidden h-[300px] relative">
                <iframe
                  title="Receipt Preview"
                  srcDoc={buildReceiptHtml(completedOrder, template, excRate)}
                  className="w-full h-full border-none"
                  style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Total: <span className="font-bold text-foreground">${finalTotal.toFixed(2)}</span></p>
              {change > 0 && <p>Change: <span className="font-bold text-green-600">${change.toFixed(2)}</span></p>}
              {completedOrder?.customer && <p>Customer: {completedOrder.customer.name}</p>}
            </div>
            <div className="flex flex-col gap-2 w-full">
              {completedOrder && (
                <Button variant="outline" className="w-full" onClick={() => {
                  const printWindow = window.open('', '_blank', 'width=400,height=700')
                  if (printWindow) {
                    printWindow.document.write(buildReceiptHtml(completedOrder, template, excRate))
                    printWindow.document.close()
                    printWindow.focus()
                    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
                  }
                }}>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
              )}
              <Button className="w-full" onClick={handleClose}>New Sale</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )


}
