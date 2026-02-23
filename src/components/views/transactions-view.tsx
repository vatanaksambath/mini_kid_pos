'use client'
import React, { useEffect, useState, useCallback } from 'react'

import { getOrders, updateOrderStatus } from '@/actions/orders'
import { getReceiptTemplate } from '@/actions/settings'
import { buildReceiptHtml } from '@/lib/receipt-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { ShoppingBag, Download, RefreshCw, Search, Settings2, ChevronDown, ChevronRight, X, Printer, Eye, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

const PAYMENT_METHODS = ['CASH', 'CARD', 'GIFT_CARD', 'MOBILE_PAYMENT', 'BANK_TRANSFER']

export default function TransactionsView() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [template, setTemplate] = useState<any>(null)
  const [excRate, setExcRate] = useState(4100)
  const [previewOrder, setPreviewOrder] = useState<any>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const [visibleColumns, setVisibleColumns] = useState({
    no: true, orderNo: true, date: true, customer: true,
    items: true, status: true, total: true, discount: true, payment: true,
  })

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const [ordersRes, tmplRes] = await Promise.all([
      getOrders(),
      getReceiptTemplate()
    ])
    if (ordersRes.success) setOrders(ordersRes.data || [])
    if (tmplRes.success && tmplRes.data) {
      setTemplate(tmplRes.data)
      setExcRate(tmplRes.data.exchangeRate || 4100)
    }
    setLoading(false)
  }, [])

  useEffect(() => { 
    load()
    const timer = setInterval(() => load(true), 30000) // Auto refresh every 30s
    return () => clearInterval(timer)
  }, [load])
  useEffect(() => { setCurrentPage(1) }, [search, filterDateFrom, filterDateTo, filterPayment, filterCustomer])

  const uniqueCustomers = Array.from(new Set(orders.map(o => o.customer?.name).filter(Boolean)))
  const hasActiveFilters = filterDateFrom || filterDateTo || filterPayment !== 'all' || filterCustomer !== 'all'
  const clearFilters = () => { setFilterDateFrom(''); setFilterDateTo(''); setFilterPayment('all'); setFilterCustomer('all') }

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase())
    const orderDate = new Date(o.createdAt)
    const matchFrom = !filterDateFrom || orderDate >= new Date(filterDateFrom)
    const matchTo = !filterDateTo || orderDate <= new Date(filterDateTo + 'T23:59:59')
    const matchPayment = filterPayment === 'all' || o.payments?.some((p: any) => p.paymentMethod === filterPayment)
    const matchCustomer = filterCustomer === 'all' || o.customer?.name === filterCustomer
    return matchSearch && matchFrom && matchTo && matchPayment && matchCustomer
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const exportData = () => filtered.map((o, idx) => ({
    'No.': idx + 1,
    'Order #': o.orderNumber?.substring(0, 8).toUpperCase(),
    'Date': new Date(o.createdAt).toLocaleString(),
    'Customer': o.customer?.name || 'Walk-in',
    'Items': o.items?.map((i: any) => `${i.variant?.product?.name || i.variant?.sku} x${i.quantity}${i.description ? ` (${i.description})` : ''}`).join(', ') || '',
    'Status': o.status === 'COMPLETED' ? 'Paid' : o.status === 'PENDING' ? 'Unpaid' : o.status,
    'Total ($)': Number(o.totalAmount).toFixed(2),
    'Discount ($)': Number(o.discountAmount || 0).toFixed(2),
    'Payment': o.payments?.[0]?.paymentMethod || '—',
    'Location': o.location?.name || '—',
  }))

  const downloadXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(exportData())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const downloadCsv = () => {
    const ws = XLSX.utils.json_to_sheet(exportData())
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" /> Transactions
          </h2>
          <p className="text-muted-foreground">Full history of all sales orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Download as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col p-1 gap-1">
                <Button variant="ghost" size="sm" className="justify-start" onClick={downloadXlsx}>📊 Excel (.xlsx)</Button>
                <Button variant="ghost" size="sm" className="justify-start" onClick={downloadCsv}>📄 CSV (.csv)</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by order # or customer..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" className="relative shrink-0" onClick={() => setShowFilters(v => !v)}>
            <Settings2 className="mr-2 h-4 w-4" /> Filters
            {hasActiveFilters && <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0"><ChevronDown className="mr-2 h-4 w-4" /> Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(visibleColumns).map(([key, val]) => (
                <DropdownMenuCheckboxItem key={key} checked={val}
                  onCheckedChange={v => setVisibleColumns(p => ({ ...p, [key]: v }))}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showFilters && (
          <div className="border rounded-lg p-4 bg-muted/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date From</Label>
                <Input type="date" className="h-8 text-xs" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date To</Label>
                <Input type="date" className="h-8 text-xs" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Payment Method</Label>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    {uniqueCustomers.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            <Table className="min-w-[800px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  {visibleColumns.no       && <TableHead className="w-10 text-center">No.</TableHead>}
                  {visibleColumns.orderNo  && <TableHead>Order #</TableHead>}
                  {visibleColumns.date     && <TableHead>Date</TableHead>}
                  {visibleColumns.customer && <TableHead>Customer</TableHead>}
                  {visibleColumns.items    && <TableHead>Items</TableHead>}
                  {visibleColumns.status   && <TableHead className="text-center">Status</TableHead>}
                  {visibleColumns.discount && <TableHead className="text-right">Discount</TableHead>}
                  {visibleColumns.total    && <TableHead className="text-right">Total</TableHead>}
                  {visibleColumns.payment  && <TableHead>Payment</TableHead>}
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8} className="h-16 animate-pulse bg-muted/10" /></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No transactions found.</TableCell>
                  </TableRow>
                ) : (
                  paginated.map((order, idx) => (
                    <React.Fragment key={order.id}>
                      <TableRow className="hover:bg-muted/20">
                        <TableCell className="p-2 text-center">
                          {Number(order.shippingFee) > 0 ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(order.id)}>
                              {expandedRows[order.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          ) : null}
                        </TableCell>
                        {visibleColumns.no       && <TableCell className="text-center text-xs text-muted-foreground">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>}
                      {visibleColumns.orderNo  && <TableCell className="font-mono text-xs font-bold">{order.orderNumber?.substring(0, 8).toUpperCase()}</TableCell>}
                      {visibleColumns.date     && <TableCell className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</TableCell>}
                      {visibleColumns.customer && <TableCell className="font-medium">{order.customer?.name || <span className="text-muted-foreground italic text-xs">Walk-in</span>}</TableCell>}
                      {visibleColumns.items    && (
                        <TableCell className="min-w-[200px]">
                          <div className="flex flex-col gap-1">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium">{item.variant?.product?.name || item.variant?.sku} x{item.quantity}</span>
                                {item.description && <span className="block text-[10px] text-muted-foreground italic ml-2">- {item.description}</span>}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.status   && (
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                            order.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            order.status === 'PENDING' ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-gray-100 text-gray-700 border-gray-200"
                          )}>
                            {order.status === 'COMPLETED' ? 'Paid' : order.status === 'PENDING' ? 'Unpaid' : order.status}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.discount && <TableCell className="text-right text-xs text-orange-600">{Number(order.discountAmount || 0) > 0 ? `-$${Number(order.discountAmount).toFixed(2)}` : '—'}</TableCell>}
                      {visibleColumns.total    && <TableCell className="text-right font-bold text-emerald-600">${Number(order.totalAmount).toFixed(2)}</TableCell>}
                      {visibleColumns.payment  && (
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary border border-border/50">
                            {order.payments?.[0]?.paymentMethod?.replace('_', ' ') || '—'}
                          </span>
                        </TableCell>
                      )}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-8 w-8",
                                order.status === 'COMPLETED' ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" : "text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                              )}
                              onClick={async () => {
                                const newStatus = order.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                                if (window.confirm(`Are you sure you want to mark this order as ${newStatus === 'COMPLETED' ? 'PAID' : 'UNPAID'}?`)) {
                                  const res = await updateOrderStatus(order.id, newStatus)
                                  if (res.success) load(true)
                                }
                              }}
                              title={order.status === 'COMPLETED' ? "Status: PAID. Click to mark as UNPAID" : "Status: UNPAID. Click to mark as PAID"}
                            >
                              {order.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setPreviewOrder(order)}
                              title="Preview Receipt"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                const printWindow = window.open('', '_blank', 'width=400,height=700')
                                if (printWindow) {
                                  printWindow.document.write(buildReceiptHtml(order, template, excRate))
                                  printWindow.document.close()
                                  printWindow.focus()
                                  setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
                                }
                              }}
                              title="Reprint Receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows[order.id] && Number(order.shippingFee) > 0 && (
                        <TableRow className="bg-muted/5 border-t-0 hover:bg-muted/5">
                          <TableCell></TableCell>
                          <TableCell colSpan={8} className="p-0 border-b">
                            <div className="px-12 py-3 flex items-center gap-4 text-xs animate-in slide-in-from-top-1 fade-in duration-200">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold shadow-sm">
                                🚚 Delivery Fee
                              </span>
                              <span className="text-muted-foreground ml-auto font-medium text-indigo-600">
                                +${Number(order.shippingFee).toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2 bg-card">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} orders
            </div>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={e => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)) }}
                    aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const page = i + 1
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink href="#" onClick={e => { e.preventDefault(); setCurrentPage(page) }} isActive={currentPage === page}>{page}</PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext href="#" onClick={e => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)) }}
                    aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!previewOrder} onOpenChange={() => setPreviewOrder(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-white">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Receipt Preview
            </DialogTitle>
          </DialogHeader>
          <div className="h-[600px] w-full bg-gray-50 flex justify-center">
            {previewOrder && (
              <iframe
                title="Receipt Preview"
                srcDoc={buildReceiptHtml(previewOrder, template, excRate)}
                className="w-full h-full border-none"
              />
            )}
          </div>
          <div className="p-4 bg-muted/30 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPreviewOrder(null)}>Close</Button>
            <Button className="flex-1" onClick={() => {
              const printWindow = window.open('', '_blank', 'width=400,height=700')
              if (printWindow) {
                printWindow.document.write(buildReceiptHtml(previewOrder, template, excRate))
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
              }
            }}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
