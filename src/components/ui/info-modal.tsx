'use client'

import { create } from 'zustand'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type InfoModalType = 'success' | 'error' | 'info' | 'warning'

interface InfoModalStore {
  isOpen: boolean
  title: string
  message: string
  type: InfoModalType
  onConfirm?: () => void
  show: (title: string, message: string, type?: InfoModalType, onConfirm?: () => void) => void
  hide: () => void
}

export const useInfoModal = create<InfoModalStore>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: undefined,
  show: (title, message, type = 'info', onConfirm) => set({ isOpen: true, title, message, type, onConfirm }),
  hide: () => set({ isOpen: false, onConfirm: undefined }),
}))

export function InfoModalProvider() {
  const { isOpen, title, message, type, onConfirm, hide } = useInfoModal()

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }[type]

  const colorClass = {
    success: "text-emerald-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  }[type]

  const bgClass = {
    success: "bg-emerald-50",
    error: "bg-red-50",
    warning: "bg-amber-50",
    info: "bg-blue-50",
  }[type]

  return (
    <Dialog open={isOpen} onOpenChange={hide}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={cn("p-3 rounded-full", bgClass)}>
              <Icon className={cn("h-8 w-8", colorClass)} />
            </div>
            <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6">
          <DialogDescription className="text-center text-base">
            {message}
          </DialogDescription>
          <div className="flex w-full justify-center gap-3">
            <Button
              className="w-full sm:w-auto min-w-[120px]"
              onClick={() => {
                if (onConfirm) onConfirm()
                hide()
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

