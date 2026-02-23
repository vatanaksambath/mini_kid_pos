'use client'

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu, User, Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import NavContent from "./nav-content"
import { useAppStore } from "@/store/use-app-store"

export default function Header() {
  const pathname = usePathname()
  const { currentView } = useAppStore()
  const [open, setOpen] = useState(false)

  if (pathname === '/login') return null

  // Map view to Title
  const getTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return 'Dashboard'
      case 'pos': return 'Register'
      case 'inventory': return 'Inventory'
      case 'customers': return 'Customers'
      case 'settings': return 'Configuration'
      default: return 'MiniKid POS'
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-sidebar">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <NavContent onNavItemClick={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {getTitle(currentView)}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full hover:bg-primary/10">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <ModeToggle />
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all duration-200">
            <User className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  )
}
