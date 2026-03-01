'use client'

import { useAppStore } from "@/store/use-app-store"
import DashboardView from "@/components/views/dashboard-view"
import POSView from "@/components/views/pos-view"
import InventoryView from "@/components/views/inventory-view"
import CustomersView from "@/components/views/customers-view"
import TransactionsView from "@/components/views/transactions-view"
import ReportsView from "@/components/views/reports-view"
import SettingsView from "@/components/views/settings-view"
import { cn } from "@/lib/utils"

export default function AppPage() {
  const currentView = useAppStore((state) => state.currentView)

  return (
    <div className="flex-1 relative h-full overflow-hidden">
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'dashboard' && "hidden")}>
        <DashboardView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'pos' && "hidden")}>
        <POSView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'inventory' && "hidden")}>
        <InventoryView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'customers' && "hidden")}>
        <CustomersView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'transactions' && "hidden")}>
        <TransactionsView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'reports' && "hidden")}>
        <ReportsView />
      </div>
      <div className={cn("absolute inset-0 overflow-y-auto", currentView !== 'settings' && "hidden")}>
        <SettingsView />
      </div>
    </div>
  )
}
