'use client'

import { getProducts, deleteProduct } from '@/actions/inventory'
import { getCategories, getBrands } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import ProductModal from '@/components/inventory/product-modal'
import PrintLabelsModal from '@/components/inventory/print-labels-modal'
import { useEffect, useState, useCallback } from 'react'
import { Package, Search, Edit, Trash2, RefreshCw, QrCode, Settings2, Eye, ChevronDown, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi,
} from '@/components/ui/carousel'
import {
  Dialog, DialogContent, DialogTitle, DialogHeader,
} from '@/components/ui/dialog'

export default function InventoryView() {
  const [products, setProducts]         = useState<any[]>([])
  const [categories, setCategories]     = useState<any[]>([])
  const [brands, setBrands]             = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [printProduct, setPrintProduct] = useState<any | null>(null)
  const [viewProduct, setViewProduct]   = useState<any | null>(null)
  const [currentPage, setCurrentPage]   = useState(1)
  const [itemsPerPage]                  = useState(10)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [api, setApi]                   = useState<CarouselApi>()

  // Filters
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterBrand, setFilterBrand]       = useState('all')
  const [filterStockMin, setFilterStockMin] = useState('')
  const [filterStockMax, setFilterStockMax] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo]     = useState('')
  const [showFilters, setShowFilters]       = useState(false)

  const [visibleColumns, setVisibleColumns] = useState({
    no: true, image: true, info: true, brand: true, category: true, stock: true, stockDate: true,
  })

  // Keyboard nav for image slider
  useEffect(() => {
    if (!api || previewImages.length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') api.scrollPrev()
      if (e.key === 'ArrowRight') api.scrollNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [api, previewImages])

  const loadProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const res = await getProducts()
    if (res.success) setProducts(res.data || [])
    else setError(res.error || 'Failed to load inventory')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
    Promise.all([getCategories(), getBrands()]).then(([catRes, brandRes]) => {
      if (catRes.success) setCategories(catRes.data || [])
      if (brandRes.success) setBrands(brandRes.data || [])
    })
  }, [loadProducts])

  useEffect(() => { setCurrentPage(1) }, [search, filterCategory, filterBrand, filterStockMin, filterStockMax, filterDateFrom, filterDateTo])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and all its variants?')) return
    const res = await deleteProduct(id)
    if (res.success) loadProducts(true)
    else alert(res.error)
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.categoryId === filterCategory
    const matchBrand    = filterBrand === 'all'    || p.brandId === filterBrand
    const totalStock    = p.variants.reduce((acc: number, v: any) =>
      acc + (v.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0), 0)
    const matchStockMin = !filterStockMin || totalStock >= parseInt(filterStockMin)
    const matchStockMax = !filterStockMax || totalStock <= parseInt(filterStockMax)
    const matchDateFrom = !filterDateFrom || (p.stockDate && new Date(p.stockDate) >= new Date(filterDateFrom))
    const matchDateTo   = !filterDateTo   || (p.stockDate && new Date(p.stockDate) <= new Date(filterDateTo + 'T23:59:59'))
    return matchSearch && matchCategory && matchBrand && matchStockMin && matchStockMax && matchDateFrom && matchDateTo
  })

  const hasActiveFilters = filterCategory !== 'all' || filterBrand !== 'all' || filterStockMin || filterStockMax || filterDateFrom || filterDateTo

  const clearFilters = () => {
    setFilterCategory('all'); setFilterBrand('all')
    setFilterStockMin(''); setFilterStockMax('')
    setFilterDateFrom(''); setFilterDateTo('')
  }

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const parseImages = (imageUrl: string | null) => {
    if (!imageUrl) return { firstImage: null, extraCount: 0, allImages: [] }
    try {
      const parsed = JSON.parse(imageUrl)
      if (Array.isArray(parsed) && parsed.length > 0)
        return { firstImage: parsed[0], extraCount: parsed.length - 1, allImages: parsed }
    } catch { /* legacy string */ }
    return { firstImage: imageUrl, extraCount: 0, allImages: [imageUrl] }
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Package className="mr-3 h-8 w-8 opacity-50" /> Inventory
          </h2>
          <p className="text-muted-foreground">Manage your product catalog and stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadProducts(true)} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Download as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col p-1 gap-1">
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => {
                  const rows = filteredProducts.flatMap(p => p.variants.map((v: any) => ({
                    'Product': p.name, 'Brand': p.brand?.name || '', 'Category': p.category?.name || '',
                    'SKU': v.sku, 'Color': v.color, 'Size': v.size?.name || '',
                    'Price ($)': Number(v.basePrice).toFixed(2),
                    'Stock': v.inventory?.reduce((a: number, i: any) => a + i.quantity, 0) || 0,
                    'Stock Date': p.stockDate || '',
                  })))
                  const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
                  XLSX.writeFile(wb, `inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
                }}>📊 Excel (.xlsx)</Button>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => {
                  const rows = filteredProducts.flatMap(p => p.variants.map((v: any) => ({
                    'Product': p.name, 'Brand': p.brand?.name || '', 'Category': p.category?.name || '',
                    'SKU': v.sku, 'Price ($)': Number(v.basePrice).toFixed(2),
                    'Stock': v.inventory?.reduce((a: number, i: any) => a + i.quantity, 0) || 0,
                  })))
                  const ws = XLSX.utils.json_to_sheet(rows); const csv = XLSX.utils.sheet_to_csv(ws)
                  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
                }}>📄 CSV (.csv)</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ProductModal onSuccess={() => loadProducts(true)} />
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="p-4 border-b border-border/50 space-y-3">
          {/* Search & View Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(v => !v)}
                className="relative"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="mr-2 h-4 w-4" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={visibleColumns.no}       onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, no: v }))}>No.</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.image}    onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, image: v }))}>Image</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.info}     onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, info: v }))}>Product Info</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.brand}    onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, brand: v }))}>Brand</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.category} onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, category: v }))}>Category</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.stock}    onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, stock: v }))}>Stock</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visibleColumns.stockDate}onCheckedChange={(v) => setVisibleColumns(p => ({ ...p, stockDate: v }))}>Stock Date</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 bg-muted/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <Select value={filterBrand} onValueChange={setFilterBrand}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min Stock</Label>
                  <Input className="h-8 text-xs" type="number" placeholder="0" value={filterStockMin} onChange={e => setFilterStockMin(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Stock</Label>
                  <Input className="h-8 text-xs" type="number" placeholder="∞" value={filterStockMax} onChange={e => setFilterStockMax(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stock Date From</Label>
                  <Input className="h-8 text-xs" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stock Date To</Label>
                  <Input className="h-8 text-xs" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground">
                  <X className="mr-1 h-3 w-3" /> Clear filters
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {visibleColumns.no       && <TableHead className="w-12 pl-4 text-center">No.</TableHead>}
                {visibleColumns.image    && <TableHead className="w-20 pl-4">Image</TableHead>}
                {visibleColumns.info     && <TableHead>Product Info</TableHead>}
                {visibleColumns.brand    && <TableHead>Brand</TableHead>}
                {visibleColumns.category && <TableHead>Category</TableHead>}
                {visibleColumns.stock    && <TableHead>Stock</TableHead>}
                {visibleColumns.stockDate && <TableHead>Stock Date</TableHead>}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && products.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8} className="h-16 animate-pulse bg-muted/10" /></TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product, index) => {
                  const { firstImage, extraCount, allImages } = parseImages(product.imageUrl)
                  const totalStock = product.variants.reduce((acc: number, v: any) =>
                    acc + (v.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0), 0)
                  const isLowStock = totalStock < 10

                  return (
                    <TableRow key={product.id} className="group">
                      {visibleColumns.no && (
                        <TableCell className="pl-4 text-center text-xs text-muted-foreground font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                      )}
                      {visibleColumns.image && (
                        <TableCell className="pl-4">
                          {firstImage ? (
                            <div className="relative group/img w-max">
                              <img
                                src={firstImage}
                                alt={product.name}
                                className="h-12 w-12 object-cover rounded-lg shadow-sm border border-border/50 hover:opacity-80 transition-opacity cursor-pointer"
                                onClick={() => setPreviewImages(allImages)}
                              />
                              {extraCount > 0 && (
                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                  +{extraCount}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground border border-dashed">No Img</div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.info && (
                        <TableCell>
                          <div className="font-bold">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px] mb-1">{product.description}</div>
                          )}
                          <div className="text-[10px] text-primary/80 uppercase font-black tracking-tighter bg-primary/10 inline-block px-1.5 py-0.5 rounded">
                            {product.variants.length} Variants
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.brand && (
                        <TableCell>
                          <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase">
                            {product.brand?.name || 'Generic'}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.category && <TableCell className="text-sm">{product.category?.name || '-'}</TableCell>}
                      {visibleColumns.stock && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full", isLowStock ? "bg-orange-500" : "bg-primary")} style={{ width: `${Math.min(100, (totalStock / 50) * 100)}%` }} />
                            </div>
                            <span className={cn("text-[10px] font-black uppercase", isLowStock ? "text-orange-500" : "text-primary")}>
                              {totalStock} In Stock
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.stockDate && (
                        <TableCell className="text-sm">
                          {product.stockDate ? new Date(product.stockDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setViewProduct(product)} title="View Product">
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10" onClick={() => setPrintProduct(product)} title="Print QR Labels">
                            <QrCode className="h-4 w-4 text-blue-500" />
                          </Button>
                          <ProductModal
                            product={product}
                            onSuccess={() => loadProducts(true)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" title="Edit Product">
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(product.id)} title="Delete Product">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)) }}
                    aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return <PaginationItem key={page}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page) }} isActive={currentPage === page}>{page}</PaginationLink></PaginationItem>
                  }
                  if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                    return <PaginationItem key={page}><span className="px-4 py-2">...</span></PaginationItem>
                  }
                  return null
                })}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)) }}
                    aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* View Product Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {viewProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {viewProduct && (() => {
            const { allImages } = parseImages(viewProduct.imageUrl)
            const totalStock = viewProduct.variants.reduce((acc: number, v: any) =>
              acc + (v.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0), 0)
            return (
              <div className="space-y-4 py-2">
                {allImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allImages.map((src: string, i: number) => (
                      <img key={i} src={src} alt={`Product ${i}`} className="h-24 w-24 object-cover rounded-lg border shadow-sm" />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium ml-1">{viewProduct.category?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Brand:</span> <span className="font-medium ml-1">{viewProduct.brand?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Total Stock:</span> <span className="font-medium ml-1">{totalStock}</span></div>
                  <div><span className="text-muted-foreground">Stock Date:</span> <span className="font-medium ml-1">{viewProduct.stockDate ? new Date(viewProduct.stockDate).toLocaleDateString() : '—'}</span></div>
                </div>
                {viewProduct.description && <p className="text-sm text-muted-foreground border-t pt-3">{viewProduct.description}</p>}
                {viewProduct.variants.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2 font-semibold">SKU</th>
                          <th className="text-left p-2 font-semibold">Size</th>
                          <th className="text-left p-2 font-semibold">Color</th>
                          <th className="text-right p-2 font-semibold">Price</th>
                          <th className="text-right p-2 font-semibold">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewProduct.variants.map((v: any) => {
                          const qty = v.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
                          return (
                            <tr key={v.id} className="border-t">
                              <td className="p-2 font-mono">{v.sku}</td>
                              <td className="p-2">{v.size?.name || '—'}</td>
                              <td className="p-2">
                                {v.color ? <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border inline-block" style={{ backgroundColor: v.color }} />{v.color}</span> : '—'}
                              </td>
                              <td className="p-2 text-right">${Number(v.basePrice).toFixed(2)}</td>
                              <td className="p-2 text-right">{qty}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Image Preview Carousel */}
      <Dialog open={previewImages.length > 0} onOpenChange={(open) => !open && setPreviewImages([])}>
        <DialogContent className="max-w-4xl p-1 sm:p-4 bg-transparent border-none shadow-none text-center outline-none">
          <DialogTitle className="sr-only">Product Image Preview</DialogTitle>
          {previewImages.length > 0 && (
            <Carousel setApi={setApi} className="w-full max-w-3xl mx-auto">
              <CarouselContent>
                {previewImages.map((src, index) => (
                  <CarouselItem key={index} className="flex items-center justify-center">
                    <img src={src} alt={`Preview ${index + 1}`} className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {previewImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-0 xl:-left-12 bg-background/50 hover:bg-background border-none" />
                  <CarouselNext className="right-0 xl:-right-12 bg-background/50 hover:bg-background border-none" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>

      <PrintLabelsModal
        product={printProduct}
        open={!!printProduct}
        onOpenChange={(open) => !open && setPrintProduct(null)}
      />
    </div>
  )
}
