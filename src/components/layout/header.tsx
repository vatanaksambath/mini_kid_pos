'use client'

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { User, Bell, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAppStore } from "@/store/use-app-store"
import { logout, getAuthUser } from "@/actions/auth"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentView } = useAppStore()
  const [user, setUser] = useState<{ name?: string, email?: string, role?: string } | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const authUser = await getAuthUser()
      if (authUser) setUser(authUser)
    }
    fetchUser()
  }, [])

  if (pathname === '/login') return null

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  // Map view to Title
  const getTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return 'Dashboard'
      case 'pos': return 'Register'
      case 'inventory': return 'Inventory'
      case 'customers': return 'Customers'
      case 'transactions': return 'Transactions'
      case 'reports': return 'Reports'
      case 'settings': return 'Configuration'
      default: return 'MiniKid POS'
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {getTitle(currentView)}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full hover:bg-primary/10">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 rounded-full bg-primary/5 hover:bg-primary/15 border border-primary/20 transition-all duration-200 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                {user?.name && <span className="text-sm font-semibold max-w-[100px] truncate">{user.name}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-medium">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer font-bold" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold">{user?.name || 'Loading...'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                  {user?.role || 'STAFF'}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
