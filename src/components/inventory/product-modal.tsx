'use client'

import { createProduct, updateProduct, generateUniqueSku } from '@/actions/inventory'
import { getCategories, getBrands, getSizes, getColors, getProductSources } from '@/actions/settings'
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
import { supabase } from '@/lib/supabase'

interface Variant {
  id?: string
  sku: string
  sizeId: string
  color: string
  priceOverride: string
  basePrice: string
  costPrice: string
  quantity: string
}

interface ProductModalProps {
  product?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface ProductImage {
  type: 'existing' | 'new'
  url: string // existing URL or object URL for preview
  file?: File
}

export default function ProductModal({ product, open: externalOpen, onOpenChange, trigger, onSuccess }: ProductModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
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
  const [sources, setSources] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Product State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [images, setImages] = useState<ProductImage[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Variants State
  const [variants, setVariants] = useState<Variant[]>([
    { sku: '', sizeId: '', color: '#000000', priceOverride: '', basePrice: '', costPrice: '', quantity: '' },
  ])

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setDescription(product.description || '')
      setStockDate(product.stockDate ? new Date(product.stockDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'))
      setCategoryId(product.categoryId || '')
      setBrandId(product.brandId || '')
      setSourceId(product.sourceId || '')
      
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
      setImages(parsedImages.map(url => ({ type: 'existing', url })))

      setVariants(product.variants.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        sizeId: v.sizeId || '',
        color: v.color || '#000000',
        priceOverride: v.priceOverride?.toString() || '',
        basePrice: v.basePrice?.toString() || '',
        costPrice: v.costPrice?.toString() || '',
        quantity: v.inventory?.reduce((acc: number, curr: any) => acc + curr.quantity, 0).toString() || '0',
      })))
    } else if (open) {
      resetForm()
      generateUniqueSku().then(res => {
        if (res.success && res.sku) {
          setVariants([{ sku: res.sku, sizeId: '', color: '#000000', priceOverride: '', basePrice: '', costPrice: '', quantity: '' }])
        }
      })
    }
  }, [product, open])

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [catRes, brandRes, sizeRes, colorRes, sourceRes] = await Promise.all([
          getCategories(), getBrands(), getSizes(), getColors(), getProductSources()
        ])
        if (catRes.success) setCategories(catRes.data || [])
        if (brandRes.success) setBrands(brandRes.data || [])
        if (sizeRes.success) setSizes(sizeRes.data || [])
        if (colorRes.success) setColors(colorRes.data || [])
        if (sourceRes.success) setSources(sourceRes.data || [])
      }
      fetchData()
    }
  }, [open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImageObjs: ProductImage[] = files.map(file => ({
      type: 'new',
      url: URL.createObjectURL(file), // create temporary preview URL
      file
    }))
    
    setImages((prev) => [...prev, ...newImageObjs])
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const img = prev[index]
      if (img.type === 'new') {
        URL.revokeObjectURL(img.url) // Clean up memory
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const addVariant = async () => {
    const res = await generateUniqueSku()
    const newSku = res.success && res.sku ? res.sku : `SKU-${Math.floor(100000 + Math.random() * 900000)}`
    setVariants([...variants, { sku: newSku, sizeId: '', color: '#000000', priceOverride: '', basePrice: '', costPrice: '', quantity: '' }])
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

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            },
            'image/jpeg',
            0.7
          )
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return showGlobalAlert('warning', 'Validation Error', 'Name is required')

    const formattedVariants = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeId: v.sizeId === 'none' || v.sizeId === '' ? undefined : v.sizeId,
      color: v.color,
      priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : undefined,
      basePrice: parseFloat(v.basePrice) || 0,
      costPrice: parseFloat(v.costPrice) || 0,
      quantity: parseInt(v.quantity) || 0,
    }))

    startTransition(async () => {
      try {
        setIsUploading(true)
        // Upload new images to Supabase Storage
        const finalImageUrls: string[] = []
        for (const img of images) {
          if (img.type === 'existing') {
            finalImageUrls.push(img.url)
          } else if (img.type === 'new' && img.file) {
            // Compress image before upload
            const compressedBlob = await compressImage(img.file)
            const fileExt = 'jpg' // Canvas toBlob uses jpg
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
              .from('products')
              .upload(fileName, compressedBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/jpeg'
              })

            if (uploadError) {
              console.error('Image upload failed', uploadError)
              throw new Error(`Failed to upload ${img.file.name}: ${uploadError.message}`)
            }

            const { data } = supabase.storage.from('products').getPublicUrl(fileName)
            finalImageUrls.push(data.publicUrl)
          }
        }
        setIsUploading(false)

        let result
        const payloadImageUrl = finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : ''
        const payloadStockDate = stockDate ? new Date(stockDate).toISOString() : new Date().toISOString()

        if (product) {
          result = await updateProduct(product.id, {
            name,
            description,
            stockDate: payloadStockDate,
            categoryId: categoryId === 'none' ? undefined : categoryId,
            brandId: brandId === 'none' ? undefined : brandId,
            sourceId: sourceId === 'none' ? undefined : sourceId,
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
            sourceId: sourceId === 'none' ? undefined : sourceId,
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
        setIsUploading(false)
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
    setSourceId('')
    images.forEach(img => { if (img.type === 'new') URL.revokeObjectURL(img.url) })
    setImages([])
    setVariants([{ sku: '', sizeId: '', color: '#000000', priceOverride: '', basePrice: '', costPrice: '', quantity: '' }])
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
      <DialogContent className="sm:max-w-4xl w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] rounded-none sm:rounded-lg p-0 sm:p-6 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-0 border-b sm:border-none shrink-0 relative pr-10">
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-0 pb-36 sm:pb-0">
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 sm:pt-0">
            {/* Row 1: Product Name + Stock Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Silk Dress" required className="h-11 sm:h-9" />
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

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                
                const newImageObjs: ProductImage[] = files.map(file => ({
                  type: 'new',
                  url: URL.createObjectURL(file),
                  file
                }))
                
                setImages(prev => [...prev, ...newImageObjs])
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
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.url}
                      alt={`Preview ${i}`}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(img.url)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {img.type === 'new' && (
                      <div className="absolute bottom-1 right-1 bg-primary text-[8px] font-bold text-primary-foreground px-1 py-0.5 rounded shadow">
                        NEW
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 sm:p-4 space-y-4 mb-4 sm:mb-0 bg-muted/5 sm:bg-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center text-sm sm:text-base">
                <Package className="mr-2 h-4 w-4" /> Variants & Inventory
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full sm:w-auto h-11 sm:h-9">
                <Plus className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>
            <div ref={variantScrollRef} className="overflow-x-auto overflow-y-auto -mx-3 sm:mx-0 max-h-64 hidden md:block">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm px-2">SKU</TableHead>
                    <TableHead className="text-sm px-2">Size</TableHead>
                    <TableHead className="text-sm px-2">Color</TableHead>
                    <TableHead className="text-sm px-2">Cost Price</TableHead>
                    <TableHead className="text-sm px-2">Selling Price</TableHead>
                    <TableHead className="text-sm px-2">Stock</TableHead>
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
                          <SelectTrigger className="h-8 w-24 text-xs">
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
                              <div className="flex flex-1 items-center gap-2 min-w-0 pr-1">
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
                        <Input className="h-8 w-24 text-xs" type="number" step="0.01" value={v.costPrice} onChange={(e) => updateVariant(i, 'costPrice', e.target.value)} required placeholder="0.00" />
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

            {/* Mobile Stacked Variant Cards */}
            <div className="md:hidden flex flex-col gap-4 mt-2">
              {variants.map((v, i) => (
                <div key={i} className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
                  {/* Card Header */}
                  <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Variant {i + 1}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-red-500 hover:bg-red-500/10" 
                      onClick={() => removeVariant(i)} 
                      disabled={variants.length === 1}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-3 grid grid-cols-2 gap-3 gap-y-4">
                    <div className="col-span-2">
                       <Label className="text-xs text-muted-foreground mb-1 block">SKU (Auto)</Label>
                       <Input className="h-10 text-sm bg-muted/50 font-mono" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} required disabled placeholder="SKU-123" />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Size</Label>
                      <Select value={v.sizeId} onValueChange={(val) => updateVariant(i, 'sizeId', val)}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">N/A</SelectItem>
                          {sizes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
                      {colors.length > 0 ? (
                          <Select value={v.color} onValueChange={(val) => updateVariant(i, 'color', val)}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="Color" />
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
                          <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                            <div className="w-5 h-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: v.color }} />
                            <input type="color" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} className="w-full h-8 opacity-0 absolute cursor-pointer" />
                            <span className="text-sm truncate uppercase">{v.color || 'Pick color'}</span>
                          </div>
                        )}
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Cost Price ($)</Label>
                      <Input className="h-10 text-sm" type="number" step="0.01" value={v.costPrice} onChange={(e) => updateVariant(i, 'costPrice', e.target.value)} required placeholder="0.00" />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Selling Price ($)</Label>
                      <Input className="h-10 text-sm" type="number" step="0.01" value={v.basePrice} onChange={(e) => updateVariant(i, 'basePrice', e.target.value)} required placeholder="0.00" />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Initial Stock</Label>
                      <Input className="h-10 text-sm" type="number" value={v.quantity} onChange={(e) => updateVariant(i, 'quantity', e.target.value)} required min="0" placeholder="0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile sticky footer */}
          <div className="fixed sm:relative bottom-0 left-0 right-0 p-4 sm:p-0 bg-background/95 backdrop-blur border-t sm:border-none sm:bg-transparent z-20 flex flex-col sm:flex-row gap-2 mt-auto sm:mt-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] sm:shadow-none">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto h-11 sm:h-9">Cancel</Button>
            <Button type="submit" disabled={isPending || isUploading} className="w-full sm:w-auto h-11 sm:h-9 font-semibold">
              {isUploading ? 'Uploading...' : isPending ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
        </div>
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
