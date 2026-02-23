'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit, Plus, Gift } from 'lucide-react'
import { useState, useTransition } from 'react'
import { createLoyaltyPrize, updateLoyaltyPrize, deleteLoyaltyPrize } from '@/actions/settings'

interface Prize {
  id: string
  name: string
  pointsCost: number
  description?: string
}

export default function LoyaltyPrizeTable({ data, onRefresh }: { data: Prize[]; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Prize | null>(null)
  const [name, setName] = useState('')
  const [pointsCost, setPointsCost] = useState('')
  const [description, setDescription] = useState('')

  const handleOpenCreate = () => {
    setEditItem(null)
    setName('')
    setPointsCost('')
    setDescription('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Prize) => {
    setEditItem(item)
    setName(item.name)
    setPointsCost(item.pointsCost.toString())
    setDescription(item.description || '')
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !pointsCost) return

    startTransition(async () => {
      let res
      const cost = parseInt(pointsCost) || 0
      if (editItem) {
        res = await updateLoyaltyPrize(editItem.id, name, cost, description || undefined)
      } else {
        res = await createLoyaltyPrize(name, cost, description || undefined)
      }

      if (res.success) {
        setModalOpen(false)
        onRefresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prize?')) return
    const res = await deleteLoyaltyPrize(id)
    if (res.success) {
      onRefresh()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" /> Loyalty Prize Pool
        </h3>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Prize
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prize Name</TableHead>
              <TableHead>Points Required</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No prizes configured yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                      {item.pointsCost.toLocaleString()} pts
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Prize' : 'Add New Prize'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prize Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Free Coffee" required />
            </div>
            <div className="space-y-2">
              <Label>Points Required</Label>
              <Input type="number" value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} placeholder="e.g. 500" required min="1" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the prize..." className="resize-y" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Prize'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
