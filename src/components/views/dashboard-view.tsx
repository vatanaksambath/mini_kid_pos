'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react"
import { useAppStore } from "@/store/use-app-store"
import { useEffect, useState } from "react"
import { getProducts } from "@/actions/inventory"
import { getCustomers } from "@/actions/orders"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalStock: number
  recentOrders: any[]
  topProducts: any[]
}

export default function DashboardView() {
  const setCurrentView = useAppStore((state) => state.setCurrentView)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      try {
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          getProducts(),
          getCustomers(),
          supabase
            .from('Order')
            .select('id, totalAmount, createdAt, customer:Customer(name), status')
            .order('createdAt', { ascending: false })
            .limit(5),
        ])

        const products = productsRes.data || []
        const customers = customersRes.data || []
        const orders = ordersRes.data || []

        const totalStock = products.reduce((acc: number, p: any) =>
          acc + p.variants.reduce((a2: number, v: any) =>
            a2 + (v.inventory?.reduce((a3: number, i: any) => a3 + i.quantity, 0) || 0), 0), 0)

        const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.totalAmount), 0)

        // Top 5 products by stock
        const topProducts = [...products]
          .map((p: any) => ({
            name: p.name,
            stock: p.variants.reduce((a: number, v: any) =>
              a + (v.inventory?.reduce((a2: number, i: any) => a2 + i.quantity, 0) || 0), 0),
          }))
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 5)

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalCustomers: customers.length,
          totalStock,
          recentOrders: orders,
          topProducts,
        })
      } catch (e) {
        console.error('Dashboard load error', e)
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  const statCards = stats
    ? [
        {
          label: 'Total Revenue',
          value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: DollarSign,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
        },
        {
          label: 'Orders',
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
        },
        {
          label: 'Products',
          value: stats.totalProducts.toLocaleString(),
          sub: `${stats.totalStock.toLocaleString()} units in stock`,
          icon: Package,
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
        },
        {
          label: 'Customers',
          value: stats.totalCustomers.toLocaleString(),
          icon: Users,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-6 lg:gap-8 p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Live overview of your store's performance.</p>
        </div>
        <Button size="lg" className="shadow-lg hover:shadow-primary/25 transition-all" onClick={() => setCurrentView('pos')}>
          <ShoppingCart className="mr-2 h-5 w-5" /> New Sale
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
                  <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          : statCards.map((s) => (
              <Card key={s.label} className="glass-card hover:border-primary/40 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Bottom Row: Recent Orders + Top Products */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="glass-card border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : stats?.recentOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No orders yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="p-3 font-medium">{o.customer?.name || 'Online'}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        ${Number(o.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Top Products by Stock */}
        <Card className="glass-card border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Products by Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-28 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : stats?.topProducts.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-sm text-muted-foreground">No products yet.</div>
            ) : (
              stats?.topProducts.map((p, i) => {
                const maxStock = stats.topProducts[0]?.stock || 1
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{p.stock} units</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.max(4, (p.stock / maxStock) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
