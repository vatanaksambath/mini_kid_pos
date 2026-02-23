'use client'

import { usePathname } from "next/navigation"
import NavContent from "./nav-content"

export default function Nav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 shadow-xl z-30">
        <NavContent />
      </aside>
    </>
  )
}
