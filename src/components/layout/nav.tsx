'use client'

import { usePathname } from "next/navigation"
import NavContent from "./nav-content"
import { useAppStore, ViewType } from "@/store/use-app-store"
import { LayoutDashboard, MonitorPlay, Package, Users, Settings, History, BarChart3, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function Nav() {
  const pathname = usePathname()
  const { currentView, setCurrentView } = useAppStore()

  if (pathname === '/login') return null

  const tabs: { name: string; view: ViewType; icon: any }[] = [
    { name: 'POS', view: 'pos', icon: MonitorPlay },
    { name: 'Inventory', view: 'inventory', icon: Package },
    { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
    { name: 'Customers', view: 'customers', icon: Users },
  ]

  const moreItems: { name: string; view: ViewType; icon: any }[] = [
    { name: "Transactions", view: "transactions", icon: History },
    { name: "Reports", view: "reports", icon: BarChart3 },
    { name: "Settings", view: "settings", icon: Settings },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 shadow-xl z-30">
        <NavContent />
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = currentView === tab.view
            return (
              <button
                key={tab.name}
                onClick={() => setCurrentView(tab.view)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.name}</span>
              </button>
            )
          })}

          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground outline-none">
                <Menu className="h-5 w-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-10">
              <SheetHeader className="text-left mb-6">
                <SheetTitle>Quick Access</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-1 gap-4">
                {moreItems.map((item) => {
                  const isActive = currentView === item.view
                  return (
                    <button
                      key={item.name}
                      onClick={() => setCurrentView(item.view)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="font-semibold">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}
import { cn } from "@/lib/utils"
