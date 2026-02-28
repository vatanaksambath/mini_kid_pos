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
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'pos' && <POSView />}
      {currentView === 'inventory' && <InventoryView />}
      {currentView === 'customers' && <CustomersView />}
      {currentView === 'transactions' && <TransactionsView />}
      {currentView === 'settings' && <SettingsView />}
    </div>
  )
}
