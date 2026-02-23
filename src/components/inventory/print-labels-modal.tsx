'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'

interface PrintLabelsModalProps {
  product: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PrintLabelsModal({ product, open, onOpenChange }: PrintLabelsModalProps) {
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])

  useEffect(() => {
    if (open && product) {
      setSelectedVariantIds(product.variants.map((v: any) => v.id))
    }
  }, [open, product])

  if (!product) return null

  const handleToggle = (id: string) => {
    setSelectedVariantIds(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const handlePrint = () => {
    if (selectedVariantIds.length === 0) return
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/50 shadow-2xl">
        <DialogHeader className="no-print">
          <DialogTitle>Print Labels - {product.name}</DialogTitle>
        </DialogHeader>

        {/* Scrollable container for preview */}
        <div className="max-h-[60vh] overflow-y-auto p-4 bg-muted/20 rounded-lg no-print">
          <div className="text-sm text-muted-foreground mb-4 font-medium flex justify-between items-center">
            <span>Select the labels you want to print. ({selectedVariantIds.length} of {product.variants.length} selected)</span>
            {selectedVariantIds.length !== product.variants.length ? (
              <Button variant="ghost" size="sm" onClick={() => setSelectedVariantIds(product.variants.map((v: any) => v.id))}>Select All</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setSelectedVariantIds([])}>Deselect All</Button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {product.variants.map((v: any, i: number) => {
              const isSelected = selectedVariantIds.includes(v.id)
              return (
                <div 
                  key={v.id || i} 
                  className={`relative flex flex-col items-center justify-center p-6 bg-white border shadow-sm rounded-lg text-black w-full sm:w-[calc(50%-0.5rem)] max-w-[280px] transition-all cursor-pointer ${
                    isSelected ? 'border-primary ring-1 ring-primary' : 'border-border/50 opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => handleToggle(v.id)}
                >
                  <div className="absolute top-3 right-3 p-1">
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggle(v.id)} />
                  </div>
                  <QRCodeSVG value={v.sku} size={120} level="H" className={!isSelected ? "grayscale" : ""} />
                  <div className="mt-3 font-mono font-bold text-lg tracking-wider text-center">
                    {v.sku}
                  </div>
                  <div className="text-xs text-center text-gray-500 uppercase mt-1">
                    {product.name}
                    {v.size?.name ? ` • ${v.size.name}` : ''}
                    {v.color ? ` • ${v.color}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Printable Area - Only visible during print */}
        <div className="hidden print:flex print:flex-wrap print:justify-center print:absolute print:left-0 print:top-0 print:w-full" id="printable-labels-container">
          <div className="print-grid w-full max-w-4xl mx-auto">
            {product.variants.filter((v:any) => selectedVariantIds.includes(v.id)).map((v: any, i: number) => (
              <div key={`print-${v.id || i}`} className="print-label flex flex-col items-center justify-center mx-auto text-center w-full">
                <QRCodeSVG value={v.sku} size={150} level="H" />
                <div className="print-sku mt-2">{v.sku}</div>
                <div className="print-title mt-1">
                  {product.name}
                  {v.size?.name ? ` - ${v.size.name}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end no-print pt-4">
          <Button onClick={handlePrint} disabled={selectedVariantIds.length === 0} className="w-full sm:w-auto shadow-lg hover:shadow-primary/25 transition-all">
            <Printer className="mr-2 h-4 w-4" /> Print {selectedVariantIds.length} Label{selectedVariantIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
