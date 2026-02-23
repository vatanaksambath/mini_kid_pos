'use client'

import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppStore, ViewType } from "@/store/use-app-store"
import { logout } from "@/actions/auth"

const navItems: { name: string; view: ViewType; icon: any }[] = [
  { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { name: "Register (POS)", view: "pos", icon: ShoppingCart },
  { name: "Inventory", view: "inventory", icon: Package },
  { name: "Customers", view: "customers", icon: Users },
  { name: "Transactions", view: "transactions", icon: History },
  { name: "Settings", view: "settings", icon: Settings },
]

interface NavContentProps {
  onNavItemClick?: () => void
}

export default function NavContent({ onNavItemClick }: NavContentProps) {
  const router = useRouter()
  const currentView = useAppStore((state) => state.currentView)
  const setCurrentView = useAppStore((state) => state.setCurrentView)

  const handleNav = (view: ViewType) => {
    setCurrentView(view)
    if (onNavItemClick) onNavItemClick()
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">MiniKid POS</h1>
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
      <div className="p-4 border-t border-sidebar-border/50">
        <Button variant="ghost" className="justify-start text-muted-foreground hover:text-destructive w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    </div>
  )
}
