'use client'

import { getCustomers, deleteCustomer } from '@/actions/orders'
import { getSocialMediaTypes } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { User, Share2, Search, Edit, Trash2, RefreshCw, Settings2, ChevronDown, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
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
import CustomerModal from '@/components/customers/customer-modal'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

export default function CustomersView() {
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)
  const customers       = useAppStore(state => state.customers)
  const setCustomers     = useAppStore(state => state.setCustomers)
  
  const [socialTypes, setSocialTypes]   = useState<any[]>([])
  const [loading, setLoading]           = useState(customers.length === 0)
  const [search, setSearch]             = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const [itemsPerPage]                  = useState(10)
  const [showFilters, setShowFilters]   = useState(false)

  // Filters
  const [filterSocial, setFilterSocial]       = useState('all')
  const [filterPtsMin, setFilterPtsMin]       = useState('')
  const [filterPtsMax, setFilterPtsMax]       = useState('')

  const [visibleColumns, setVisibleColumns] = useState({
    no: true, name: true, contact: true, social: true, loyalty: true,
  })

  const loadCustomers = useCallback(async (isSilent = false) => {
    if (!isSilent && customers.length === 0) setLoading(true)
    const res = await getCustomers()
    if (res.success) setCustomers(res.data || [])
    setLoading(false)
  }, [customers.length, setCustomers])

  useEffect(() => {
    loadCustomers()
    getSocialMediaTypes().then(res => { if (res.success) setSocialTypes(res.data || []) })
  }, [loadCustomers])

  useEffect(() => { setCurrentPage(1) }, [search, filterSocial, filterPtsMin, filterPtsMax])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    const res = await deleteCustomer(id)
    if (res.success) loadCustomers()
    else showGlobalAlert('error', 'Error', res.error || 'Operation failed')
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchSocial = filterSocial === 'all' ||
      c.socialMedia.some((s: any) => s.socialMediaType?.id === filterSocial)
    const pts = c.loyaltyPoints ?? 0
    const matchPtsMin = !filterPtsMin || pts >= parseInt(filterPtsMin)
    const matchPtsMax = !filterPtsMax || pts <= parseInt(filterPtsMax)
    return matchSearch && matchSocial && matchPtsMin && matchPtsMax
  })

  const hasActiveFilters = filterSocial !== 'all' || filterPtsMin || filterPtsMax
  const clearFilters = () => { setFilterSocial('all'); setFilterPtsMin(''); setFilterPtsMax('') }

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedCustomers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-8 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Customers</h2>
          <p className="text-muted-foreground">Manage your relationships and loyalty programs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadCustomers()} disabled={loading}>
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
                  const rows = filtered.map(c => ({
                    'Name': c.name, 'Email': c.email || '', 'Phone': c.phone || '',
                    'Address': c.address || '',
                    'Social Media': c.socialMedia?.map((s: any) => `${s.socialMediaType?.name}: ${s.handle}`).join(', ') || '',
                    'Loyalty Points': c.loyaltyPoints ?? 0,
                  }))
                  const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Customers')
                  XLSX.writeFile(wb, `customers_${new Date().toISOString().split('T')[0]}.xlsx`)
                }}>📊 Excel (.xlsx)</Button>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => {
                  const rows = filtered.map(c => ({
                    'Name': c.name, 'Email': c.email || '', 'Phone': c.phone || '',
                    'Address': c.address || '', 'Loyalty Points': c.loyaltyPoints ?? 0,
                  }))
                  const ws = XLSX.utils.json_to_sheet(rows); const csv = XLSX.utils.sheet_to_csv(ws)
                  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
                }}>📄 CSV (.csv)</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <CustomerModal onSuccess={() => loadCustomers()} />
        </div>
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className="relative shrink-0"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <ChevronDown className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={visibleColumns.no}      onCheckedChange={v => setVisibleColumns(p => ({ ...p, no: v }))}>No.</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.name}    onCheckedChange={v => setVisibleColumns(p => ({ ...p, name: v }))}>Name</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.contact} onCheckedChange={v => setVisibleColumns(p => ({ ...p, contact: v }))}>Contact</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.social}  onCheckedChange={v => setVisibleColumns(p => ({ ...p, social: v }))}>Social Media</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.loyalty} onCheckedChange={v => setVisibleColumns(p => ({ ...p, loyalty: v }))}>Loyalty</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border rounded-lg p-4 bg-muted/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Social Media Type</Label>
                <Select value={filterSocial} onValueChange={setFilterSocial}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {socialTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min Loyalty Pts</Label>
                <Input className="h-8 text-xs" type="number" placeholder="0" value={filterPtsMin} onChange={e => setFilterPtsMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max Loyalty Pts</Label>
                <Input className="h-8 text-xs" type="number" placeholder="∞" value={filterPtsMax} onChange={e => setFilterPtsMax(e.target.value)} />
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground">
                <X className="mr-1 h-3 w-3" /> Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <Table className="hidden md:table min-w-[700px] lg:min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.no      && <TableHead className="w-12 pl-4 sm:pl-6 text-center">No.</TableHead>}
                  {visibleColumns.name    && <TableHead className={!visibleColumns.no ? "pl-4 sm:pl-6" : ""}>Name</TableHead>}
                  {visibleColumns.contact && <TableHead>Contact</TableHead>}
                  {visibleColumns.social  && <TableHead>Social Media</TableHead>}
                  {visibleColumns.loyalty && <TableHead>Loyalty</TableHead>}
                  <TableHead className="text-center pr-4 sm:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} className="h-16 animate-pulse bg-muted/10" /></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No customers found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer, index) => (
                    <TableRow key={customer.id} className="group hover:bg-muted/20">
                      {visibleColumns.no && (
                        <TableCell className="pl-4 sm:pl-6 text-center text-xs text-muted-foreground font-medium w-12">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className={cn("font-medium", !visibleColumns.no && "pl-4 sm:pl-6")}>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0 border border-primary/20">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="truncate">{customer.name}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.contact && (
                        <TableCell>
                          <div className="text-xs font-medium">{customer.email || '-'}</div>
                          <div className="text-xs text-muted-foreground">{customer.phone || '-'}</div>
                        </TableCell>
                      )}
                      {visibleColumns.social && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {customer.socialMedia.map((s: any) => (
                              <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary border border-border/50">
                                <Share2 className="mr-1 h-3 w-3" />
                                {s.socialMediaType.name}: {s.handle}
                              </span>
                            ))}
                            {customer.socialMedia.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.loyalty && (
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-green-500/10 text-green-600 border border-green-500/20">
                            {customer.loyaltyPoints} PTS
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-center pr-4 sm:pr-6">
                        <div className="flex items-center justify-center gap-1">
                          <CustomerModal
                            customer={customer}
                            onSuccess={() => loadCustomers()}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Mobile Card Grid */}
            <div className="md:hidden grid grid-cols-1 gap-3 p-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/20 animate-pulse border" />
                ))
              ) : filtered.length === 0 ? (
                <div className="border rounded-xl h-32 flex items-center justify-center text-muted-foreground p-6 text-center">
                  <p className="text-sm">No customers found.</p>
                </div>
              ) : (
                paginatedCustomers.map((customer) => (
                  <div key={customer.id} className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[15px]">{customer.name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500/10 text-green-600 mt-1">
                            {customer.loyaltyPoints} PTS
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <CustomerModal
                          customer={customer}
                          onSuccess={() => loadCustomers()}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm pl-0 sm:pl-13">
                      {(customer.email || customer.phone) && (
                        <div className="flex flex-col gap-0.5 bg-muted/30 p-2 rounded-md border">
                          {customer.email && <span className="text-xs font-medium truncate">{customer.email}</span>}
                          {customer.phone && <span className="text-xs text-muted-foreground">{customer.phone}</span>}
                        </div>
                      )}
                      
                      {customer.socialMedia.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.socialMedia.map((s: any) => (
                            <span key={s.id} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-secondary border border-border/50">
                              <Share2 className="mr-1.5 h-3 w-3" />
                              {s.socialMediaType.name}: {s.handle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-2 bg-card">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} customers
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
                    return <PaginationItem key={page}><PaginationLink href="#" onClick={e => { e.preventDefault(); setCurrentPage(page) }} isActive={currentPage === page}>{page}</PaginationLink></PaginationItem>
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
    </div>
  )
}
