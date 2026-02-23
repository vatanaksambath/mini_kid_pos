'use client'

import { createProduct, updateProduct, generateUniqueSku } from '@/actions/inventory'
import { getCategories, getBrands, getSizes, getColors } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/use-app-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Package, X, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Variant {
  id?: string
  sku: string
  sizeId: string
  color: string
  priceOverride: string
  basePrice: string
  quantity: string
}

interface ProductModalProps {
  product?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function ProductModal({ product, open: externalOpen, onOpenChange, trigger, onSuccess }: ProductModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)

  // Refs
  const variantScrollRef = useRef<HTMLDivElement>(null)

  // Settings Data
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Product State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Variants State
  const [variants, setVariants] = useState<Variant[]>([
    { sku: '', sizeId: '', color: '#000000', priceOverride: '', basePrice: '', quantity: '' },
  ])

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setDescription(product.description || '')
      setStockDate(product.stockDate ? new Date(product.stockDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'))
      setCategoryId(product.categoryId || '')
      setBrandId(product.brandId || '')
      
      // Parse existing imageUrl string into an array
      let parsedImages: string[] = []
      if (product.imageUrl) {
        try {
          const parsed = JSON.parse(product.imageUrl)
          if (Array.isArray(parsed)) {
            parsedImages = parsed
          } else {
            parsedImages = [product.imageUrl]
          }
        } catch (e) {
          parsedImages = [product.imageUrl]
        }
      }
      setImageUrls(parsedImages)

      setVariants(product.variants.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        sizeId: v.sizeId || '',
        color: v.color || '#000000',
        priceOverride: v.priceOverride?.toString() || '',
        basePrice: v.basePrice?.toString() || '',
        quantity: v.inventory?.reduce((acc: number, curr: any) => acc + curr.quantity, 0).toString() || '0',
      })))
    } else if (open) {
      resetForm()
      generateUniqueSku().then(res => {
        if (res.success && res.sku) {
          setVariants([{ sku: res.sku, sizeId: '', color: '#000000', priceOverride: '', basePrice: '', quantity: '' }])
        }
      })
    }
  }, [product, open])

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [catRes, brandRes, sizeRes, colorRes] = await Promise.all([getCategories(), getBrands(), getSizes(), getColors()])
        if (catRes.success) setCategories(catRes.data || [])
        if (brandRes.success) setBrands(brandRes.data || [])
        if (sizeRes.success) setSizes(sizeRes.data || [])
        if (colorRes.success) setColors(colorRes.data || [])
      }
      fetchData()
    }
  }, [open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImages: string[] = []
    let loadedCount = 0

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        loadedCount++
        if (loadedCount === files.length) {
          setImageUrls((prev) => [...prev, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariant = async () => {
    const res = await generateUniqueSku()
    const newSku = res.success && res.sku ? res.sku : `SKU-${Math.floor(100000 + Math.random() * 900000)}`
    setVariants([...variants, { sku: newSku, sizeId: '', color: '#000000', priceOverride: '', basePrice: '', quantity: '' }])
  }

  // Auto-scroll variant table to bottom when a new row is added
  useEffect(() => {
    if (variantScrollRef.current && variants.length > 1) {
      variantScrollRef.current.scrollTo({ top: variantScrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [variants.length])

  const removeVariant = (index: number) => {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return alert('Name is required')

    const formattedVariants = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeId: v.sizeId === 'none' || v.sizeId === '' ? undefined : v.sizeId,
      color: v.color,
      priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : undefined,
      basePrice: parseFloat(v.basePrice) || 0,
      quantity: parseInt(v.quantity) || 0,
    }))

    startTransition(async () => {
      try {
        let result
        const payloadImageUrl = imageUrls.length > 0 ? JSON.stringify(imageUrls) : ''
        const payloadStockDate = stockDate ? new Date(stockDate).toISOString() : new Date().toISOString()

        if (product) {
          result = await updateProduct(product.id, {
            name,
            description,
            stockDate: payloadStockDate,
            categoryId: categoryId === 'none' ? undefined : categoryId,
            brandId: brandId === 'none' ? undefined : brandId,
            imageUrl: payloadImageUrl,
            variants: formattedVariants,
          })
        } else {
          result = await createProduct({
            name,
            description,
            stockDate: payloadStockDate,
            categoryId: categoryId === 'none' ? undefined : categoryId,
            brandId: brandId === 'none' ? undefined : brandId,
            imageUrl: payloadImageUrl,
            variants: formattedVariants,
          })
        }
        
        if (result.success) {
          showGlobalAlert('success', 'Success', `Product ${product ? 'updated' : 'created'} successfully.`)
          setOpen(false)
          resetForm()
          if (onSuccess) onSuccess()
          router.refresh()
        } else {
          showGlobalAlert('error', 'Action Failed', result.error || 'Failed to save product.')
        }
      } catch (err: any) {
        showGlobalAlert('error', 'Error', err.message || 'An unexpected error occurred.')
      }
    })
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setStockDate(new Date().toISOString().split('T')[0])
    setCategoryId('')
    setBrandId('')
    setImageUrls([])
    setVariants([{ sku: '', sizeId: '', color: '#000000', priceOverride: '', basePrice: '', quantity: '' }])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-4xl w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Product Name + Stock Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Silk Dress" required />
            </div>
            <div className="space-y-2">
              <Label>Stock Date</Label>
              <Input type="date" value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
            </div>
          </div>

          {/* Row 2: Category + Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." className="resize-y" />
          </div>

          {/* Row 4: Product Images */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            {/* Drag-and-drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/20"
              )}
              onClick={() => document.getElementById('image-upload-input')?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false)
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                if (files.length === 0) return
                const newImages: string[] = []
                let loaded = 0
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    newImages.push(reader.result as string)
                    loaded++
                    if (loaded === files.length) setImageUrls(prev => [...prev, ...newImages])
                  }
                  reader.readAsDataURL(file)
                })
              }}
            >
              <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Click to upload or drag &amp; drop</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WEBP (multiple files allowed)</p>
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {/* Thumbnail previews */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${i}`}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(url)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 sm:p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="font-semibold flex items-center text-sm sm:text-base">
                <Package className="mr-2 h-4 w-4" /> Variants & Inventory
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>
            <div ref={variantScrollRef} className="overflow-x-auto overflow-y-auto -mx-3 sm:mx-0 max-h-64">
              <Table className="min-w-[600px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm px-2">SKU</TableHead>
                    <TableHead className="text-xs sm:text-sm px-2">Size</TableHead>
                    <TableHead className="text-xs sm:text-sm px-2">Color</TableHead>
                    <TableHead className="text-xs sm:text-sm px-2">Price</TableHead>
                    <TableHead className="text-xs sm:text-sm px-2">Stock</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-2 sm:p-4">
                        <Input className="h-8 text-xs min-w-[100px] bg-muted" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} required disabled placeholder="SKU-123" />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Select value={v.sizeId} onValueChange={(val) => updateVariant(i, 'sizeId', val)}>
                          <SelectTrigger className="h-8 w-20 sm:w-24 text-xs">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">N/A</SelectItem>
                            {sizes.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        {colors.length > 0 ? (
                          <Select value={v.color} onValueChange={(val) => updateVariant(i, 'color', val)}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <div className="flex items-center gap-2">
                                {v.color && v.color !== 'none' && (
                                  <div className="h-3.5 w-3.5 rounded-full border shrink-0" style={{ backgroundColor: v.color }} />
                                )}
                                <SelectValue placeholder="Color" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {colors.map(c => (
                                <SelectItem key={c.id} value={c.hex}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: c.hex }} />
                                    {c.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: v.color }} />
                            <input type="color" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer rounded-full overflow-hidden shrink-0" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Input className="h-8 w-24 text-xs" type="number" step="0.01" value={v.basePrice} onChange={(e) => updateVariant(i, 'basePrice', e.target.value)} required placeholder="0.00" />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Input className="h-8 w-20 text-xs" type="number" value={v.quantity} onChange={(e) => updateVariant(i, 'quantity', e.target.value)} required min="0" />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 text-right">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" onClick={() => removeVariant(i)} disabled={variants.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-1 bg-transparent border-none shadow-none text-center z-[100]">
          <DialogTitle className="sr-only">Product Image Preview</DialogTitle>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Product Preview" 
              className="max-h-[85vh] max-w-full mx-auto rounded-lg shadow-2xl object-contain bg-background" 
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
