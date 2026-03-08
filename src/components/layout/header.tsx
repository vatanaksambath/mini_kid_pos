'use client'

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { User, Bell, LogOut, ScrollText, ChevronDown, ChevronRight, Sparkles, Wrench, Zap } from "lucide-react"
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
import { CHANGELOG } from "@/lib/changelog"

const TYPE_CONFIG = {
  new:         { label: 'New',         icon: Sparkles, cls: 'bg-primary/10 text-primary border-primary/20' },
  fix:         { label: 'Fix',         icon: Wrench,   cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  improvement: { label: 'Improved',   icon: Zap,      cls: 'bg-green-500/10 text-green-600 border-green-500/20' },
}

function ChangelogEntry({ entry, defaultOpen = false }: { entry: typeof CHANGELOG[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Version header — click to toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left gap-3"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-primary font-mono">v{entry.version}</span>
          <span className="text-xs text-muted-foreground">{entry.date}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {entry.changes.length} change{entry.changes.length !== 1 ? 's' : ''}
          </span>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Change list */}
      {open && (
        <ul className="px-4 py-3 space-y-2 bg-background">
          {entry.changes.map((c, i) => {
            const cfg = TYPE_CONFIG[c.type]
            const Icon = cfg.icon
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`inline-flex items-center gap-1 shrink-0 mt-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
                  <Icon className="h-2.5 w-2.5" />
                  {cfg.label}
                </span>
                <span className="text-foreground/80 leading-relaxed">{c.text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentView } = useAppStore()
  const [user, setUser] = useState<{ name?: string, email?: string, role?: string } | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)

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

  const getTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return 'Dashboard'
      case 'pos': return 'POS'
      case 'inventory': return 'Inventory'
      case 'customers': return 'Customers'
      case 'transactions': return 'Transactions'
      case 'reports': return 'Reports'
      case 'settings': return 'Configuration'
      default: return 'MiniKid POS'
    }
  }

  const latestVersion = CHANGELOG[0]?.version ?? '1.0.0'

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
            <DropdownMenuContent align="end" className="w-52 font-medium">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsChangelogOpen(true)}>
                <ScrollText className="mr-2 h-4 w-4" />
                <span className="flex-1">What&apos;s New</span>
                <span className="ml-auto text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5">
                  v{latestVersion}
                </span>
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

      {/* Profile Dialog */}
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

      {/* Changelog Dialog */}
      <Dialog open={isChangelogOpen} onOpenChange={setIsChangelogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              What&apos;s New — MiniKid POS
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Latest version: <span className="font-mono font-bold text-primary">v{latestVersion}</span>
            </p>
          </DialogHeader>

          {/* Scrollable changelog list */}
          <div className="overflow-y-auto flex-1 space-y-2 pr-1 mt-2">
            {CHANGELOG.map((entry, i) => (
              <ChangelogEntry key={entry.version} entry={entry} defaultOpen={i === 0} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
