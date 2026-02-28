'use client'

import { LayoutDashboard, Package, ShoppingCart, Users, Settings, History, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore, ViewType } from "@/store/use-app-store"
import { useState, useEffect } from "react"

const navItems: { name: string; view: ViewType; icon: any }[] = [
  { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { name: "Register (POS)", view: "pos", icon: ShoppingCart },
  { name: "Inventory", view: "inventory", icon: Package },
  { name: "Customers", view: "customers", icon: Users },
  { name: "Transactions", view: "transactions", icon: History },
  { name: "Reports", view: "reports", icon: BarChart3 },
  { name: "Settings", view: "settings", icon: Settings },
]

interface NavContentProps {
  onNavItemClick?: () => void
}

export default function NavContent({ onNavItemClick }: NavContentProps) {
  const currentView = useAppStore((state) => state.currentView)
  const setCurrentView = useAppStore((state) => state.setCurrentView)
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleNav = (view: ViewType) => {
    setCurrentView(view)
    if (onNavItemClick) onNavItemClick()
  }

  const pad = (n: number) => n.toString().padStart(2, '0')
  const formattedDateTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-xl">
      <div className="p-6 pb-6 flex items-center gap-3">
        <img src="/logo.png" alt="Mini Kid POS" className="h-10 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300" />
        <h1 className="text-xl font-bold tracking-tight text-primary">MiniKid POS</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.view
          return (
            <button 
              key={item.name} 
              onClick={() => handleNav(item.view)}
              className="w-full text-left outline-none"
            >
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden relative",
                isActive 
                  ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-[0_0_15px_-3px_#4f46e580] translate-x-1 border border-white/20" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
              )}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border/50 text-xs text-muted-foreground flex flex-col space-y-1 items-center justify-center opacity-60">
        <div className="font-medium tracking-wide">Version 1.0.0</div>
        {mounted ? (
          <div className="tabular-nums font-medium">
            {formattedDateTime}
          </div>
        ) : (
          <div className="tabular-nums font-medium invisible">Placeholder</div>
        )}
      </div>
    </div>
  )
}
