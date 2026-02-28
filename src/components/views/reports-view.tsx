'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getSalesReport, getTopSellingProducts } from '@/actions/reports'
import { parseUTCDate } from '@/lib/receipt-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Download, RefreshCw,
  PieChart as PieChartIcon, Calendar as CalendarIcon, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function ReportsView() {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  
  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const loadData = async () => {
    setLoading(true)
    const [salesRes, productsRes] = await Promise.all([
      getSalesReport(dateFrom, dateTo),
      getTopSellingProducts(5)
    ])
    if (salesRes.success) setSalesData(salesRes.data || [])
    if (productsRes.success) setTopProducts(productsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [dateFrom, dateTo])

  // Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0
    let totalCost = 0
    let totalOrders = salesData.length

    salesData.forEach(order => {
      totalRevenue += Number(order.totalAmount)
      order.items?.forEach((item: any) => {
        totalCost += Number(item.costPrice || 0) * item.quantity
      })
    })

    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return { totalRevenue, totalCost, totalProfit, totalOrders, profitMargin }
  }, [salesData])

  const downloadReport = () => {
    const rows = salesData.map(order => ({
      'Date': parseUTCDate(order.createdAt).toLocaleDateString(),
      'Order #': order.orderNumber || order.id.substring(0, 8),
      'Revenue ($)': Number(order.totalAmount).toFixed(2),
      'Status': order.status,
      'Items Count': order.items?.length || 0
    }))
    
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report')
    XLSX.writeFile(wb, `report_${dateFrom}_to_${dateTo}.xlsx`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BarChart3 className="h-8 w-8" /> Business Reports
          </h2>
          <p className="text-muted-foreground">Monitor your sales, costs, and profit progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button variant="default" size="sm" onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="glass-card border-primary/10">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Start Date
            </Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> End Date
            </Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10" />
          </div>
          <div className="flex-none">
            <Button variant="secondary" className="h-10 px-6">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-blue-500/20 shadow-lg shadow-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +0% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20 shadow-lg shadow-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Cost</CardTitle>
            <ShoppingBag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-red-500" /> -0% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600">
              {stats.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sale Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed orders in period</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section (Mock Layout for now, user needs charts) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass-card h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Sales Trend
            </CardTitle>
            <CardDescription>Daily revenue and profit visualization</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center border-t border-dashed">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Revenue chart will be displayed here.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 glass-card h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" /> Top Selling Products
            </CardTitle>
            <CardDescription>Highest volume items sold in period</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <span className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    <span className="text-sm font-medium truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary">{p.quantity} sold</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Table */}
      <Card className="glass-card shadow-xl border-primary/5">
        <CardHeader>
          <CardTitle>Sales Breakdown</CardTitle>
          <CardDescription>Detailed transaction log for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 font-bold border-b">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y overflow-auto h-[300px]">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="h-12 bg-muted/10 animate-pulse" /></tr>)
                ) : salesData.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No records found for this period.</td></tr>
                ) : (
                  salesData.map((order, idx) => {
                    const cost = order.items?.reduce((sum: number, item: any) => sum + (Number(item.costPrice || 0) * item.quantity), 0)
                    const revenue = Number(order.totalAmount)
                    const profit = revenue - cost
                    
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{parseUTCDate(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono text-xs opacity-60 uppercase">{order.orderNumber || order.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">${revenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-red-500">-${cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600">${profit.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            order.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {order.status === 'COMPLETED' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
