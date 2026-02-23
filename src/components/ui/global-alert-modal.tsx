'use client'

import { useAppStore } from '@/store/use-app-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GlobalAlertModal() {
  const { globalAlert: { isOpen, type, title, message }, hideGlobalAlert } = useAppStore()

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type] || Info

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  }[type]

  const bgColor = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20',
    error: 'bg-rose-50 dark:bg-rose-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    info: 'bg-blue-50 dark:bg-blue-950/20',
  }[type]

  return (
    <Dialog open={isOpen} onOpenChange={hideGlobalAlert}>
      <DialogContent className={cn("sm:max-w-md border-t-4", 
        type === 'success' ? 'border-t-emerald-500' :
        type === 'error' ? 'border-t-rose-500' :
        type === 'warning' ? 'border-t-amber-500' :
        'border-t-blue-500'
      )}>
        <DialogHeader className="flex flex-col items-center sm:items-center text-center pt-4">
          <div className={cn("p-4 rounded-full mb-4 ring-8 ring-background", bgColor)}>
            <Icon className={cn("h-8 w-8", iconColor)} strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2 max-w-[90%] mx-auto">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-6 pb-2">
          <Button 
            onClick={hideGlobalAlert} 
            className="min-w-[120px] font-semibold tracking-wide"
            variant={type === 'error' ? 'destructive' : type === 'warning' ? 'secondary' : 'default'}
          >
            Okay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
