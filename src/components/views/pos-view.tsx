'use client'

import { getVariantBySKU } from '@/actions/pos'
import Scanner from '@/components/pos/scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CheckoutDialog from '@/components/pos/checkout-dialog'
import { ShoppingCart, Trash2, Plus, Minus, Scan } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'

export default function POSView() {
  const cart = useAppStore((state) => state.cart)
  const addItemToCart = useAppStore((state) => state.addItemToCart)
  const updateQuantity = useAppStore((state) => state.updateQuantity)
  const removeItem = useAppStore((state) => state.removeItem)
  const clearCart = useAppStore((state) => state.clearCart)

  const [manualSku, setManualSku] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)

  const handleAddItem = useCallback(async (sku: string) => {
    const existingItem = cart.find((item) => item.sku === sku)
    if (existingItem) {
      if (existingItem.availableStock !== undefined && existingItem.quantity >= existingItem.availableStock) {
        showGlobalAlert('warning', 'Stock Limit', `Cannot add more. Only ${existingItem.availableStock} in stock.`)
        return
      }
      updateQuantity(sku, 1)
      return
    }

    const result = await getVariantBySKU(sku)
    if (result.success && result.data) {
      const v = result.data
      const totalStock = v.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0
      
      if (totalStock <= 0) {
        showGlobalAlert('warning', 'Out of Stock', `Out of stock! ${sku} has no available inventory.`)
        return
      }

      addItemToCart({
        variantId: v.id,
        sku: v.sku,
        name: v.product.name,
        variantInfo: `${v.size?.name || ''} ${v.colorName || v.color || ''}`.trim(),
        price: Number(v.basePrice),
        costPrice: Number(v.costPrice || 0),
        quantity: 1,
        availableStock: totalStock,
      })
    } else {
      showGlobalAlert('error', 'Not Found', 'Product not found: ' + sku)
    }
  }, [cart, addItemToCart, updateQuantity, showGlobalAlert])

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualSku) {
      handleAddItem(manualSku)
      setManualSku('')
    }
  }

  const handleScanSuccess = useCallback((text: string) => {
    handleAddItem(text)
    setIsScanning(false)
  }, [handleAddItem])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8 min-h-screen animate-in fade-in duration-500 pb-52 lg:pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Register</h2>
        <div className="flex items-center space-x-2">
          <Button variant={isScanning ? "destructive" : "default"} onClick={() => setIsScanning(!isScanning)} size="sm" className="h-10 sm:h-9">
            <Scan className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{isScanning ? "Stop Scanning" : "Start Scanning"}</span>
            <span className="sm:hidden">{isScanning ? "Stop" : "Scan"}</span>
          </Button>
        </div>
      </div>

      <div className="grid flex-1 gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <Card className="flex flex-col h-full min-h-[400px] glass-card">
            <CardHeader className="p-4 border-b border-border/50">
              <CardTitle className="flex items-center text-lg">
                <ShoppingCart className="mr-2 h-5 w-5" /> Current Sale
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 pb-20 lg:pb-0">
              {/* Desktop Table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <ShoppingCart className="h-12 w-12 opacity-20" />
                          <p>No items in cart. Scan or enter SKU to add.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => (
                      <TableRow key={item.sku} className="group transition-colors">
                        <TableCell className="pl-4">
                          <div className="font-medium text-base">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.sku} {item.variantInfo && `• ${item.variantInfo}`}
                          </div>
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.sku, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={() => {
                                if (item.availableStock !== undefined && item.quantity >= item.availableStock) {
                                  showGlobalAlert('warning', 'Stock Limit', `Cannot add more. Only ${item.availableStock} in stock.`)
                                } else {
                                  updateQuantity(item.sku, 1)
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-base">
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="pr-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(item.sku)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Mobile Card List */}
              <div className="md:hidden flex flex-col gap-3 p-3 pt-4">
                {cart.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <ShoppingCart className="h-10 w-10 opacity-20" />
                    <p className="text-sm">No items in cart.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.sku} className="bg-card/50 border rounded-xl p-3 shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-2 truncate">
                          <h4 className="font-semibold text-[15px] truncate">{item.name}</h4>
                          <p className="text-[11px] text-muted-foreground truncate w-full">
                            {item.sku} {item.variantInfo && `• ${item.variantInfo}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-primary">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            ${item.price.toFixed(2)} ea
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2 mt-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-full" onClick={() => removeItem(item.sku)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center space-x-3 bg-muted/30 rounded-full p-0.5 border">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.sku, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => {
                              if (item.availableStock !== undefined && item.quantity >= item.availableStock) {
                                showGlobalAlert('warning', 'Stock Limit', `Cannot add more.`)
                              } else {
                                updateQuantity(item.sku, 1)
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          {isScanning && (
            <Card className="glass-card border-primary/50 overflow-hidden">
              <CardHeader className="p-4 bg-primary/5">
                <CardTitle className="text-sm font-bold flex items-center">
                  <Scan className="mr-2 h-4 w-4 animate-pulse" /> Live Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Scanner onScanSuccess={handleScanSuccess} />
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Add Item</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <Input 
                  placeholder="SKU..." 
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="h-11 sm:h-9 focus-visible:ring-primary text-base sm:text-sm" // Increased touch target and prevented iOS zoom
                />
                <Button type="submit" size="sm" className="h-11 sm:h-9 px-6 sm:px-4 bg-primary hover:bg-primary/90 font-semibold">Add</Button>
              </form>
            </CardContent>
          </Card>

          <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-[19] sm:bottom-0 sm:p-0 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-none">
            <Card className="bg-primary text-primary-foreground shadow-2xl border-none">
              <CardHeader className="hidden sm:block p-4 pb-2">
                <CardTitle className="text-sm font-medium opacity-80 text-center uppercase tracking-[0.2em]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:pt-0 space-y-4 sm:space-y-6 text-center">
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center py-0 sm:py-4">
                  <span className="text-sm sm:text-xs font-bold sm:normal-case uppercase sm:opacity-70 mb-0 sm:mb-1 block">Total</span>
                  <span className="text-3xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tight">
                    <span className="text-xl sm:text-2xl font-normal opacity-70 mr-1">$</span>
                    {total.toFixed(2)}
                  </span>
                </div>
                <CheckoutDialog 
                  total={total} 
                  items={cart.map(i => ({ variantId: i.variantId, quantity: i.quantity, price: i.price, costPrice: i.costPrice }))}
                  onSuccess={() => clearCart()}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
