'use client'

import { useAppStore } from "@/store/use-app-store"
import DashboardView from "@/components/views/dashboard-view"
import POSView from "@/components/views/pos-view"
import InventoryView from "@/components/views/inventory-view"
import CustomersView from "@/components/views/customers-view"
import TransactionsView from "@/components/views/transactions-view"
import SettingsView from "@/components/views/settings-view"
import { cn } from "@/lib/utils"

export default function AppPage() {
  const currentView = useAppStore((state) => state.currentView)

  return (
    <div className="flex-1 relative">
      <div className={cn(currentView === 'dashboard' ? "block" : "hidden")}><DashboardView /></div>
      <div className={cn(currentView === 'pos' ? "block" : "hidden")}><POSView /></div>
      <div className={cn(currentView === 'inventory' ? "block" : "hidden")}><InventoryView /></div>
      <div className={cn(currentView === 'customers' ? "block" : "hidden")}><CustomersView /></div>
      <div className={cn(currentView === 'transactions' ? "block" : "hidden")}><TransactionsView /></div>
      <div className={cn(currentView === 'settings' ? "block" : "hidden")}><SettingsView /></div>
    </div>
  )
}
