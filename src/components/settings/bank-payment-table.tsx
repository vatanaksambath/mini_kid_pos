'use client'

import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Trash2, Edit, Plus, Upload, Banknote, CreditCard, Smartphone, Gift } from 'lucide-react'
import { useState, useTransition } from 'react'
import { createBankPaymentType, updateBankPaymentType, deleteSetting } from '@/actions/settings'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

type DBPaymentType = 'CASH' | 'CARD' | 'GIFT_CARD' | 'MOBILE_PAYMENT'

interface PaymentMethod {
  id: string
  name: string
  type: DBPaymentType
  isActive: boolean
  sortOrder: number
}

const TYPE_OPTIONS: { value: DBPaymentType; label: string; icon: any }[] = [
  { value: 'CASH',           label: 'Cash',             icon: Banknote },
  { value: 'CARD',           label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'MOBILE_PAYMENT', label: 'Mobile / Bank',     icon: Smartphone },
  { value: 'GIFT_CARD',      label: 'Gift Card',         icon: Gift },
]

const typeIcon = (type: DBPaymentType) => {
  const opt = TYPE_OPTIONS.find(o => o.value === type)
  if (!opt) return null
  const Icon = opt.icon
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
}

export default function BankPaymentTable({
  data, onRefresh,
}: { data: PaymentMethod[]; onRefresh: () => void }) {
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null)

  // Form fields
  const [name, setName]             = useState('')
  const [type, setType]             = useState<DBPaymentType>('CASH')
  const [isActive, setIsActive]     = useState(true)
  const [sortOrder, setSortOrder]   = useState('0')

  const reset = () => {
    setName(''); setType('CASH'); setIsActive(true); setSortOrder('0')
  }

  const handleOpenCreate = () => { setEditItem(null); reset(); setModalOpen(true) }
  const handleOpenEdit = (item: PaymentMethod) => {
    setEditItem(item)
    setName(item.name)
    setType(item.type || 'MOBILE_PAYMENT')
    setIsActive(item.isActive ?? true)
    setSortOrder(String(item.sortOrder ?? 0))
    setModalOpen(true)
  }



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    startTransition(async () => {
      const payload = {
        name, type,
        isActive,
        sortOrder: parseInt(sortOrder) || 0,
      }
      const res = editItem
        ? await updateBankPaymentType(editItem.id, payload)
        : await createBankPaymentType(payload)
      if (res.success) { setModalOpen(false); onRefresh() }
      else showGlobalAlert('error', 'Error', res.error || 'Operation failed')
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment method?')) return
    const res = await deleteSetting('bank', id)
    if (res.success) onRefresh()
    else showGlobalAlert('error', 'Error', res.error || 'Operation failed')
  }

  const handleToggleActive = (item: PaymentMethod) => {
    startTransition(async () => {
      await updateBankPaymentType(item.id, { isActive: !item.isActive })
      onRefresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">All active methods appear as tiles in POS checkout.</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm"><Plus className="mr-2 h-4 w-4" /> Add Method</Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-8">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type (DB)</TableHead>
              <TableHead>Type (DB)</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm italic">
                  No payment methods yet. Add Cash, Card, ABA, Wing, etc.
                </TableCell>
              </TableRow>
            ) : (
              data.map(item => (
                <TableRow key={item.id} className={cn(!item.isActive && 'opacity-40')}>
                  <TableCell className="text-xs text-muted-foreground">{item.sortOrder}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    {typeIcon(item.type)}
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border">
                      {item.type?.replace('_', ' ')}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <Switch checked={!!item.isActive} onCheckedChange={() => handleToggleActive(item)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Display Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cash, ABA Bank, Wing..." required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Payment Type (DB)</Label>
                <Select value={type} onValueChange={v => setType(v as DBPaymentType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="0" className="h-9" />
              </div>

              <div className="col-span-2 flex items-center justify-between py-1">
                <Label className="text-xs">Active in POS checkout</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
